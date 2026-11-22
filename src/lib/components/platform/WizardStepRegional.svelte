<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import { TIMEZONES, CURRENCIES, DATE_FORMATS } from '$lib/components/platform/organization-wizard-types';


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface WizardStepRegionalProps {
  form: OrganizationWizardFormState;
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
}
let {
  form,
  errors,
  onChange,
}:WizardStepRegionalProps=$props();


import type { OrganizationWizardFormState } from '$lib/components/platform/organization-wizard-types';</script>
<div class="space-y-6">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Regional & Localization Settings</h3>
        <p class="mt-1 text-sm text-slate-600">
          Configure default timezone, currency, and date formatting conventions for the workspace.
        </p>
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        
        <div class="md:col-span-2">
          <label for="organization-timezone" class="block text-sm font-semibold text-slate-900">
            Default Timezone <span class="text-rose-600">*</span>
          </label>
          <div class="mt-1.5 relative">
            <SvgIcon name="Clock" class="absolute left-3 top-2.5 size-4 text-slate-600" />
            <select id="organization-timezone" value={form.timezone} onchange={(e) => onChange({ timezone: e.currentTarget.value })} class={`w-full rounded-lg border bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                errors.timezone ? "border-rose-500" : "border-slate-300"
              }`}>
              {#each TIMEZONES as tz}<option value={tz.value}>
                  {tz.label}
                </option>{/each}
            </select>
          </div>
          {#if errors.timezone}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.timezone}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              Used for attendance logging, shift scheduling, audit timestamps, and daily digest notifications.
            </p>{/if}
        </div>

        
        <div>
          <label for="organization-currency" class="block text-sm font-semibold text-slate-900">
            Primary Currency <span class="text-rose-600">*</span>
          </label>
          <div class="mt-1.5 relative">
            <SvgIcon name="DollarSign" class="absolute left-3 top-2.5 size-4 text-slate-600" />
            <select id="organization-currency" value={form.currency} onchange={(e) => onChange({ currency: e.currentTarget.value.toUpperCase() })} class={`w-full rounded-lg border bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                errors.currency ? "border-rose-500" : "border-slate-300"
              }`}>
              {#each CURRENCIES as cur}<option value={cur.value}>
                  {cur.label}
                </option>{/each}
            </select>
          </div>
          {#if errors.currency}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.currency}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              ISO-4217 standard currency code used across payroll, expense reporting, and billing.
            </p>{/if}
        </div>

        
        <div>
          <label for="organization-date-format" class="block text-sm font-semibold text-slate-900">
            Date Format <span class="text-rose-600">*</span>
          </label>
          <div class="mt-1.5 relative">
            <SvgIcon name="Calendar" class="absolute left-3 top-2.5 size-4 text-slate-600" />
            <select id="organization-date-format" value={form.dateFormat} onchange={(e) => onChange({ dateFormat: e.currentTarget.value })} class={`w-full rounded-lg border bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                errors.dateFormat ? "border-rose-500" : "border-slate-300"
              }`}>
              {#each DATE_FORMATS as fmt}<option value={fmt.value}>
                  {fmt.label}
                </option>{/each}
            </select>
          </div>
          {#if errors.dateFormat}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.dateFormat}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              Standard date representation displayed in reports, employee profiles, and logs.
            </p>{/if}
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-3">
        <SvgIcon name="Globe2" class="size-4 text-slate-600 shrink-0 mt-0.5" />
        <p>
          Regional settings establish workspace defaults. Tenant administrators can customize secondary display preferences within organization workspace settings after onboarding.
        </p>
      </div>
    </div>
