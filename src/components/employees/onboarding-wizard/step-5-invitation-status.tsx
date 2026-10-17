"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
  PlusCircle,
  Users,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_METADATA } from "@/modules/rbac/permissions";
import { RoleIllustration } from "./role-illustrations";
import type { OnboardingWizardFormState } from "./types";

interface Step5InvitationStatusProps {
  form: OnboardingWizardFormState;
  onResendInvite: () => Promise<void>;
  isResending: boolean;
  resendError: string | null;
  onResetWizard: () => void;
}

export function Step5InvitationStatus({
  form,
  onResendInvite,
  isResending,
  resendError,
  onResetWizard,
}: Step5InvitationStatusProps) {
  const [copied, setCopied] = useState(false);
  const roleMeta = ROLE_METADATA[form.targetRole] || ROLE_METADATA.EMPLOYEE;
  const fullName = form.createdDisplayName || [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
  const employeeCode = form.createdEmployeeCode || "Assigned";
  const delivery = form.invitationDelivery || "sent";

  const handleCopyLink = async () => {
    if (!form.invitationUrl) return;
    try {
      await navigator.clipboard.writeText(form.invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const lifecycleStages = [
    {
      title: "Profile Created",
      subtitle: `ID: ${employeeCode}`,
      state: "completed" as const,
    },
    {
      title: "Invitation Sent",
      subtitle: delivery === "not_configured" ? "Manual link ready" : "Dispatched",
      state: "completed" as const,
    },
    {
      title: "Token Accepted",
      subtitle: "Awaiting candidate",
      state: "pending" as const,
    },
    {
      title: "Active Employee",
      subtitle: "Role granted",
      state: "upcoming" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Sparkles className="size-8 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Onboarding Initiated
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Invitation Dispatched for {fullName}
            </h2>
            <p className="text-xs text-muted">
              The user account link is initialized with the authorized{" "}
              <span className="font-semibold text-foreground">{roleMeta.title}</span> role.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Stage Lifecycle Indicator */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Onboarding Lifecycle Tracker</h3>
          </div>
          <span className="text-[11px] font-medium text-muted">Step 2 of 4 In Progress</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {lifecycleStages.map((stage, idx) => {
            const isCompleted = stage.state === "completed";
            const isPending = stage.state === "pending";

            return (
              <div
                key={stage.title}
                className={`relative flex flex-col rounded-xl border p-3 transition-colors ${
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                    : isPending
                      ? "border-amber-200 bg-amber-50/50 text-amber-950"
                      : "border-slate-200 bg-slate-50/50 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isPending
                          ? "bg-amber-500 text-white animate-pulse"
                          : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {isCompleted ? <Check className="size-3 stroke-[3]" /> : idx + 1}
                  </span>
                  <span className="text-[11px] font-bold tracking-tight">
                    {stage.title}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{stage.subtitle}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Status Banner */}
      {delivery === "sent" && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Email dispatched successfully</span>
            <p className="text-emerald-800 leading-relaxed">
              An invitation email containing a secure 7-day sign-in token has been sent to{" "}
              <strong className="font-semibold text-emerald-950">{form.personalEmail}</strong>.
            </p>
          </div>
        </div>
      )}

      {delivery === "not_configured" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Email service not configured in this environment</span>
            <p className="text-amber-800 leading-relaxed">
              Automated SMTP/Resend email delivery is inactive in development or demo mode.
              You can copy the secure invitation link below and share it directly with the user.
            </p>
          </div>
        </div>
      )}

      {delivery === "failed" && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-950">
          <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Automated email delivery failed</span>
            <p className="text-rose-800 leading-relaxed">
              We couldn&apos;t deliver the email automatically, but the security token was generated successfully.
              You can manually copy the link below or try resending.
            </p>
          </div>
        </div>
      )}

      {/* Copyable Invitation URL Box */}
      {form.invitationUrl && (
        <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Direct Invitation URL (1-Click Copy)
            </span>
            <span className="text-[11px] font-medium text-muted">Expires in 7 days</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              type="text"
              readOnly
              value={form.invitationUrl}
              className="flex-1 rounded-xl border border-border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="button"
              onClick={handleCopyLink}
              className="shrink-0 gap-1.5 font-bold"
              variant={copied ? "primary" : "outline"}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400 stroke-[3]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            When the candidate opens this link, they will verify their details, configure a secure password,
            and instantly gain workspace access as <strong className="text-foreground">{roleMeta.title}</strong>.
          </p>
        </div>
      )}

      {resendError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
          {resendError}
        </div>
      )}

      {/* Summary Profile Tile */}
      <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-white p-4 shadow-xs">
        <RoleIllustration roleKey={form.targetRole} selected className="size-12 shrink-0" />
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-foreground">{fullName}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-700">
              {employeeCode}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
            <span>Role: <strong className="text-foreground">{roleMeta.title}</strong></span>
            <span>•</span>
            <span className="truncate">Email: <span className="font-mono">{form.personalEmail}</span></span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex w-full sm:w-auto items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onResetWizard}
            className="w-full sm:w-auto gap-1.5 text-xs font-semibold"
          >
            <PlusCircle className="size-3.5" />
            <span>Onboard Another Employee</span>
          </Button>

          {delivery !== "sent" && (
            <Button
              type="button"
              variant="ghost"
              onClick={onResendInvite}
              disabled={isResending}
              className="hidden sm:inline-flex gap-1.5 text-xs text-muted hover:text-foreground"
            >
              <RotateCw className={`size-3.5 ${isResending ? "animate-spin" : ""}`} />
              <span>Resend</span>
            </Button>
          )}
        </div>

        <Link
          href="/app/employees"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-colors"
        >
          <Users className="size-3.5" />
          <span>View in Employee Directory</span>
        </Link>
      </div>
    </div>
  );
}
