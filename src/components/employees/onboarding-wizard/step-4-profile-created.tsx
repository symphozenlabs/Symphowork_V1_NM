"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Mail, ArrowRight, UserCheck, ShieldCheck, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_METADATA } from "@/modules/rbac/permissions";
import { RoleIllustration } from "./role-illustrations";
import type { OnboardingWizardFormState } from "./types";

interface Step4ProfileCreatedProps {
  form: OnboardingWizardFormState;
  onProceedToInvite: () => void;
  isSendingInvite?: boolean;
}

export function Step4ProfileCreated({
  form,
  onProceedToInvite,
  isSendingInvite = false,
}: Step4ProfileCreatedProps) {
  const roleMeta = ROLE_METADATA[form.targetRole] || ROLE_METADATA.EMPLOYEE;
  const fullName = form.createdDisplayName || [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
  const employeeCode = form.createdEmployeeCode || "Assigned";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="size-8 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Profile Created in Directory
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {fullName} is Enrolled!
            </h2>
            <p className="text-xs text-muted">
              The workforce profile has been registered in the database. Next, dispatch an invitation to grant system credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Record Identification Card */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Generated Directory Record</h3>
          </div>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-800">
            Status: INVITED
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
              <Hash className="size-3 text-muted" />
              Employee ID
            </span>
            <span className="font-mono text-sm font-bold text-primary">
              {employeeCode}
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
              <ShieldCheck className="size-3 text-muted" />
              Authorized Role
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{roleMeta.title}</span>
              <span className="font-mono text-[10px] text-muted">({form.targetRole})</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
              <Mail className="size-3 text-muted" />
              Target Email
            </span>
            <span className="truncate font-mono text-slate-800" title={form.personalEmail}>
              {form.personalEmail}
            </span>
          </div>
        </div>

        {/* Role Representation */}
        <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5">
          <RoleIllustration roleKey={form.targetRole} selected className="size-12 shrink-0" />
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-foreground">{roleMeta.title} Permissions & Scope</span>
            <p className="text-muted leading-relaxed">{roleMeta.description}</p>
          </div>
        </div>
      </div>

      {/* Two-step lifecycle callout */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
          <span>Next Step: Account Invitation</span>
        </div>
        <p className="text-blue-800 leading-relaxed">
          The employee profile exists with <code className="rounded bg-blue-100 px-1 font-mono text-[11px]">userId = null</code>.
          Dispatching an invitation links a secure 7-day acceptance token to this profile and allows the candidate to set their credentials.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Link
          href="/app/employees"
          className="w-full sm:w-auto text-center rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted hover:bg-slate-50 hover:text-foreground transition-colors"
        >
          Finish Later / View Directory
        </Link>

        <Button
          type="button"
          onClick={onProceedToInvite}
          disabled={isSendingInvite}
          className="w-full sm:w-auto gap-2 font-bold bg-primary text-white hover:bg-primary/90"
        >
          <span>{isSendingInvite ? "Sending Invitation…" : "Send Account Invitation"}</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
