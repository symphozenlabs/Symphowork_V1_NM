"use client";

import React from "react";
import { Edit3, User, Building2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_METADATA } from "@/modules/rbac/permissions";
import { RoleIllustration } from "./role-illustrations";
import type { OnboardingWizardFormState } from "./types";

interface Step3ReviewConfirmProps {
  form: OnboardingWizardFormState;
  onEditStep: (stepId: 1 | 2) => void;
  isSubmitting: boolean;
  submissionError: string | null;
  onSubmit: () => void;
}

export function Step3ReviewConfirm({
  form,
  onEditStep,
  isSubmitting,
  submissionError,
  onSubmit,
}: Step3ReviewConfirmProps) {
  const roleMeta = ROLE_METADATA[form.targetRole] || ROLE_METADATA.EMPLOYEE;
  const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Review & Confirm Profile
        </h2>
        <p className="mt-1 text-xs text-muted">
          Verify the candidate identity and organizational role assignments prior to generating the directory profile.
        </p>
      </div>

      {submissionError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800"
        >
          {submissionError}
        </div>
      )}

      {/* Role Assignment Card */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Target Role Authorization</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(1)}
            disabled={isSubmitting}
            className="h-8 gap-1 text-xs text-muted hover:text-foreground"
          >
            <Edit3 className="size-3.5" />
            <span>Change role</span>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <RoleIllustration roleKey={form.targetRole} selected className="size-14" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-foreground">{roleMeta.title}</span>
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                {form.targetRole}
              </span>
            </div>
            <p className="text-xs text-muted">{roleMeta.shortDescription}</p>
          </div>
        </div>
      </div>

      {/* Identity & Contact Card */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Candidate Identity & Contact</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(2)}
            disabled={isSubmitting}
            className="h-8 gap-1 text-xs text-muted hover:text-foreground"
          >
            <Edit3 className="size-3.5" />
            <span>Edit details</span>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span className="text-muted block text-[11px] font-medium">Full Name</span>
            <span className="font-semibold text-foreground text-sm">{fullName}</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span className="text-muted block text-[11px] font-medium">Personal Email (Invitation target)</span>
            <span className="font-mono text-slate-800">{form.personalEmail}</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span className="text-muted block text-[11px] font-medium">Phone Number</span>
            <span className="text-slate-800">{form.phone || "Not provided"}</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span className="text-muted block text-[11px] font-medium">Work Email Alias</span>
            <span className="font-mono text-slate-800">{form.workEmail || "Not provided"}</span>
          </div>

          {form.joiningDate && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
              <span className="text-muted block text-[11px] font-medium">Joining Date</span>
              <span className="text-slate-800 font-medium">{form.joiningDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Organizational Placement Summary Card */}
      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Organizational Placement</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(2)}
            disabled={isSubmitting}
            className="h-8 gap-1 text-xs text-muted hover:text-foreground"
          >
            <Edit3 className="size-3.5" />
            <span>Edit</span>
          </Button>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          The employee record will be enrolled in the directory with status{" "}
          <span className="font-semibold text-foreground">INVITED</span>. Account credential
          linking and activation will follow invitation dispatch.
        </p>
      </div>

      {/* Confirmation Callout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-emerald-900">
            Ready to enroll {form.firstName} {form.lastName}?
          </span>
          <p className="text-[11px] text-emerald-700">
            Clicking &quot;Create Employee Profile&quot; will generate the employee ID and directory entry.
          </p>
        </div>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto shrink-0 font-bold"
        >
          {isSubmitting ? "Creating profile…" : "Create Employee Profile"}
        </Button>
      </div>
    </div>
  );
}
