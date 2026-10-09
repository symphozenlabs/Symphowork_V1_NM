"use client";

import React from "react";
import { Check, Sparkles, Users, Calendar, Shield, AlertCircle } from "lucide-react";
import type { OrganizationWizardFormState, PlanSummary } from "./types";

interface WizardStepPlanProps {
  form: OrganizationWizardFormState;
  plans: PlanSummary[];
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
  isLoading?: boolean;
}

function formatPrice(cents: number | null, currency: string): string {
  if (cents === null || cents === 0) return "Free";
  const amount = (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${amount}`;
}

export function WizardStepPlan({
  form,
  plans,
  errors,
  onChange,
  isLoading = false,
}: WizardStepPlanProps) {
  const activePlans = plans.filter((p) => p.active);

  const selectedPlan = activePlans.find((p) => p.id === form.planId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Plan & Subscription</h3>
          <p className="mt-1 text-sm text-slate-600">
            Select the subscription tier to be provisioned when this organization is approved.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChange({ billingCycle: "monthly" })}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              form.billingCycle === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => onChange({ billingCycle: "annual" })}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              form.billingCycle === "annual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Annual Billing
          </button>
        </div>
      </div>

      {errors.planId && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errors.planId}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-600">
          Loading platform plans...
        </div>
      ) : activePlans.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
          No active subscription plans found. Please configure an active plan in Platform Plans management.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activePlans.map((plan) => {
            const isSelected = form.planId === plan.id;
            const isFree = plan.code.toUpperCase() === "FREE" || (plan.monthlyPriceCents === 0 && plan.annualPriceCents === 0);
            const priceCents = form.billingCycle === "annual" ? plan.annualPriceCents : plan.monthlyPriceCents;
            const priceLabel = formatPrice(priceCents, plan.currency || "USD");

            return (
              <div
                key={plan.id}
                onClick={() => onChange({ planId: plan.id })}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-5 cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
                      {plan.code}
                    </span>
                    {isSelected ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white">
                        <Check className="size-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="size-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>

                  <h4 className="mt-3 text-base font-bold text-slate-900">{plan.name}</h4>
                  {plan.description && (
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">{plan.description}</p>
                  )}

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">{priceLabel}</span>
                    {!isFree && (
                      <span className="text-xs text-slate-600">
                        /{form.billingCycle === "annual" ? "year" : "month"}
                      </span>
                    )}
                  </div>

                  {/* Plan metrics */}
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 text-slate-600" />
                      <span>
                        {plan.maxUsers ? `${plan.maxUsers.toLocaleString()} member limit` : "Unlimited team members"}
                      </span>
                    </div>
                    {plan.trialDays > 0 && (
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-slate-600" />
                        <span>{plan.trialDays}-day free trial included</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Shield className="size-3.5 text-slate-600" />
                      <span>Enterprise multi-tenant isolation</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ planId: plan.id });
                    }}
                    className={`w-full rounded-lg py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isSelected ? "Selected Tier" : "Select Plan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPlan && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-3">
          <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
          <p>
            The selected plan (<strong>{selectedPlan.name}</strong>) will be staged in a pending state. When the Platform Owner approves this organization, the provisioning pipeline will activate the subscription under the chosen <strong>{form.billingCycle}</strong> cycle.
          </p>
        </div>
      )}
    </div>
  );
}
