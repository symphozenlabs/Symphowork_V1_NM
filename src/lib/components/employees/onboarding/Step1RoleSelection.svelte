<script lang="ts">
import{ROLE_METADATA,getAssignableRoles,type SystemRole}from'$lib/domain/rbac/permissions';import{ONBOARDING_WIZARD_STEPS,type OnboardingWizardStepId,type OnboardingWizardStepDefinition,type OnboardingWizardFormState,type MasterDataItem,type ManagerSummary}from'./types';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import RoleIllustration from "$lib/components/employees/onboarding/RoleIllustration.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface Step1RoleSelectionProps {
  currentUserRole?: string | null;
  selectedRole: SystemRole;
  onSelectRole: (role: SystemRole) => void;
}
let {
  currentUserRole,
  selectedRole,
  onSelectRole,
}:Step1RoleSelectionProps=$props();
const assignableRoles=$derived(getAssignableRoles(currentUserRole));
</script>
{#if assignableRoles.length === 0}<div class="rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center space-y-3">
        <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <SvgIcon name="ShieldAlert" class="size-6" />
        </div>
        <h3 class="text-base font-bold text-rose-900">
          Employee Creation Restricted
        </h3>
        <p class="mx-auto max-w-md text-xs leading-relaxed text-rose-700">
          Your current account role (
          <span class="font-mono font-semibold">
            {currentUserRole || "UNASSIGNED"}
          </span>
          ) is not authorized to onboard or invite team members. Only Organization
          Owners, HR Administrators, and HR Executives may perform workforce onboarding.
        </p>
      </div>{:else}<div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Select User Role
        </h2>
        <p class="mt-1 text-xs text-muted">
          Choose the organizational role to grant. Available choices are scoped strictly
          to your permissions.
        </p>
      </div>

      <div role="radiogroup" aria-label="Available operational roles" class="grid gap-3.5 sm:grid-cols-2">
        {#each assignableRoles as roleKey}{@const meta = ROLE_METADATA[roleKey]}{@const isSelected = selectedRole === roleKey}<div role="radio" aria-checked={isSelected} tabindex={0} onclick={() => onSelectRole(roleKey)} onkeydown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelectRole(roleKey);
                }
              }} class={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/40"
                  : "border-border/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}>
              
              <div class="shrink-0 transition-transform group-hover:scale-105">
                <RoleIllustration roleKey={roleKey} selected={isSelected} class="size-14 sm:size-16" />
              </div>

              
              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {meta.title}
                    </span>
                  </div>

                  
                  <div class={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-xs"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    }`}>
                    {#if isSelected}<SvgIcon name="Check" class="size-3 stroke-[3]" />{/if}
                  </div>
                </div>

                <span class="inline-block rounded-md border border-slate-200/80 bg-slate-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {meta.category}
                </span>

                <p class="text-[11px] leading-relaxed text-muted line-clamp-2">
                  {meta.shortDescription}
                </p>
              </div>
            </div>{/each}
      </div>
    </div>{/if}
