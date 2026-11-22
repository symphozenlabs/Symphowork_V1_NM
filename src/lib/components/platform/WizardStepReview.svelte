<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
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
let {
  form,
  plans,
  onGoToStep,
  submissionError,
}:WizardStepReviewProps=$props();
const selectedPlan=$derived(plans.find((p) => p.id === form.planId));
const planPrice=$derived(form.billingCycle === "annual"
      ? selectedPlan?.annualPriceCents ?? null
      : selectedPlan?.monthlyPriceCents ?? null);


import type { PlanSummary, OrganizationWizardFormState, WizardStepId } from '$lib/components/platform/organization-wizard-types';</script>
<div class="space-y-6">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Review & Confirm Organization</h3>
        <p class="mt-1 text-sm text-slate-600">
          Carefully verify all parameters before submitting the new pending organization into the platform provisioning lifecycle.
        </p>
      </div>

      {#if submissionError}<div class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-start gap-3">
          <SvgIcon name="AlertTriangle" class="size-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p class="font-semibold text-rose-800">Submission Failed</p>
            <p class="mt-0.5 text-xs text-rose-700">{submissionError}</p>
          </div>
        </div>{/if}

      <div class="grid gap-5 md:grid-cols-2">
        
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SvgIcon name="Building2" class="size-4 text-primary" />
              <span>Organization Details</span>
            </div>
            <button type="button" onclick={() => onGoToStep(1)} class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <SvgIcon name="Pencil" class="size-3" /> Edit
            </button>
          </div>
          <dl class="mt-3 space-y-2 text-xs">
            <div>
              <dt class="text-slate-600">Organization Name</dt>
              <dd class="font-semibold text-slate-900">{form.name || "—"}</dd>
            </div>
            <div>
              <dt class="text-slate-600">Legal Entity Name</dt>
              <dd class="font-medium text-slate-800">{form.legalName || form.name || "—"}</dd>
            </div>
            <div>
              <dt class="text-slate-600">Workspace Slug</dt>
              <dd class="font-mono font-medium text-slate-800">
                app.symphowork.com/<span class="text-primary font-bold">{form.slug || "—"}</span>
              </dd>
            </div>
            <div>
              <dt class="text-slate-600">Website</dt>
              <dd class="font-medium text-slate-800">
                {#if form.website}<a href={form.website} target="_blank" rel="noreferrer" class="text-primary hover:underline">
                    {form.website}
                  </a>{:else}{"—"}{/if}
              </dd>
            </div>
          </dl>
        </div>

        
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SvgIcon name="Mail" class="size-4 text-primary" />
              <span>Contact Information</span>
            </div>
            <button type="button" onclick={() => onGoToStep(2)} class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <SvgIcon name="Pencil" class="size-3" /> Edit
            </button>
          </div>
          <dl class="mt-3 space-y-2 text-xs">
            <div>
              <dt class="text-slate-600">Official Organization Email</dt>
              <dd class="font-medium text-slate-800">
                {#if form.contactEmail}{form.contactEmail}{:else}<span class="text-slate-600 italic">
                    Fallback to owner email ({form.ownerEmail || "pending"})
                  </span>{/if}
              </dd>
            </div>
            <div>
              <dt class="text-slate-600">Official Organization Phone</dt>
              <dd class="font-medium text-slate-800">{form.contactPhone || "—"}</dd>
            </div>
          </dl>
        </div>

        
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SvgIcon name="MapPin" class="size-4 text-primary" />
              <span>Headquarters / Registered Address</span>
            </div>
            <button type="button" onclick={() => onGoToStep(2)} class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <SvgIcon name="Pencil" class="size-3" /> Edit
            </button>
          </div>
          <dl class="mt-3 space-y-2 text-xs">
            <div>
              <dt class="text-slate-600">Address Line 1</dt>
              <dd class="font-medium text-slate-800">{form.addressLine1 || "—"}</dd>
            </div>
            {#if form.addressLine2}<div>
                <dt class="text-slate-600">Address Line 2</dt>
                <dd class="font-medium text-slate-800">{form.addressLine2}</dd>
              </div>{/if}
            <div class="grid grid-cols-2 gap-2">
              <div>
                <dt class="text-slate-600">City</dt>
                <dd class="font-medium text-slate-800">{form.city || "—"}</dd>
              </div>
              <div>
                <dt class="text-slate-600">State / Province</dt>
                <dd class="font-medium text-slate-800">{form.state || "—"}</dd>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <dt class="text-slate-600">Country</dt>
                <dd class="font-medium text-slate-800">{form.country || "—"}</dd>
              </div>
              <div>
                <dt class="text-slate-600">Postal / ZIP Code</dt>
                <dd class="font-medium text-slate-800">{form.postalCode || "—"}</dd>
              </div>
            </div>
          </dl>
        </div>

        
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SvgIcon name="UserCheck" class="size-4 text-primary" />
              <span>Organization Owner</span>
            </div>
            <button type="button" onclick={() => onGoToStep(3)} class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <SvgIcon name="Pencil" class="size-3" /> Edit
            </button>
          </div>
          <dl class="mt-3 space-y-2 text-xs">
            <div>
              <dt class="text-slate-600">Owner Full Name</dt>
              <dd class="font-medium text-slate-800">{form.ownerFullName || "—"}</dd>
            </div>
            <div>
              <dt class="text-slate-600">Owner Corporate Email</dt>
              <dd class="font-bold text-slate-900">{form.ownerEmail || "—"}</dd>
            </div>
            <div>
              <dt class="text-slate-600">Provisioned Organization Role</dt>
              <dd class="font-semibold text-sky-700">ORGANIZATION_OWNER</dd>
            </div>
            <div>
              <dt class="text-slate-600">Onboarding Method</dt>
              <dd class="text-slate-600">Secure platform invitation dispatched upon approval</dd>
            </div>
          </dl>
        </div>

        
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SvgIcon name="CreditCard" class="size-4 text-primary" />
              <span>Subscription & Billing</span>
            </div>
            <button type="button" onclick={() => onGoToStep(4)} class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <SvgIcon name="Pencil" class="size-3" /> Edit
            </button>
          </div>
          <dl class="mt-3 space-y-2 text-xs">
            <div>
              <dt class="text-slate-600">Subscription Tier</dt>
              <dd class="font-bold text-slate-900">
                {selectedPlan?.name || "Unknown Plan"} ({selectedPlan?.code})
              </dd>
            </div>
            <div>
              <dt class="text-slate-600">Billing Cycle</dt>
              <dd class="font-medium capitalize text-slate-800">{form.billingCycle}</dd>
            </div>
            <div>
              <dt class="text-slate-600">Rate</dt>
              <dd class="font-semibold text-slate-900">
                {formatPrice(planPrice, selectedPlan?.currency || "USD")} /{" "}
                {#if form.billingCycle === "annual"}{"year"}{:else}{"month"}{/if}
              </dd>
            </div>
            <div>
              <dt class="text-slate-600">Team Capacity</dt>
              <dd class="text-slate-700">
                {#if selectedPlan?.maxUsers}{`${selectedPlan.maxUsers.toLocaleString()} members max`}{:else}{"Unlimited"}{/if}
              </dd>
            </div>
            {#if selectedPlan && selectedPlan.trialDays > 0}<div>
                <dt class="text-slate-600">Trial Period</dt>
                <dd class="text-slate-700">{selectedPlan.trialDays} days included</dd>
              </div>{/if}
          </dl>
        </div>

        
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SvgIcon name="Globe2" class="size-4 text-primary" />
              <span>Regional Conventions</span>
            </div>
            <button type="button" onclick={() => onGoToStep(5)} class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <SvgIcon name="Pencil" class="size-3" /> Edit
            </button>
          </div>
          <dl class="mt-3 space-y-2 text-xs">
            <div>
              <dt class="text-slate-600">Primary Timezone</dt>
              <dd class="font-medium text-slate-800">{form.timezone}</dd>
            </div>
            <div>
              <dt class="text-slate-600">Base Currency</dt>
              <dd class="font-medium text-slate-800">{form.currency}</dd>
            </div>
            <div>
              <dt class="text-slate-600">Date Display Format</dt>
              <dd class="font-medium text-slate-800">{form.dateFormat}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
        <strong>Provisioning Lifecycle Summary:</strong> Submitting this form registers the organization in a <strong>pending</strong> state with an automated provisioning job. The organization will await Platform Owner approval in the Platform Console. Once approved, 9 organization roles and permissions are generated, the selected subscription is activated, and an onboarding invitation is dispatched to the designated organization owner.
      </div>
    </div>
