<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface WizardStepOwnerProps {
  form: OrganizationWizardFormState;
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
}
let {
  form,
  errors,
  onChange,
}:WizardStepOwnerProps=$props();


import type { OrganizationWizardFormState } from '$lib/components/platform/organization-wizard-types';</script>
<div class="space-y-6">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Organization Owner</h3>
        <p class="mt-1 text-sm text-slate-600">
          Specify the primary administrator account for this tenant workspace.
        </p>
      </div>

      
      <div class="rounded-xl border border-sky-100 bg-sky-50/70 p-4 text-xs text-sky-900 leading-relaxed flex items-start gap-3">
        <SvgIcon name="ShieldCheck" class="size-5 text-sky-600 shrink-0 mt-0.5" />
        <div class="space-y-1">
          <p class="font-semibold text-sky-950">
            Designated Role: <span class="underline decoration-sky-400">ORGANIZATION_OWNER</span>
          </p>
          <p class="text-sky-800">
            Upon Platform Owner approval and workspace provisioning, a secure onboarding invitation will be generated and dispatched to this address. Accepting the invitation grants full root-level ownership of the tenant workspace.
          </p>
        </div>
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        
        <div class="md:col-span-2">
          <label for="organization-owner-email" class="block text-sm font-semibold text-slate-900">
            Organization Owner Email <span class="text-rose-600">*</span>
          </label>
          <div class="mt-1.5 relative">
            <SvgIcon name="Mail" class="absolute left-3 top-2.5 size-4 text-slate-600" />
            <Input id="organization-owner-email" type="email" placeholder="owner@company.com" value={form.ownerEmail} onchange={(e) => onChange({ ownerEmail: e.currentTarget.value })} class={`pl-9 ${errors.ownerEmail ? "border-rose-500" : ""}`} />
          </div>
          {#if errors.ownerEmail}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.ownerEmail}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              The primary owner&apos;s direct corporate email address. Invitation tokens and recovery notices will be delivered here.
            </p>{/if}
        </div>

        
        <div class="md:col-span-2">
          <label for="organization-owner-full-name" class="block text-sm font-semibold text-slate-900">
            Owner Full Name
          </label>
          <div class="mt-1.5 relative">
            <SvgIcon name="User" class="absolute left-3 top-2.5 size-4 text-slate-600" />
            <Input id="organization-owner-full-name" type="text" placeholder="e.g. Eleanor Vance" value={form.ownerFullName} onchange={(e) => onChange({ ownerFullName: e.currentTarget.value })} class={`pl-9 ${errors.ownerFullName ? "border-rose-500" : ""}`} />
          </div>
          {#if errors.ownerFullName}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.ownerFullName}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              Optional full name of the initial tenant owner (2–160 characters).
            </p>{/if}
        </div>
      </div>

      
      <div class="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
        <SvgIcon name="AlertCircle" class="size-4 text-slate-600 shrink-0 mt-0.5" />
        <p>
          <strong>Note:</strong> The Owner Email is separate from the Official Organization Contact Email configured in Step 2. If the Official Contact Email was omitted, this Owner Email will serve as the fallback administrative contact for the organization entity.
        </p>
      </div>
    </div>
