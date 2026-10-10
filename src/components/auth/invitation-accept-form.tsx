"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Building2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Preview = {
  organization: { name: string; slug: string };
  invitedEmail: string;
  expiresAt: string;
};

export function InvitationAcceptForm({ token }: { token: string }) {
  const [preview, setPreview] = useState<Preview>();
  const [error, setError] = useState<string>();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { showToast } = useToast();

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

    if (
      password.length < 12 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      const valMsg = "Password must be 12 characters with upper, lower, and numeric characters.";
      showToast({ type: "error", title: "Password policy", message: valMsg });
      setError(valMsg);
      return;
    }
    if (password !== confirmPassword) {
      const matchMsg = "Passwords do not match.";
      showToast({ type: "error", title: "Validation error", message: matchMsg });
      setError(matchMsg);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/invitations/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, fullName: fullName || undefined, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errMsg = body.error?.message ?? "Unable to accept invitation.";
        showToast({ type: "error", title: "Invitation failed", message: errMsg });
        setError(errMsg);
        return;
      }
      showToast({
        type: "success",
        title: "Invitation accepted",
        message: "Welcome to your workspace! Redirecting...",
      });
      setDone(true);
      window.setTimeout(() => window.location.assign("/app"), 400);
    } catch {
      const connMsg = "Unable to accept invitation. Check your connection and try again.";
      showToast({ type: "error", title: "Connection error", message: connMsg });
      setError(connMsg);
    } finally {
      setLoading(false);
    }
  }

  if (error && !preview) {
    return (
      <div className="space-y-4 rounded-xl border border-danger-border bg-danger-bg p-5 text-sm text-destructive">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
        <Link
          className="inline-flex font-semibold text-primary underline underline-offset-4 hover:text-secondary"
          href="/login"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted">
        <p>Verifying invitation details…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-success-border bg-success-bg p-5 text-sm text-success">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="font-semibold text-foreground">Invitation accepted. Opening your workspace…</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit} aria-busy={loading}>
      {/* Organization preview badge card */}
      <div className="rounded-xl border border-border bg-background/60 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Building2 className="size-4 text-primary" aria-hidden="true" />
          <span>{preview.organization.name}</span>
        </div>
        <div className="mt-2.5 space-y-1">
          <label htmlFor="invitation-email" className="block text-xs font-medium text-muted">
            Invited email address
          </label>
          <Input
            id="invitation-email"
            value={preview.invitedEmail}
            readOnly
            aria-readonly="true"
            className="bg-surface cursor-not-allowed opacity-90 text-foreground"
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted">
        Set your account password below to complete workspace onboarding. No separate email verification is required.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="invitation-fullname" className="block text-sm font-semibold text-foreground">
          Full name
        </label>
        <Input
          id="invitation-fullname"
          minLength={2}
          placeholder="Your display name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="invitation-password" className="block text-sm font-semibold text-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            id="invitation-password"
            required
            type={showPassword ? "text" : "password"}
            minLength={12}
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            aria-describedby="invitation-password-requirements"
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p id="invitation-password-requirements" className="text-xs text-muted">
          Use at least 12 characters with uppercase, lowercase, and numeric characters.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="invitation-confirmpassword" className="block text-sm font-semibold text-foreground">
          Confirm password
        </label>
        <div className="relative">
          <Input
            id="invitation-confirmpassword"
            required
            type={showConfirmPassword ? "text" : "password"}
            minLength={12}
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Button className="w-full mt-2" type="submit" disabled={loading}>
        {loading ? "Accepting invitation…" : "Accept Invitation & Continue"}
      </Button>
    </form>
  );
}
