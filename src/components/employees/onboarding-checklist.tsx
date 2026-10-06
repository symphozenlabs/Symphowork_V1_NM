"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Item = { id: string; title: string; status: "pending" | "completed" | "blocked" };

export function OnboardingChecklist({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/app/employees/${employeeId}/onboarding`);
    const b = await r.json();
    if (!r.ok) throw new Error(b.error?.message ?? "Unable to load onboarding.");
    setItems(b.items ?? []);
    setStatus(b.onboarding?.status);
  }, [employeeId]);

  useEffect(() => {
    void load().catch((e) => setMessage(e.message));
  }, [load]);

  const isCompleted = status === "completed";

  async function toggle(item: Item) {
    if (isCompleted) return;
    setBusy(true);
    const r = await fetch(`/api/app/employees/${employeeId}/onboarding`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: item.id, status: item.status === "completed" ? "pending" : "completed" }),
    });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) setMessage(b.error?.message ?? "Unable to update checklist.");
    else await load();
    setBusy(false);
  }

  async function complete() {
    if (isCompleted) return;
    setBusy(true);
    const r = await fetch(`/api/app/employees/${employeeId}/onboarding`, { method: "POST" });
    const b = await r.json().catch(() => ({}));
    setMessage(r.ok ? "Onboarding completed." : b.error?.message ?? "Complete all checklist items first.");
    if (r.ok) {
      await load();
      router.refresh();
    }
    setBusy(false);
  }

  const completedCount = items.filter((item) => item.status === "completed").length;

  return (
    <div className="space-y-3">
      {message && (
        <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          {message}
        </p>
      )}
      <p className="text-sm text-muted">
        Status: <span className="font-semibold text-foreground">{status ?? "Loading…"}</span> · {completedCount}/{items.length} complete
      </p>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted">No onboarding checklist items found.</p>
      ) : (
        items.map((item) => (
          <label key={item.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              checked={item.status === "completed"}
              disabled={busy || isCompleted}
              onChange={() => void toggle(item)}
            />
            {item.title}
          </label>
        ))
      )}
      {isCompleted ? (
        <p className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          ✓ Onboarding completed
        </p>
      ) : (
        <Button
          disabled={busy || !items.length || items.some((item) => item.status !== "completed")}
          onClick={() => void complete()}
        >
          {busy ? "Completing…" : "Complete onboarding"}
        </Button>
      )}
    </div>
  );
}
