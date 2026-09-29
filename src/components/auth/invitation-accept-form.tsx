"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Preview = { organization: { name: string; slug: string }; invitedEmail: string; expiresAt: string };
export function InvitationAcceptForm({ token }: { token: string }) {
  const [preview, setPreview] = useState<Preview>();
  const [error, setError] = useState<string>();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/invitations/accept/preview?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? "Invitation unavailable.");
        setPreview(body.invitation);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Invitation unavailable."));
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be 12 characters with upper, lower, and numeric characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/invitations/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, fullName: fullName || undefined, password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error?.message ?? "Unable to accept invitation.");
        return;
      }
      setDone(true);
      window.setTimeout(() => window.location.assign("/app"), 400);
    } catch {
      setError("Unable to accept invitation. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (error && !preview) return <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}<Link className="mt-3 block font-semibold underline" href="/login">Go to sign in</Link></div>;
  if (!preview) return <p className="mt-6 text-sm text-muted">Checking invitation…</p>;
  if (done) return <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">Invitation accepted. Opening your workspace…</p>;

  return <form className="mt-6 space-y-4" onSubmit={submit} aria-busy={loading}>
    <div className="rounded-lg border p-4 text-sm"><p className="font-semibold">{preview.organization.name}</p><label className="mt-2 block text-muted">Invited email<Input className="mt-1" value={preview.invitedEmail} readOnly aria-readonly="true" /></label></div>
    <p className="text-sm text-muted">Create your Business Owner password below. No separate registration or email verification is required for this invitation.</p>
    <label className="block text-sm font-medium">Full name<Input minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={loading} /></label>
    <label className="block text-sm font-medium">Password<Input required type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} aria-describedby="invitation-password-requirements" /></label>
    <p id="invitation-password-requirements" className="text-xs text-muted">Use at least 12 characters with at least one uppercase letter, one lowercase letter, and one number.</p>
    <label className="block text-sm font-medium">Confirm password<Input required type="password" minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={loading} /></label>
    {error && <p role="alert" className="rounded-lg bg-[#fff1f1] p-3 text-sm text-destructive">{error}</p>}
    <Button className="w-full" type="submit" disabled={loading}>{loading ? "Accepting invitation…" : "Accept Invitation & Continue"}</Button>
  </form>;
}
