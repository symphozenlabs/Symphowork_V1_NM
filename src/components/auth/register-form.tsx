"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [state, setState] = useState<{
    kind: "idle" | "error" | "success";
    message?: string;
    delivery?: string;
  }>({ kind: "idle" });

  const checks = [
    { label: "12+ characters", pass: form.password.length >= 12 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(form.password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(form.password) },
    { label: "Number", pass: /\d/.test(form.password) },
  ];
  const strength = checks.filter((c) => c.pass).length;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      const msg = "Passwords do not match.";
      showToast({ type: "error", title: "Validation error", message: msg });
      return setState({ kind: "error", message: msg });
    }

    setLoading(true);
    setState({ kind: "idle" });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = body.error?.message ?? "Registration failed.";
        showToast({ type: "error", title: "Registration failed", message: errMsg });
        return setState({ kind: "error", message: errMsg });
      }

      showToast({
        type: "success",
        title: "Account created",
        message: "Check your email to verify your account.",
      });

      setState({
        kind: "success",
        message: "Your account was created. Check your email to verify it before signing in.",
        delivery: body.delivery,
      });
    } catch {
      const connMsg = "Unable to connect to the registration service. Please try again.";
      showToast({ type: "error", title: "Connection error", message: connMsg });
      setState({
        kind: "error",
        message: connMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  if (state.kind === "success") {
    return (
      <div className="space-y-4 rounded-xl border border-success-border bg-success-bg p-5 text-sm text-success">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{state.message}</p>
            {state.delivery === "not_configured" && (
              <p className="text-xs text-muted">
                Email delivery is not configured yet. Ask an administrator for a verification link or configure the approved email provider.
              </p>
            )}
          </div>
        </div>
        <div className="pt-2">
          <Link
            className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-4 hover:text-secondary"
            href="/verify-email"
          >
            Open verification
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      {state.kind === "error" && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="register-fullName" className="block text-sm font-semibold text-foreground">
          Full name
        </label>
        <Input
          id="register-fullName"
          required
          minLength={2}
          maxLength={160}
          placeholder="First and last name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-email" className="block text-sm font-semibold text-foreground">
          Email address
        </label>
        <Input
          id="register-email"
          required
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-password" className="block text-sm font-semibold text-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            id="register-password"
            required
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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

        {/* Strength indicators matching test requirement: "12+ characters" */}
        <div className="pt-1.5 space-y-1.5">
          <div className="flex gap-1 h-1.5 w-full">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={cn(
                  "flex-1 rounded-full transition-colors duration-200",
                  idx < strength
                    ? strength <= 2
                      ? "bg-amber-500"
                      : "bg-primary"
                    : "bg-border"
                )}
              />
            ))}
          </div>
          <span className="block text-xs text-muted">
            Use 12+ characters with uppercase, lowercase, and a number ({strength}/4 checks).
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-confirmPassword" className="block text-sm font-semibold text-foreground">
          Confirm password
        </label>
        <div className="relative">
          <Input
            id="register-confirmPassword"
            required
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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

      <Button className="w-full mt-2" type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            <span>Creating account…</span>
          </>
        ) : (
          <span>Create account</span>
        )}
      </Button>
    </form>
  );
}
