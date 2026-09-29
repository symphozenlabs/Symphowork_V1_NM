"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password, confirmPassword }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Unable to change your password.");
      window.location.assign("/platform");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change your password.");
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold">New password<Input required type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2" /></label><label className="block text-sm font-semibold">Confirm new password<Input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2" /></label>{error && <p role="alert" className="rounded-lg bg-[#fff1f1] p-3 text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={busy}>{busy ? "Saving…" : "Set new password"}</Button></form>;
}
