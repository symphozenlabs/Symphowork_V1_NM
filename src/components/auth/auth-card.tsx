import React, { type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  isPlatform?: boolean;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
  isPlatform,
}: AuthCardProps) {
  const isPlatformConsole =
    isPlatform ||
    title.toLowerCase().includes("console") ||
    description.toLowerCase().includes("platform");

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-12 bg-background">
      {/* Left Column: Executive Brand & Capability Showcase (Desktop lg+) */}
      <div className="relative hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-[#0D3324] via-[#174734] to-[#0A261B] p-10 xl:p-14 text-white overflow-hidden shadow-2xl">
        {/* Subtle decorative background accents */}
        <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-accent blur-3xl" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 space-y-6">
          <Link
            href="/"
            className="group inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl transition-transform hover:scale-[1.02]"
            aria-label="SymphoWork Home"
          >
            <Image
              src="/symphowork-logo-white.png"
              alt="SymphoWork"
              width={240}
              height={80}
              priority
              className="h-16 xl:h-20 w-auto object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
            />
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isPlatformConsole
                ? "Platform Multi-Tenant Cluster Console"
                : "Enterprise Human Capital Management"}
            </span>
          </div>
        </div>

        {/* Narrative & Value Proposition */}
        <div className="relative z-10 space-y-8 my-auto py-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl leading-tight">
              {isPlatformConsole
                ? "Unified control over multi-tenant infrastructure."
                : "Transform workforce operations with certainty."}
            </h2>
            <p className="text-sm text-slate-200/90 leading-relaxed max-w-md">
              {isPlatformConsole
                ? "Enterprise orchestration for workspace provisioning, commercial subscription tiers, system telemetry, and governance audit trails."
                : "A unified platform orchestrating employee lifecycles, attendance tracking, shift scheduling, automated leave policies, and payroll."}
            </p>
          </div>

          {/* Capability Highlights */}
          <div className="space-y-3.5 max-w-md">
            {isPlatformConsole ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <p className="text-xs text-slate-200">
                    <strong className="text-white">Tenant Isolation:</strong> Strict Postgres row-level security boundaries across organizations
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <p className="text-xs text-slate-200">
                    <strong className="text-white">Commercial Engine:</strong> Modular feature entitlements, pricing tiers, and quota enforcement
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <p className="text-xs text-slate-200">
                    <strong className="text-white">Audit & Governance:</strong> Tamper-evident ledger logging all privileged operator changes
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <p className="text-xs text-slate-200">
                    <strong className="text-white">Workforce Lifecycle:</strong> End-to-end recruitment, onboarding, directory, and employee records
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <p className="text-xs text-slate-200">
                    <strong className="text-white">Time & Compensation:</strong> Automated shift attendance, leave workflows, and payroll runs
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <p className="text-xs text-slate-200">
                    <strong className="text-white">Enterprise Security:</strong> Role-based access control, encrypted sessions, and privacy safeguards
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security & Regulatory Footer */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>High-integrity enterprise architecture · Zero-trust role enforcement</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            © {new Date().getFullYear()} SymphoWork Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Column: Focused Authentication Form */}
      <div className="flex min-h-screen flex-col justify-between p-6 sm:p-10 lg:col-span-7 lg:p-12 xl:p-16 bg-gradient-to-b from-[#F7F8FB] to-[#F1F5F0]">
        {/* Mobile / Tablet Header with prominent logo */}
        <div className="w-full lg:hidden text-center pb-6">
          <Link
            href="/"
            className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-opacity hover:opacity-90"
            aria-label="SymphoWork Home"
          >
            <Image
              src="/symphowork-logo.png"
              alt="SymphoWork"
              width={180}
              height={56}
              priority
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Centered Form Card with Generous Proportions */}
        <div className="mx-auto my-auto w-full max-w-lg">
          <div className="rounded-2xl border border-[#DCE6DA] bg-surface p-8 sm:p-10 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
            <header className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                <Lock className="size-3 text-primary" aria-hidden="true" />
                <span>
                  {isPlatformConsole ? "Platform Administration" : "Secure Identity Gateway"}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-muted">{description}</p>
            </header>

            <div className="mt-6">{children}</div>

            {footer && (
              <div className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted">
                {footer}
              </div>
            )}
          </div>

          {/* Mobile Trust Notice */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted lg:hidden">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            <span>Enterprise-grade security · SOC 2 compliant architecture</span>
          </div>
        </div>

        {/* Desktop Right Footer copyright notice */}
        <footer className="text-center text-xs text-muted pt-6">
          <p>© {new Date().getFullYear()} SymphoWork Inc. High-integrity workforce operations.</p>
        </footer>
      </div>
    </div>
  );
}
