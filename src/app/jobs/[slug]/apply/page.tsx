"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicApplyPage() {
  const params = useParams<{ slug: string }>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    form.set("consentStatus", form.get("consentStatus") === "on" ? "granted" : "not_granted");

    try {
      const response = await fetch(`/api/public/jobs/${params.slug}/apply`, {
        method: "POST",
        body: form,
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "We could not submit this application.");
      }

      setMessage("Application submitted successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not submit this application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Public apply header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 px-5 backdrop-blur-md md:px-8">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-90"
            aria-label="SymphoWork Home"
          >
            <Image
              src="/symphowork-logo.png"
              alt="SymphoWork"
              width={160}
              height={42}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>
          {params.slug && (
            <Link
              href={`/jobs/${params.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Back to job details</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main application form */}
      <main className="px-5 py-10 md:py-14">
        <form
          onSubmit={submit}
          className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-[0_4px_24px_rgba(11,25,48,0.03)]"
        >
          <header className="border-b border-border pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Candidate Application
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tell us about yourself
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              No account is required. Your application and documents are stored securely with the hiring team.
            </p>
          </header>

          {/* Form fields grid */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact & Professional Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">First name *</label>
                <input
                  name="firstName"
                  required
                  placeholder="First name"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Last name *</label>
                <input
                  name="lastName"
                  required
                  placeholder="Last name"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Email address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Phone number</label>
                <input
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Current location</label>
                <input
                  name="location"
                  placeholder="City, Country"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Current company</label>
                <input
                  name="currentCompany"
                  placeholder="Current employer"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Current designation</label>
                <input
                  name="currentDesignation"
                  placeholder="Senior Software Engineer"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Total experience (years)</label>
                <input
                  name="totalExperience"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 5.5"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Expected salary</label>
                <input
                  name="expectedSalary"
                  type="number"
                  min="0"
                  placeholder="Annual target compensation"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">Notice period (days)</label>
                <input
                  name="noticePeriodDays"
                  type="number"
                  min="0"
                  placeholder="e.g. 30"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Cover note */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground">Cover note</label>
            <textarea
              name="coverNote"
              placeholder="Share relevant projects, motivations, or context for your application…"
              className="min-h-28 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Resume / Curriculum Vitae *
            </label>
            <div className="rounded-xl border border-dashed border-border bg-background/50 p-4 transition-colors hover:border-primary/50">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-sidebar-active text-sidebar-active-text border border-primary/10">
                  <FileUp className="size-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    name="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                    className="block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-secondary cursor-pointer"
                  />
                  <p className="mt-1 text-[11px] text-muted">Supported formats: PDF, DOC, DOCX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer select-none">
            <input
              name="consentStatus"
              type="checkbox"
              required
              className="mt-0.5 size-4 rounded-xs border-border text-primary focus:ring-ring"
            />
            <span>
              I consent to this organization processing my application and candidate data for recruitment purposes in accordance with data privacy regulations.
            </span>
          </label>

          {/* Feedback alerts */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {error.includes("scanner") || error.includes("admission")
                  ? "Resume upload is temporarily unavailable while secure file scanning is not configured."
                  : error}
              </span>
            </div>
          )}

          {message && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-success-border bg-success-bg p-4 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="font-semibold text-foreground">{message}</p>
            </div>
          )}

          {/* Submit button */}
          <div className="border-t border-border pt-4">
            <Button type="submit" disabled={busy} className="w-full sm:w-auto px-8">
              {busy ? "Submitting application…" : "Submit application"}
            </Button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-muted">
        <p>© {new Date().getFullYear()} SymphoWork Inc. High-integrity workforce operations.</p>
      </footer>
    </div>
  );
}
