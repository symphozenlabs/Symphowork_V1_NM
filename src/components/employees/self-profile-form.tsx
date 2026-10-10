"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function SelfProfileForm({
  initial
}: {
  initial: { firstName: string; lastName: string; personalEmail: string | null; phone: string | null };
}) {
  const [form, setForm] = useState({
    firstName: initial.firstName,
    lastName: initial.lastName,
    personalEmail: initial.personalEmail ?? "",
    phone: initial.phone ?? ""
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/app/me/employee", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        const succ = "Profile updated.";
        setMessage(succ);
        showToast({ type: "success", title: "Profile updated", message: "Your employee details were saved." });
      } else {
        const err = body.error?.message ?? "Unable to update profile.";
        setMessage(err);
        showToast({ type: "error", title: "Update failed", message: err });
      }
    } catch {
      const netErr = "Network error. Please try again.";
      setMessage(netErr);
      showToast({ type: "error", title: "Connection error", message: netErr });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {[
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["personalEmail", "Personal email"],
        ["phone", "Phone"]
      ].map(([key, label]) => (
        <label key={key} className="block text-sm font-semibold">
          {label}
          <Input
            value={form[key as keyof typeof form]}
            onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            className="mt-2"
          />
        </label>
      ))}
      {message && <p role="status" className="text-sm text-muted">{message}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save permitted details"}
      </Button>
    </form>
  );
}

