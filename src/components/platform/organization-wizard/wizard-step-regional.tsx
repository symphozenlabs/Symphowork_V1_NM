"use client";

import React from "react";
import { Clock, DollarSign, Calendar, Globe2 } from "lucide-react";
import {
  TIMEZONES,
  CURRENCIES,
  DATE_FORMATS,
  type OrganizationWizardFormState,
} from "./types";

interface WizardStepRegionalProps {
  form: OrganizationWizardFormState;
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
}

export function WizardStepRegional({
  form,
  errors,
  onChange,
}: WizardStepRegionalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Regional & Localization Settings</h3>
        <p className="mt-1 text-sm text-slate-600">
          Configure default timezone, currency, and date formatting conventions for the workspace.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Timezone */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-900">
            Default Timezone <span className="text-rose-600">*</span>
          </label>
          <div className="mt-1.5 relative">
            <Clock className="absolute left-3 top-2.5 size-4 text-slate-600" />
            <select
              value={form.timezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
              className={`w-full rounded-lg border bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                errors.timezone ? "border-rose-500" : "border-slate-300"
              }`}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          {errors.timezone ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.timezone}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Used for attendance logging, shift scheduling, audit timestamps, and daily digest notifications.
            </p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Primary Currency <span className="text-rose-600">*</span>
          </label>
          <div className="mt-1.5 relative">
            <DollarSign className="absolute left-3 top-2.5 size-4 text-slate-600" />
            <select
              value={form.currency}
              onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
              className={`w-full rounded-lg border bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                errors.currency ? "border-rose-500" : "border-slate-300"
              }`}
            >
              {CURRENCIES.map((cur) => (
                <option key={cur.value} value={cur.value}>
                  {cur.label}
                </option>
              ))}
            </select>
          </div>
          {errors.currency ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.currency}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              ISO-4217 standard currency code used across payroll, expense reporting, and billing.
            </p>
          )}
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Date Format <span className="text-rose-600">*</span>
          </label>
          <div className="mt-1.5 relative">
            <Calendar className="absolute left-3 top-2.5 size-4 text-slate-600" />
            <select
              value={form.dateFormat}
              onChange={(e) => onChange({ dateFormat: e.target.value })}
              className={`w-full rounded-lg border bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                errors.dateFormat ? "border-rose-500" : "border-slate-300"
              }`}
            >
              {DATE_FORMATS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </option>
              ))}
            </select>
          </div>
          {errors.dateFormat ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">{errors.dateFormat}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-600">
              Standard date representation displayed in reports, employee profiles, and logs.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-3">
        <Globe2 className="size-4 text-slate-600 shrink-0 mt-0.5" />
        <p>
          Regional settings establish workspace defaults. Tenant administrators can customize secondary display preferences within organization workspace settings after onboarding.
        </p>
      </div>
    </div>
  );
}
