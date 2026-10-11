"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface LoginFormProps {
  onForgotPassword?: () => void;
  onRegister?: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = body.error?.message ?? "Unable to sign in.";
        setError(errorMsg);
        showToast({
          type: "error",
          title: "Sign in failed",
          message: errorMsg,
        });
      } else if (body.user?.mustChangePassword) {
        showToast({
          type: "info",
          title: "Password update required",
          message: "Please establish a new password before continuing.",
        });
        window.location.assign("/change-password");
      } else {
        showToast({
          type: "success",
          title: "Welcome back",
          message: "Signed in successfully. Redirecting...",
        });
        window.location.assign(
          body.user?.platformRole && body.user.platformRole !== "NONE"
            ? "/platform"
            : "/app"
        );
      }
    } catch {
      const connMsg = "Unable to connect to the authentication server. Please try again.";
      setError(connMsg);
      showToast({
        type: "error",
        title: "Connection error",
        message: connMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 sm:space-y-5.5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="login-email" className="block text-sm font-semibold text-foreground">
          Email address
        </label>
        <Input
          id="login-email"
          required
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          className="h-11 sm:h-12 text-sm sm:text-base px-3.5 rounded-xl shadow-xs"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-semibold text-foreground">
            Password
          </label>
          <Link
            className="text-xs sm:text-sm font-semibold text-primary transition-colors hover:underline hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
            href="/forgot-password"
            onClick={(e) => {
              if (onForgotPassword) {
                e.preventDefault();
                onForgotPassword();
              }
            }}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            required
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            className="h-11 sm:h-12 text-sm sm:text-base px-3.5 pr-11 rounded-xl shadow-xs"
          />
          <button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1.5 cursor-pointer"
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
      </div>

      <Button
        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-xs mt-3 cursor-pointer"
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            <span>Signing in…</span>
          </>
        ) : (
          <span>Sign in to workspace</span>
        )}
      </Button>
    </form>
  );
}
