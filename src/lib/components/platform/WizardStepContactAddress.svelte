<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import { COUNTRIES } from '$lib/components/platform/organization-wizard-types';

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface WizardStepContactAddressProps {
  form: OrganizationWizardFormState;
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
}
let {
  form,
  errors,
  onChange,
}:WizardStepContactAddressProps=$props();


import type { OrganizationWizardFormState } from '$lib/components/platform/organization-wizard-types';</script>
<div class="space-y-6">
      <div>
        <h3 class="text-lg font-bold text-slate-900">
          Organization Contact & Headquarters / Registered Address
        </h3>
        <p class="mt-1 text-sm text-slate-600">
          Official communication channels and registered legal address for this organization.
        </p>
      </div>

      <div class="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
        <SvgIcon name="Building2" class="size-5 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <p class="font-semibold text-blue-950">Official Organization Identity</p>
          <p class="mt-0.5 text-blue-800">
            This contact information represents the organization entity (such as{" "}
            <span class="font-mono">contact@company.com</span>). The individual Owner login and invitation will be configured in the next step.
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 border-b pb-1.5">
          Official Contact Information
        </h4>
        <div class="grid gap-4 md:grid-cols-2">
          
          <div>
            <label for="organization-contact-email" class="block text-sm font-semibold text-slate-900">
              Official Organization Email
            </label>
            <div class="mt-1.5 relative">
              <SvgIcon name="Mail" class="absolute left-3 top-2.5 size-4 text-slate-600" />
              <Input id="organization-contact-email" type="email" placeholder="contact@company.com" value={form.contactEmail} onchange={(e) => onChange({ contactEmail: e.currentTarget.value })} class={`pl-9 ${errors.contactEmail ? "border-rose-500" : ""}`} />
            </div>
            {#if errors.contactEmail}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.contactEmail}</p>{:else}<p class="mt-1 text-xs text-slate-600">
                Optional. If left blank, will default to the Owner email.
              </p>{/if}
          </div>

          
          <div>
            <label for="organization-contact-phone" class="block text-sm font-semibold text-slate-900">
              Official Organization Phone
            </label>
            <div class="mt-1.5 relative">
              <SvgIcon name="Phone" class="absolute left-3 top-2.5 size-4 text-slate-600" />
              <Input id="organization-contact-phone" type="tel" placeholder="+919876543210" value={form.contactPhone} onchange={(e) => onChange({ contactPhone: e.currentTarget.value })} class={`pl-9 ${errors.contactPhone ? "border-rose-500" : ""}`} />
            </div>
            {#if errors.contactPhone}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.contactPhone}</p>{:else}<p class="mt-1 text-xs text-slate-600">
                International format: e.g. +919876543210 (digits only, optional leading +).
              </p>{/if}
          </div>
        </div>
      </div>

      <div class="space-y-4 pt-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 border-b pb-1.5 flex items-center gap-2">
          <SvgIcon name="MapPin" class="size-3.5 text-slate-600" /> Headquarters / Registered Address
        </h4>

        <div class="grid gap-4 md:grid-cols-2">
          
          <div class="md:col-span-2">
            <label for="organization-address-line-1" class="block text-sm font-semibold text-slate-900">
              Address Line 1
            </label>
            <div class="mt-1.5">
              <Input id="organization-address-line-1" type="text" placeholder="Building name, Street address, Suite / Floor" value={form.addressLine1} onchange={(e) => onChange({ addressLine1: e.currentTarget.value })} class={errors.addressLine1 ? "border-rose-500" : ""} />
            </div>
            {#if errors.addressLine1}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.addressLine1}</p>{/if}
          </div>

          
          <div class="md:col-span-2">
            <label for="organization-address-line-2" class="block text-sm font-semibold text-slate-900">
              Address Line 2
            </label>
            <div class="mt-1.5">
              <Input id="organization-address-line-2" type="text" placeholder="Area, Landmark, District (optional)" value={form.addressLine2} onchange={(e) => onChange({ addressLine2: e.currentTarget.value })} class={errors.addressLine2 ? "border-rose-500" : ""} />
            </div>
            {#if errors.addressLine2}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.addressLine2}</p>{/if}
          </div>

          
          <div>
            <label for="organization-city" class="block text-sm font-semibold text-slate-900">
              City
            </label>
            <div class="mt-1.5">
              <Input id="organization-city" type="text" placeholder="e.g. Mumbai, New York" value={form.city} onchange={(e) => onChange({ city: e.currentTarget.value })} class={errors.city ? "border-rose-500" : ""} />
            </div>
            {#if errors.city}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.city}</p>{/if}
          </div>

          
          <div>
            <label for="organization-state" class="block text-sm font-semibold text-slate-900">
              State / Province
            </label>
            <div class="mt-1.5">
              <Input id="organization-state" type="text" placeholder="e.g. Maharashtra, California" value={form.state} onchange={(e) => onChange({ state: e.currentTarget.value })} class={errors.state ? "border-rose-500" : ""} />
            </div>
            {#if errors.state}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.state}</p>{/if}
          </div>

          
          <div>
            <label for="organization-country" class="block text-sm font-semibold text-slate-900">
              Country
            </label>
            <div class="mt-1.5">
              <select id="organization-country" value={form.country} onchange={(e) => onChange({ country: e.currentTarget.value })} class={`w-full h-10 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.country ? "border-rose-500" : "border-slate-200"
                }`}>
                <option value="">Select country...</option>
                {#each COUNTRIES as c}<option value={c}>
                    {c}
                  </option>{/each}
              </select>
            </div>
            {#if errors.country}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.country}</p>{/if}
          </div>

          
          <div>
            <label for="organization-postal-code" class="block text-sm font-semibold text-slate-900">
              Postal / ZIP Code
            </label>
            <div class="mt-1.5">
              <Input id="organization-postal-code" type="text" placeholder="e.g. 400001 or 10001" value={form.postalCode} onchange={(e) => onChange({ postalCode: e.currentTarget.value })} class={errors.postalCode ? "border-rose-500" : ""} />
            </div>
            {#if errors.postalCode}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.postalCode}</p>{:else}<p class="mt-1 text-xs text-slate-600">
                Alphanumeric postal code (3–20 characters).
              </p>{/if}
          </div>
        </div>
      </div>
    </div>
