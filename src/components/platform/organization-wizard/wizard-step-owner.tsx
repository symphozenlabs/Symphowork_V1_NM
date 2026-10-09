"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Mail, User, ShieldCheck, AlertCircle } from "lucide-react";
import type { OrganizationWizardFormState } from "./types";

interface WizardStepOwnerProps {
  form: OrganizationWizardFormState;
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
}

export function WizardStepOwner({
  form,
  errors,
  onChange,
}: WizardStepOwnerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Organization Owner</h3>
        <p className="mt-1 text-sm text-slate-600">
          Specify the primary administrator account for this tenant workspace.
        </p>
      </div>

      {/* Owner Role Callout Banner */}
      <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 text-xs text-sky-900 leading-relaxed flex items-start gap-3">
        <ShieldCheck className="size-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sky-950">
            Designated Role: <span className="underline decoration-sky-400">ORGANIZATION_OWNER</span>
          </p>
          <p className="text-sky-800">
            Upon Platform Owner approval and workspace provisioning, a secure onboarding invitation will be generated and dispatched to this address. Accepting the invitation grants full root-level ownership of the tenant workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Owner Email */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-900">
            Organization Owner Email <span className="text-rose-600">*</span>
          </label>
          <div className="mt-1.5 relative">
            <Mail className="absolute left-3 top-2.5 size-4 text-slate-600" />
            <Input
              type="email"
              placeholder="owner@company.com"
              value={form.ownerEmail}
              onChange={(e) => onChange({ ownerEmail: e.target.value })}
              className={`pl-9 ${errors.ownerEmail ? "border-rose-500" : ""}`}
            />
          </div>
          {errors.ownerEmail ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.ownerEmail}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              The primary owner&apos;s direct corporate email address. Invitation tokens and recovery notices will be delivered here.
            </p>
          )}
        </div>

        {/* Owner Full Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-900">
            Owner Full Name
          </label>
          <div className="mt-1.5 relative">
            <User className="absolute left-3 top-2.5 size-4 text-slate-600" />
            <Input
              type="text"
              placeholder="e.g. Eleanor Vance"
              value={form.ownerFullName}
              onChange={(e) => onChange({ ownerFullName: e.target.value })}
              className={`pl-9 ${errors.ownerFullName ? "border-rose-500" : ""}`}
            />
          </div>
          {errors.ownerFullName ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.ownerFullName}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Optional full name of the initial tenant owner (2–160 characters).
            </p>
          )}
        </div>
      </div>

      {/* Disambiguation notice */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
        <AlertCircle className="size-4 text-slate-600 shrink-0 mt-0.5" />
        <p>
          <strong>Note:</strong> The Owner Email is separate from the Official Organization Contact Email configured in Step 2. If the Official Contact Email was omitted, this Owner Email will serve as the fallback administrative contact for the organization entity.
        </p>
      </div>
    </div>
  );
}
