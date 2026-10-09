"use client";

import React from "react";
import {
  Building2,
  Mail,
  MapPin,
  UserCheck,
  CreditCard,
  Globe2,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import type {
  OrganizationWizardFormState,
  PlanSummary,
  WizardStepId,
} from "./types";

interface WizardStepReviewProps {
  form: OrganizationWizardFormState;
  plans: PlanSummary[];
  onGoToStep: (step: WizardStepId) => void;
  submissionError?: string | null;
}

function formatPrice(cents: number | null, currency: string): string {
  if (cents === null || cents === 0) return "Free";
  const amount = (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${amount}`;
}

export function WizardStepReview({
  form,
  plans,
  onGoToStep,
  submissionError,
}: WizardStepReviewProps) {
  const selectedPlan = plans.find((p) => p.id === form.planId);
  const planPrice =
    form.billingCycle === "annual"
      ? selectedPlan?.annualPriceCents ?? null
      : selectedPlan?.monthlyPriceCents ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Review & Confirm Organization</h3>
        <p className="mt-1 text-sm text-slate-600">
          Carefully verify all parameters before submitting the new pending organization into the platform provisioning lifecycle.
        </p>
      </div>

      {submissionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-800">Submission Failed</p>
            <p className="mt-0.5 text-xs text-rose-700">{submissionError}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* Section 1: Organization Identity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Building2 className="size-4 text-primary" />
              <span>Organization Details</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="text-slate-600">Organization Name</dt>
              <dd className="font-semibold text-slate-900">{form.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Legal Entity Name</dt>
              <dd className="font-medium text-slate-800">{form.legalName || form.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Workspace Slug</dt>
              <dd className="font-mono font-medium text-slate-800">
                app.symphowork.com/<span className="text-primary font-bold">{form.slug || "—"}</span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Website</dt>
              <dd className="font-medium text-slate-800">
                {form.website ? (
                  <a
                    href={form.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {form.website}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Section 2: Contact Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Mail className="size-4 text-primary" />
              <span>Contact Information</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="text-slate-600">Official Organization Email</dt>
              <dd className="font-medium text-slate-800">
                {form.contactEmail ? (
                  form.contactEmail
                ) : (
                  <span className="text-slate-600 italic">
                    Fallback to owner email ({form.ownerEmail || "pending"})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Official Organization Phone</dt>
              <dd className="font-medium text-slate-800">{form.contactPhone || "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Section 3: Registered Address */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MapPin className="size-4 text-primary" />
              <span>Headquarters / Registered Address</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="text-slate-600">Address Line 1</dt>
              <dd className="font-medium text-slate-800">{form.addressLine1 || "—"}</dd>
            </div>
            {form.addressLine2 && (
              <div>
                <dt className="text-slate-600">Address Line 2</dt>
                <dd className="font-medium text-slate-800">{form.addressLine2}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-slate-600">City</dt>
                <dd className="font-medium text-slate-800">{form.city || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-600">State / Province</dt>
                <dd className="font-medium text-slate-800">{form.state || "—"}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-slate-600">Country</dt>
                <dd className="font-medium text-slate-800">{form.country || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Postal / ZIP Code</dt>
                <dd className="font-medium text-slate-800">{form.postalCode || "—"}</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Section 4: Organization Owner */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserCheck className="size-4 text-primary" />
              <span>Organization Owner</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="text-slate-600">Owner Full Name</dt>
              <dd className="font-medium text-slate-800">{form.ownerFullName || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Owner Corporate Email</dt>
              <dd className="font-bold text-slate-900">{form.ownerEmail || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Provisioned Organization Role</dt>
              <dd className="font-semibold text-sky-700">ORGANIZATION_OWNER</dd>
            </div>
            <div>
              <dt className="text-slate-600">Onboarding Method</dt>
              <dd className="text-slate-600">Secure platform invitation dispatched upon approval</dd>
            </div>
          </dl>
        </div>

        {/* Section 5: Subscription Plan */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CreditCard className="size-4 text-primary" />
              <span>Subscription & Billing</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(4)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="text-slate-600">Subscription Tier</dt>
              <dd className="font-bold text-slate-900">
                {selectedPlan?.name || "Unknown Plan"} ({selectedPlan?.code})
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Billing Cycle</dt>
              <dd className="font-medium capitalize text-slate-800">{form.billingCycle}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Rate</dt>
              <dd className="font-semibold text-slate-900">
                {formatPrice(planPrice, selectedPlan?.currency || "USD")} /{" "}
                {form.billingCycle === "annual" ? "year" : "month"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Team Capacity</dt>
              <dd className="text-slate-700">
                {selectedPlan?.maxUsers
                  ? `${selectedPlan.maxUsers.toLocaleString()} members max`
                  : "Unlimited"}
              </dd>
            </div>
            {selectedPlan && selectedPlan.trialDays > 0 && (
              <div>
                <dt className="text-slate-600">Trial Period</dt>
                <dd className="text-slate-700">{selectedPlan.trialDays} days included</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Section 6: Regional Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Globe2 className="size-4 text-primary" />
              <span>Regional Conventions</span>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(5)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Pencil className="size-3" /> Edit
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div>
              <dt className="text-slate-600">Primary Timezone</dt>
              <dd className="font-medium text-slate-800">{form.timezone}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Base Currency</dt>
              <dd className="font-medium text-slate-800">{form.currency}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Date Display Format</dt>
              <dd className="font-medium text-slate-800">{form.dateFormat}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
        <strong>Provisioning Lifecycle Summary:</strong> Submitting this form registers the organization in a <strong>pending</strong> state with an automated provisioning job. The organization will await Platform Owner approval in the Platform Console. Once approved, 9 organization roles and permissions are generated, the selected subscription is activated, and an onboarding invitation is dispatched to the designated organization owner.
      </div>
    </div>
  );
}
