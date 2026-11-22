<script lang="ts">
import{ROLE_METADATA,getAssignableRoles,type SystemRole}from'$lib/domain/rbac/permissions';import{ONBOARDING_WIZARD_STEPS,type OnboardingWizardStepId,type OnboardingWizardStepDefinition,type OnboardingWizardFormState,type MasterDataItem,type ManagerSummary}from'./types';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import RoleIllustration from "$lib/components/employees/onboarding/RoleIllustration.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface Step4ProfileCreatedProps {
  form: OnboardingWizardFormState;
  onProceedToInvite: () => void;
  isSendingInvite?: boolean;
}
let {
  form,
  onProceedToInvite,
  isSendingInvite = false,
}:Step4ProfileCreatedProps=$props();
const roleMeta=$derived(ROLE_METADATA[form.targetRole] || ROLE_METADATA.EMPLOYEE);
const fullName=$derived(form.createdDisplayName || [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" "));
const employeeCode=$derived(form.createdEmployeeCode || "Assigned");
</script>
<div class="space-y-6">
      
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6 text-center sm:text-left">
        <div class="flex flex-col sm:flex-row items-center gap-4">
          <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <SvgIcon name="CheckCircle2" class="size-8 stroke-[2.2]" />
          </div>
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <span class="size-1.5 rounded-full bg-emerald-600"></span>
              Profile Created in Directory
            </div>
            <h2 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {fullName} is Enrolled!
            </h2>
            <p class="text-xs text-muted">
              The workforce profile has been registered in the database. Next, dispatch an invitation to grant system credentials.
            </p>
          </div>
        </div>
      </div>

      
      <div class="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <SvgIcon name="UserCheck" class="size-4 text-primary" />
            <h3 class="text-sm font-bold text-foreground">Generated Directory Record</h3>
          </div>
          <span class="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-800">
            Status: INVITED
          </span>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 text-xs">
          <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <span class="flex items-center gap-1 text-[11px] font-medium text-muted">
              <SvgIcon name="Hash" class="size-3 text-muted" />
              Employee ID
            </span>
            <span class="font-mono text-sm font-bold text-primary">
              {employeeCode}
            </span>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <span class="flex items-center gap-1 text-[11px] font-medium text-muted">
              <SvgIcon name="ShieldCheck" class="size-3 text-muted" />
              Authorized Role
            </span>
            <div class="flex items-center gap-1.5">
              <span class="font-semibold text-foreground">{roleMeta.title}</span>
              <span class="font-mono text-[10px] text-muted">({form.targetRole})</span>
            </div>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <span class="flex items-center gap-1 text-[11px] font-medium text-muted">
              <SvgIcon name="Mail" class="size-3 text-muted" />
              Target Email
            </span>
            <span class="truncate font-mono text-slate-800" title={form.personalEmail}>
              {form.personalEmail}
            </span>
          </div>
        </div>

        
        <div class="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5">
          <RoleIllustration roleKey={form.targetRole} selected class="size-12 shrink-0" />
          <div class="space-y-0.5 text-xs">
            <span class="font-bold text-foreground">{roleMeta.title} Permissions & Scope</span>
            <p class="text-muted leading-relaxed">{roleMeta.description}</p>
          </div>
        </div>
      </div>

      
      <div class="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 space-y-1.5">
        <div class="flex items-center gap-1.5 font-bold">
          <span class="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
          <span>Next Step: Account Invitation</span>
        </div>
        <p class="text-blue-800 leading-relaxed">
          The employee profile exists with <code class="rounded bg-blue-100 px-1 font-mono text-[11px]">userId = null</code>.
          Dispatching an invitation links a secure 7-day acceptance token to this profile and allows the candidate to set their credentials.
        </p>
      </div>

      
      <div class="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <a href="/app/employees" class="w-full sm:w-auto text-center rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted hover:bg-slate-50 hover:text-foreground transition-colors">
          Finish Later / View Directory
        </a>

        <Button type="button" onclick={onProceedToInvite} disabled={isSendingInvite} class="w-full sm:w-auto gap-2 font-bold bg-primary text-white hover:bg-primary/90">
          <span>{#if isSendingInvite}{"Sending Invitation…"}{:else}{"Send Account Invitation"}{/if}</span>
          <SvgIcon name="ArrowRight" class="size-4" />
        </Button>
      </div>
    </div>
