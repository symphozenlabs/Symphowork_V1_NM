"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Category = { id: string; name: string };
type Claim = { id: string; claimNumber: string; title: string; totalAmount: number; status: string };
type Item = { categoryId: string; expenseDate: string; description: string; amount: string; receipt: File | null };

const emptyItem = (): Item => ({ categoryId: "", expenseDate: "", description: "", amount: "", receipt: null });

export function ExpenseDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [header, setHeader] = useState({ title: "", description: "", expenseDate: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const loadClaims = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/app/expenses");
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to load claims.");
      setClaims(body.claims);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([
      fetch("/api/app/expenses/categories")
        .then((response) => response.json())
        .then((body) => {
          if (body.success) setCategories(body.categories);
        }),
      loadClaims()
    ]);
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [items]);
  const updateItem = (index: number, changes: Partial<Item>) =>
    setItems((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...changes } : row)));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/app/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...header,
          items: items.map((item) => ({
            categoryId: item.categoryId,
            expenseDate: item.expenseDate,
            description: item.description,
            amount: Number(item.amount)
          }))
        })
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Unable to create claim.");
      const detailResponse = await fetch(`/api/app/expenses/${body.claim.id}`);
      const detail = await detailResponse.json();
      if (!detailResponse.ok || !detail.success) throw new Error("Claim was created, but its items could not be loaded for receipt attachment.");
      for (const [index, item] of items.entries()) {
        if (item.receipt) {
          const form = new FormData();
          form.set("file", item.receipt);
          const uploadResponse = await fetch(`/api/app/expenses/items/${detail.items[index].id}/receipt`, {
            method: "POST",
            body: form
          });
          const uploadBody = await uploadResponse.json();
          if (!uploadResponse.ok || !uploadBody.success) throw new Error(uploadBody.error?.message ?? "Receipt upload failed.");
        }
      }
      const submitResponse = await fetch(`/api/app/expenses/${body.claim.id}/submit`, { method: "POST" });
      const submitted = await submitResponse.json();
      if (!submitResponse.ok || !submitted.success) throw new Error(submitted.error?.message ?? "Draft created; submission needs attention.");
      const succMsg = `${body.claim.claimNumber} submitted for approval.`;
      setMessage(succMsg);
      showToast({ type: "success", title: "Claim submitted", message: succMsg });
      setHeader({ title: "", description: "", expenseDate: "" });
      setItems([emptyItem()]);
      await loadClaims();
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unable to submit claim.";
      setError(msg);
      showToast({ type: "error", title: "Claim failed", message: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <form onSubmit={submit} className="grid gap-4 bg-surface p-6 rounded-xl border shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1 text-sm md:col-span-2">
            Title
            <Input required value={header.title} onChange={(event) => setHeader({ ...header, title: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm">
            Expense date
            <Input required type="date" value={header.expenseDate} onChange={(event) => setHeader({ ...header, expenseDate: event.target.value })} />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          Description
          <textarea
            className="min-h-20 rounded-lg border bg-surface p-3"
            value={header.description}
            onChange={(event) => setHeader({ ...header, description: event.target.value })}
          />
        </label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-primary">Items</p>
            <p className="font-semibold text-primary">Total: ₹{total.toFixed(2)}</p>
          </div>
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-xl border p-3 md:grid-cols-4 bg-[#F7F8FB]">
              <select
                required
                aria-label={`Category ${index + 1}`}
                className="h-10 rounded-lg border bg-surface px-3"
                value={item.categoryId}
                onChange={(event) => updateItem(index, { categoryId: event.target.value })}
              >
                <option value="">Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input
                required
                aria-label={`Expense date ${index + 1}`}
                type="date"
                value={item.expenseDate}
                onChange={(event) => updateItem(index, { expenseDate: event.target.value })}
              />
              <Input
                required
                aria-label={`Description ${index + 1}`}
                placeholder="Description"
                value={item.description}
                onChange={(event) => updateItem(index, { description: event.target.value })}
              />
              <Input
                required
                aria-label={`Amount ${index + 1}`}
                min="0.01"
                step="0.01"
                type="number"
                placeholder="Amount"
                value={item.amount}
                onChange={(event) => updateItem(index, { amount: event.target.value })}
              />
              <label className="grid gap-1 text-xs text-muted md:col-span-3">
                Receipt (optional)
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(event) => updateItem(index, { receipt: event.target.files?.[0] ?? null })}
                />
              </label>
              {items.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setItems(items.filter((_, rowIndex) => rowIndex !== index))}
                >
                  Remove item
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setItems([...items, emptyItem()])}>
            Add item
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit claim"}
          </Button>
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {message && <p aria-live="polite" className="text-sm text-success">{message}</p>}
      </form>
      <div className="space-y-3">
        <p className="font-semibold text-primary">Recent claims</p>
        {loading ? (
          <p className="text-sm text-muted">Loading claims…</p>
        ) : claims.length === 0 ? (
          <p className="text-sm text-muted">No claims yet.</p>
        ) : (
          claims.map((claim) => (
            <a
              key={claim.id}
              href={`/app/expenses/${claim.id}`}
              className="block rounded-xl border p-4 hover:bg-surface transition-colors shadow-sm"
            >
              <div className="flex justify-between gap-3">
                <span className="font-medium text-primary">{claim.claimNumber}</span>
                <span className="text-sm capitalize text-muted">{claim.status.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {claim.title} · ₹{claim.totalAmount}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

