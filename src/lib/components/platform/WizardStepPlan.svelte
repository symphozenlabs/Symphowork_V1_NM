<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
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
let {
  form,
  plans,
  errors,
  onChange,
  isLoading = false,
}:WizardStepPlanProps=$props();
const activePlans=$derived(plans.filter((p) => p.active));
const selectedPlan=$derived(activePlans.find((p) => p.id === form.planId));


import type { PlanSummary, OrganizationWizardFormState } from '$lib/components/platform/organization-wizard-types';</script>
<div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-slate-900">Plan & Subscription</h3>
          <p class="mt-1 text-sm text-slate-600">
            Select the subscription tier to be provisioned when this organization is approved.
          </p>
        </div>

        
        <div class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 self-start sm:self-auto">
          <button type="button" onclick={() => onChange({ billingCycle: "monthly" })} class={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              form.billingCycle === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}>
            Monthly Billing
          </button>
          <button type="button" onclick={() => onChange({ billingCycle: "annual" })} class={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              form.billingCycle === "annual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}>
            Annual Billing
          </button>
        </div>
      </div>

      {#if errors.planId}<div class="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <SvgIcon name="AlertCircle" class="size-4 shrink-0" />
          <span>{errors.planId}</span>
        </div>{/if}

      {#if isLoading}<div class="py-12 text-center text-sm text-slate-600">
          Loading platform plans...
        </div>{:else}{#if activePlans.length === 0}<div class="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
          No active subscription plans found. Please configure an active plan in Platform Plans management.
        </div>{:else}<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each activePlans as plan}{@const isSelected = form.planId === plan.id}{@const isFree = plan.code.toUpperCase() === "FREE" || (plan.monthlyPriceCents === 0 && plan.annualPriceCents === 0)}{@const priceCents = form.billingCycle === "annual" ? plan.annualPriceCents : plan.monthlyPriceCents}{@const priceLabel = formatPrice(priceCents, plan.currency || "USD")}<label class={`relative flex flex-col justify-between rounded-xl border-2 p-5 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-primary ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}>
                <input type="radio" name="planId" value={plan.id} checked={isSelected} onchange={() => onChange({ planId: plan.id })} class="sr-only" />
                <div>
                  <div class="flex items-center justify-between">
                    <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
                      {plan.code}
                    </span>
                    {#if isSelected}<span class="flex size-5 items-center justify-center rounded-full bg-primary text-white">
                        <SvgIcon name="Check" class="size-3.5 stroke-[3]" />
                      </span>{:else}<span class="size-5 rounded-full border-2 border-slate-300"></span>{/if}
                  </div>

                  <h4 class="mt-3 text-base font-bold text-slate-900">{plan.name}</h4>
                  {#if plan.description}<p class="mt-1 text-xs text-slate-600 line-clamp-2">{plan.description}</p>{/if}

                  <div class="mt-4 flex items-baseline gap-1">
                    <span class="text-2xl font-black text-slate-900">{priceLabel}</span>
                    {#if !isFree}<span class="text-xs text-slate-600">
                        /{#if form.billingCycle === "annual"}{"year"}{:else}{"month"}{/if}
                      </span>{/if}
                  </div>

                  
                  <div class="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div class="flex items-center gap-2">
                      <SvgIcon name="Users" class="size-3.5 text-slate-600" />
                      <span>
                        {#if plan.maxUsers}{`${plan.maxUsers.toLocaleString()} member limit`}{:else}{"Unlimited team members"}{/if}
                      </span>
                    </div>
                    {#if plan.trialDays > 0}<div class="flex items-center gap-2">
                        <SvgIcon name="Calendar" class="size-3.5 text-slate-600" />
                        <span>{plan.trialDays}-day free trial included</span>
                      </div>{/if}
                    <div class="flex items-center gap-2">
                      <SvgIcon name="Shield" class="size-3.5 text-slate-600" />
                      <span>Enterprise multi-tenant isolation</span>
                    </div>
                  </div>
                </div>

                <div class="mt-5 pt-3">
                  <span aria-hidden="true" class={`w-full rounded-lg py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}>
                    {#if isSelected}{"Selected Tier"}{:else}{"Select Plan"}{/if}
                  </span>
                </div>
              </label>{/each}
        </div>{/if}{/if}

      {#if selectedPlan}<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-3">
          <SvgIcon name="Sparkles" class="size-4 text-primary shrink-0 mt-0.5" />
          <p>
            The selected plan (<strong>{selectedPlan.name}</strong>) will be staged in a pending state. When the Platform Owner approves this organization, the provisioning pipeline will activate the subscription under the chosen <strong>{form.billingCycle}</strong> cycle.
          </p>
        </div>{/if}
    </div>
