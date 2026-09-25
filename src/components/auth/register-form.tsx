"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [state, setState] = useState<{ kind: "idle" | "error" | "success"; message?: string; delivery?: string }>({ kind: "idle" });
  const strength = [form.password.length >= 12, /[A-Z]/.test(form.password), /[a-z]/.test(form.password), /\d/.test(form.password)].filter(Boolean).length;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) return setState({ kind: "error", message: "Passwords do not match." });
    setState({ kind: "idle" });
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setState({ kind: "error", message: body.error?.message ?? "Registration failed." });
    setState({ kind: "success", message: "Your account was created. Check your email to verify it before signing in.", delivery: body.delivery });
  }
  return <form className="mt-6 space-y-4" onSubmit={submit}>
    {state.kind === "error" && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}
    {state.kind === "success" ? <div className="space-y-4 rounded-lg bg-green-50 p-4 text-sm text-green-800"><p>{state.message}</p>{state.delivery === "not_configured" && <p>Email delivery is not configured yet. Ask an administrator for a verification link or configure the approved email provider.</p>}<Link className="font-semibold underline" href="/verify-email">Open verification</Link></div> : <>
      <label className="block text-sm font-medium">Full name<Input required minLength={2} maxLength={160} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
      <label className="block text-sm font-medium">Email<Input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="block text-sm font-medium">Password<Input required type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><span className="mt-1 block text-xs text-muted">Use 12+ characters with uppercase, lowercase, and a number ({strength}/4 checks).</span></label>
      <label className="block text-sm font-medium">Confirm password<Input required type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>
      <Button className="w-full" type="submit">Create account</Button>
    </>}
  </form>;
}
