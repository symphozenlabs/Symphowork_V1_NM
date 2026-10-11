"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface ForgotPasswordFormProps {
  onSignIn?: () => void;
}

export function ForgotPasswordForm({ onSignIn }: ForgotPasswordFormProps = {}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string>();
  const [delivery, setDelivery] = useState<string>();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const b = await r.json().catch(() => ({}));
      const msg = b.message ?? "If that email is registered, reset instructions will be sent.";
      setMessage(msg);
      setDelivery(b.delivery);
      showToast({
        type: "info",
        title: "Instructions dispatched",
        message: msg,
      });
    } catch {
      const fallbackMsg = "If that email is registered, reset instructions will be sent.";
      setMessage(fallbackMsg);
      showToast({
        type: "info",
        title: "Instructions dispatched",
        message: fallbackMsg,
      });
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="space-y-4 rounded-xl border border-success-border bg-success-bg p-6 text-sm text-success">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-2">
            <p className="font-semibold text-foreground text-sm sm:text-base">{message}</p>
            {delivery === "not_configured" && (
              <p className="text-xs text-muted">
                Email delivery is not configured, so no reset email was sent.
              </p>
            )}
          </div>
        </div>
        <div className="pt-2">
          <Link
            className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-secondary cursor-pointer"
            href="/login"
            onClick={(e) => {
              if (onSignIn) {
                e.preventDefault();
                onSignIn();
              }
            }}
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5 sm:space-y-5.5" onSubmit={submit}>
      <div className="space-y-2">
        <label htmlFor="forgot-email" className="block text-sm font-semibold text-foreground">
          Email address
        </label>
        <Input
          id="forgot-email"
          required
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="h-11 sm:h-12 text-sm sm:text-base px-3.5 rounded-xl shadow-xs"
        />
      </div>

      <Button
        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-xs mt-3 cursor-pointer"
        type="submit"
        disabled={loading}
      >
        {loading ? "Sending instructions…" : "Send reset instructions"}
      </Button>
    </form>
  );
}
