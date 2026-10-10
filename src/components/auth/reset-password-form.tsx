"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (password !== confirm) {
      const mismatch = "Passwords do not match.";
      showToast({ type: "error", title: "Validation error", message: mismatch });
      return setError(mismatch);
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const b = await r.json().catch(() => ({}));

      if (!r.ok) {
        const errMsg = b.error?.message ?? "This reset link is invalid or expired.";
        showToast({ type: "error", title: "Reset failed", message: errMsg });
        return setError(errMsg);
      }

      showToast({
        type: "success",
        title: "Password updated",
        message: "Your password was reset successfully.",
      });
      setMessage("Your password was reset successfully.");
    } catch {
      const connMsg = "Unable to reset password. Please check your connection and try again.";
      showToast({ type: "error", title: "Connection error", message: connMsg });
      setError(connMsg);
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="space-y-4 rounded-xl border border-success-border bg-success-bg p-5 text-sm text-success">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="font-semibold text-foreground">{message}</p>
        </div>
        <div className="pt-2">
          <Link
            className="inline-flex items-center font-semibold text-primary underline underline-offset-4 hover:text-secondary"
            href="/login"
          >
            Sign in with new password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="reset-new-password" className="block text-sm font-semibold text-foreground">
          New password
        </label>
        <div className="relative">
          <Input
            id="reset-new-password"
            required
            type={showPassword ? "text" : "password"}
            minLength={12}
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
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
        <span className="block text-xs text-muted">Minimum 12 characters</span>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reset-confirm-password" className="block text-sm font-semibold text-foreground">
          Confirm new password
        </label>
        <div className="relative">
          <Input
            id="reset-confirm-password"
            required
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
            onClick={() => setShowConfirm((prev) => !prev)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Button className="w-full mt-2" type="submit" disabled={loading}>
        {loading ? "Resetting password…" : "Reset password"}
      </Button>
    </form>
  );
}
