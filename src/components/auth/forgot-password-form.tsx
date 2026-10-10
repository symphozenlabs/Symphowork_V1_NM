"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function ForgotPasswordForm() {
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
      <div className="space-y-4 rounded-xl border border-success-border bg-success-bg p-5 text-sm text-success">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{message}</p>
            {delivery === "not_configured" && (
              <p className="text-xs text-muted">
                Email delivery is not configured, so no reset email was sent.
              </p>
            )}
          </div>
        </div>
        <div className="pt-2">
          <Link
            className="inline-flex items-center font-semibold text-primary underline underline-offset-4 hover:text-secondary"
            href="/login"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-1.5">
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
        />
      </div>

      <Button className="w-full mt-2" type="submit" disabled={loading}>
        {loading ? "Sending instructions…" : "Send reset instructions"}
      </Button>
    </form>
  );
}
