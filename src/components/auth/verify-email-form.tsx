"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function VerifyEmailForm({ token }: { token?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<string>();
  const [error, setError] = useState<string>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const { showToast } = useToast();

  async function verify() {
    if (!token) return;
    setVerifying(true);
    setError(undefined);

    try {
      const r = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const b = await r.json().catch(() => ({}));

      if (!r.ok) {
        const errMsg = b.error?.message ?? "This verification link is invalid or expired.";
        showToast({ type: "error", title: "Verification failed", message: errMsg });
        return setError(errMsg);
      }

      const successMsg = "Email verified successfully. You can now sign in.";
      showToast({ type: "success", title: "Email verified", message: successMsg });
      setState(successMsg);
    } catch {
      const connMsg = "Unable to complete verification. Please try again.";
      showToast({ type: "error", title: "Connection error", message: connMsg });
      setError(connMsg);
    } finally {
      setVerifying(false);
    }
  }

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setResending(true);
    setError(undefined);

    try {
      const r = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const b = await r.json().catch(() => ({}));

      const msg =
        b.delivery === "not_configured"
          ? "Email delivery is not configured, so no verification email was sent."
          : "If the account is eligible, verification instructions will be sent.";
      showToast({ type: "info", title: "Verification instructions", message: msg });
      setState(msg);
    } catch {
      const errMsg = "Unable to request verification link. Please check your connection.";
      showToast({ type: "error", title: "Request failed", message: errMsg });
      setError(errMsg);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-6">
      {token && (
        <div className="space-y-3">
          <Button className="w-full" onClick={verify} disabled={verifying}>
            {verifying ? "Verifying email…" : "Complete email verification"}
          </Button>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {state && (
        <div className="flex items-start gap-2.5 rounded-xl border border-success-border bg-success-bg p-4 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="font-semibold text-foreground">{state}</p>
        </div>
      )}

      <form className="space-y-3 border-t border-border pt-5" onSubmit={resend}>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Mail className="size-4 text-muted" aria-hidden="true" />
          <span>Need another verification link?</span>
        </div>
        <p className="text-xs text-muted">
          Enter your registered email address to receive fresh verification instructions.
        </p>
        <Input
          required
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={resending}
        />
        <Button variant="secondary" className="w-full" type="submit" disabled={resending}>
          {resending ? "Sending instructions…" : "Resend verification link"}
        </Button>
      </form>

      <div className="text-center">
        <Link
          className="inline-flex items-center font-semibold text-sm text-primary transition-colors hover:underline hover:text-secondary"
          href="/login"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
