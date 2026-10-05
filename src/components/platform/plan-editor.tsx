"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { planCodeSchema, planNameSchema } from "@/modules/platform/validation";

export function PlanEditor({
  plan,
  onSaved,
}: {
  plan?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    monthlyPriceCents: number | null;
    annualPriceCents: number | null;
    currency: string;
    trialDays: number;
    maxUsers: number | null;
    maxStorageBytes: number | null;
    billingInterval: string;
    active: boolean;
  };
  onSaved?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState(plan?.code ?? "");
  const [name, setName] = useState(plan?.name ?? "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!plan) {
      const codeRes = planCodeSchema.safeParse(trimmedCode);
      if (!codeRes.success) {
        setIsError(true);
        setMessage(codeRes.error.issues[0]?.message ?? "Invalid plan code.");
        return;
      }
    }

    const nameRes = planNameSchema.safeParse(trimmedName);
    if (!nameRes.success) {
      setIsError(true);
      setMessage(nameRes.error.issues[0]?.message ?? "Invalid plan name.");
      return;
    }

    setSaving(true);
    const form = new FormData(event.currentTarget);
    const number = (key: string) => {
      const value = form.get(key)?.toString() ?? "";
      return value === "" ? null : Number(value);
    };

    const payload = {
      code: plan ? plan.code : trimmedCode,
      name: trimmedName,
      description: form.get("description")?.toString().trim() || undefined,
      monthlyPriceCents: number("monthlyPriceCents"),
      annualPriceCents: number("annualPriceCents"),
      currency: (form.get("currency")?.toString().trim() || "INR").toUpperCase(),
      trialDays: Number(form.get("trialDays") ?? 0),
      maxUsers: number("maxUsers"),
      maxStorageBytes: number("maxStorageBytes"),
      billingInterval: form.get("billingInterval"),
      active: form.get("active") === "on",
    };

    try {
      const response = await fetch(plan ? `/api/platform/plans/${plan.id}` : "/api/platform/plans", {
        method: plan ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        setIsError(false);
        setMessage("Saved successfully.");
        if (onSaved) {
          onSaved();
        } else {
          window.location.reload();
        }
      } else {
        setIsError(true);
        setMessage(body.error?.message ?? "Unable to save plan.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
      <label className="text-sm">
        Code
        <input
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
          readOnly={Boolean(plan)}
          required
          placeholder="e.g. BUSINESS"
          className="mt-1 w-full rounded-lg border p-2 font-mono uppercase"
        />
      </label>
      <label className="text-sm">
        Name
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Business Tier"
          className="mt-1 w-full rounded-lg border p-2"
        />
      </label>
      <label className="text-sm sm:col-span-2">
        Description
        <input
          name="description"
          defaultValue={plan?.description ?? ""}
          className="mt-1 w-full rounded-lg border p-2"
        />
      </label>
      <label className="text-sm">
        Monthly price (minor units)
        <input
          name="monthlyPriceCents"
          type="number"
          min="0"
          defaultValue={plan?.monthlyPriceCents ?? ""}
          className="mt-1 w-full rounded-lg border p-2"
        />
      </label>
      <label className="text-sm">
        Annual price (minor units)
        <input
          name="annualPriceCents"
          type="number"
          min="0"
          defaultValue={plan?.annualPriceCents ?? ""}
          className="mt-1 w-full rounded-lg border p-2"
        />
      </label>
      <label className="text-sm">
        Currency
        <input
          name="currency"
          defaultValue={plan?.currency ?? "INR"}
          maxLength={3}
          className="mt-1 w-full rounded-lg border p-2 uppercase"
        />
      </label>
      <label className="text-sm">
        Trial days
        <input
          name="trialDays"
          type="number"
          min="0"
          defaultValue={plan?.trialDays ?? 0}
          className="mt-1 w-full rounded-lg border p-2"
        />
      </label>
      <label className="text-sm">
        Active employees limit
        <input
          name="maxUsers"
          type="number"
          min="0"
          defaultValue={plan?.maxUsers ?? ""}
          className="mt-1 w-full rounded-lg border p-2"
        />
      </label>
      <label className="text-sm">
        Billing interval
        <select
          name="billingInterval"
          defaultValue={plan?.billingInterval ?? "monthly"}
          className="mt-1 w-full rounded-lg border p-2"
        >
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input name="active" type="checkbox" defaultChecked={plan?.active ?? true} /> Active
      </label>
      <div className="sm:col-span-2">
        <Button disabled={saving}>{saving ? "Saving…" : plan ? "Save plan" : "Create plan"}</Button>
        {message && (
          <span className={`ml-3 text-sm ${isError ? "text-destructive font-semibold" : "text-emerald-700"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
