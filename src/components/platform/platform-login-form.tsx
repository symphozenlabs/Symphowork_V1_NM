"use client";

import React, { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function PlatformLoginForm() {
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
      const response = await fetch("/api/platform/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = body.error?.message ?? "Unable to sign in to the console.";
        setError(errMsg);
        showToast({ type: "error", title: "Access denied", message: errMsg });
      } else {
        showToast({
          type: "success",
          title: "Platform console authorized",
          message: "Redirecting to Platform Owner Console...",
        });
        window.location.assign("/platform");
      }
    } catch {
      const connMsg = "Unable to connect to the platform service. Please try again.";
      setError(connMsg);
      showToast({ type: "error", title: "Connection error", message: connMsg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
        <label htmlFor="platform-email" className="block text-sm font-semibold text-foreground">
          Platform email
        </label>
        <Input
          id="platform-email"
          required
          type="email"
          autoComplete="email"
          placeholder="admin@symphowork.internal"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="platform-password" className="block text-sm font-semibold text-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            id="platform-password"
            required
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
      </div>

      <Button className="w-full mt-2" type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            <span>Signing in…</span>
          </>
        ) : (
          <span>Sign in to console</span>
        )}
      </Button>
    </form>
  );
}
