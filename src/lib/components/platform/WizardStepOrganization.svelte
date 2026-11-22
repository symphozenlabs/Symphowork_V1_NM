<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface WizardStepOrganizationProps {
  form: OrganizationWizardFormState;
  errors: Record<string, string>;
  onChange: (updates: Partial<OrganizationWizardFormState>) => void;
}
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
let {
  form,
  errors,
  onChange,
}:WizardStepOrganizationProps=$props();
const handleNameChange = (name: string) => {
    const updates: Partial<OrganizationWizardFormState> = { name };
    if (!form.slugEditedManually) {
      updates.slug = slugify(name);
    }
    onChange(updates);
  };
const handleSlugChange = (slug: string) => {
    onChange({
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      slugEditedManually: true,
    });
  };
const handleRegenerateSlug = () => {
    onChange({
      slug: slugify(form.name),
      slugEditedManually: false,
    });
  };


import type { OrganizationWizardFormState } from '$lib/components/platform/organization-wizard-types';</script>
<div class="space-y-6">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Organization Details</h3>
        <p class="mt-1 text-sm text-slate-600">
          Enter the essential identity details for the new tenant workspace.
        </p>
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        
        <div class="md:col-span-2">
          <label for="organization-name" class="block text-sm font-semibold text-slate-900">
            Organization Name <span class="text-rose-600">*</span>
          </label>
          <div class="mt-1.5 relative">
            <Input id="organization-name" type="text" placeholder="e.g. Acme Corporation & Sons (India)" value={form.name} onchange={(e) => handleNameChange(e.currentTarget.value)} class={errors.name ? "border-rose-500 pr-10" : ""} />
          </div>
          {#if errors.name}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.name}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              The primary display name shown across the workspace (2–160 characters).
            </p>{/if}
        </div>

        
        <div>
          <label for="organization-legal-name" class="block text-sm font-semibold text-slate-900">
            Legal Entity Name
          </label>
          <div class="mt-1.5">
            <Input id="organization-legal-name" type="text" placeholder="e.g. Acme Corporation India Private Limited" value={form.legalName} onchange={(e) => onChange({ legalName: e.currentTarget.value })} class={errors.legalName ? "border-rose-500" : ""} />
          </div>
          {#if errors.legalName}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.legalName}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              Optional registered business name for contracts and invoicing. Defaults to Organization Name if left blank.
            </p>{/if}
        </div>

        
        <div>
          <label for="organization-website" class="block text-sm font-semibold text-slate-900">
            Website URL
          </label>
          <div class="mt-1.5 relative">
            <SvgIcon name="Globe" class="absolute left-3 top-2.5 size-4 text-slate-600" />
            <Input id="organization-website" type="url" placeholder="https://example.com" value={form.website} onchange={(e) => onChange({ website: e.currentTarget.value })} class={`pl-9 ${errors.website ? "border-rose-500" : ""}`} />
          </div>
          {#if errors.website}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.website}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              Official company website (e.g. https://acme.com).
            </p>{/if}
        </div>

        
        <div class="md:col-span-2">
          <div class="flex items-center justify-between">
            <label for="organization-slug" class="block text-sm font-semibold text-slate-900">
              Workspace Slug <span class="text-rose-600">*</span>
            </label>
            {#if form.slugEditedManually}<button type="button" onclick={handleRegenerateSlug} class="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                <SvgIcon name="RefreshCw" class="size-3" /> Auto-sync from name
              </button>{/if}
          </div>
          <div class="mt-1.5 flex rounded-lg border bg-slate-50 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary overflow-hidden">
            <span class="inline-flex items-center px-3 text-xs text-slate-600 bg-slate-100 border-r select-none">
              app.symphowork.com/
            </span>
            <input id="organization-slug" type="text" placeholder="acme-corp" value={form.slug} onchange={(e) => handleSlugChange(e.currentTarget.value)} class="flex-1 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none" />
          </div>
          {#if errors.slug}<p class="mt-1.5 text-xs text-rose-600 font-medium">{errors.slug}</p>{:else}<p class="mt-1 text-xs text-slate-600">
              Unique identifier used in URLs. Lowercase letters, numbers, and hyphens only (no spaces).
            </p>{/if}
        </div>
      </div>
    </div>
