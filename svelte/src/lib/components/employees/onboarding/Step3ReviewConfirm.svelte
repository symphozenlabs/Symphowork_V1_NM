<script lang="ts">
import{ROLE_METADATA,getAssignableRoles,type SystemRole}from'$lib/domain/rbac/permissions';import{ONBOARDING_WIZARD_STEPS,type OnboardingWizardStepId,type OnboardingWizardStepDefinition,type OnboardingWizardFormState,type MasterDataItem,type ManagerSummary}from'./types';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import RoleIllustration from "$lib/components/employees/onboarding/RoleIllustration.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface Step3ReviewConfirmProps {
  form: OnboardingWizardFormState;
  onEditStep: (stepId: 1 | 2) => void;
  isSubmitting: boolean;
  submissionError: string | null;
  onSubmit: () => void;
  departments?: MasterDataItem[];
  designations?: MasterDataItem[];
  shifts?: MasterDataItem[];
  employmentTypes?: MasterDataItem[];
  teams?: MasterDataItem[];
  locations?: MasterDataItem[];
  managers?: ManagerSummary[];
}
let {
  form,
  onEditStep,
  isSubmitting,
  submissionError,
  onSubmit,
  departments,
  designations,
  shifts,
  employmentTypes,
  teams,
  locations,
  managers,
}:Step3ReviewConfirmProps=$props();
const roleMeta=$derived(ROLE_METADATA[form.targetRole] || ROLE_METADATA.EMPLOYEE);
const fullName=$derived([form.firstName, form.middleName, form.lastName].filter(Boolean).join(" "));
const isHrRole=$derived(form.targetRole === "HR_ADMIN" || form.targetRole === "HR_EXECUTIVE");
const isEmployeeRole=$derived(form.targetRole === "EMPLOYEE");
const isLeadershipRole=$derived(form.targetRole === "MANAGER" ||
    form.targetRole === "TEAM_LEAD" ||
    form.targetRole === "PROJECT_MANAGER");
const canAssignShift=$derived(form.targetRole !== "ORGANIZATION_OWNER");
const selectedDept=$derived(departments?.find((d) => d.id === form.departmentId));
const selectedDesig=$derived(designations?.find((d) => d.id === form.designationId));
const selectedShift=$derived(shifts?.find((s) => s.id === form.shiftId));
const selectedType=$derived(employmentTypes?.find((t) => t.id === form.employmentTypeId));
const selectedTeam=$derived(teams?.find((t) => t.id === form.teamId));
const selectedLocation=$derived(locations?.find((l) => l.id === form.locationId));
const selectedManager=$derived(managers?.find((m) => m.id === form.reportingManagerId));
</script>
<div class="space-y-6">
      <div>
        <h2 class="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Review & Confirm Profile
        </h2>
        <p class="mt-1 text-xs text-muted">
          Verify the candidate identity and organizational role assignments prior to generating the directory profile.
        </p>
      </div>

      {#if submissionError}<div role="alert" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          {submissionError}
        </div>{/if}

      
      <div class="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <SvgIcon name="ShieldCheck" class="size-4 text-primary" />
            <h3 class="text-sm font-bold text-foreground">Target Role Authorization</h3>
          </div>
          <Button type="button" variant="ghost" size="sm" onclick={() => onEditStep(1)} disabled={isSubmitting} class="h-8 gap-1 text-xs text-muted hover:text-foreground">
            <SvgIcon name="Edit3" class="size-3.5" />
            <span>Change role</span>
          </Button>
        </div>

        <div class="flex items-center gap-4">
          <div class="shrink-0">
            <RoleIllustration roleKey={form.targetRole} selected class="size-14" />
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-base font-bold text-foreground">{roleMeta.title}</span>
              <span class="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                {form.targetRole}
              </span>
            </div>
            <p class="text-xs text-muted">{roleMeta.shortDescription}</p>
          </div>
        </div>
      </div>

      
      <div class="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <SvgIcon name="User" class="size-4 text-primary" />
            <h3 class="text-sm font-bold text-foreground">Candidate Identity & Contact</h3>
          </div>
          <Button type="button" variant="ghost" size="sm" onclick={() => onEditStep(2)} disabled={isSubmitting} class="h-8 gap-1 text-xs text-muted hover:text-foreground">
            <SvgIcon name="Edit3" class="size-3.5" />
            <span>Edit details</span>
          </Button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 text-xs">
          <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span class="text-muted block text-[11px] font-medium">Full Name</span>
            <span class="font-semibold text-foreground text-sm">{fullName}</span>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span class="text-muted block text-[11px] font-medium">Personal Email (Invitation target)</span>
            <span class="font-mono text-slate-800">{form.personalEmail}</span>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span class="text-muted block text-[11px] font-medium">Phone Number</span>
            <span class="text-slate-800">{form.phone || "Not provided"}</span>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span class="text-muted block text-[11px] font-medium">Work Email Alias</span>
            <span class="font-mono text-slate-800">{form.workEmail || "Not provided"}</span>
          </div>

          {#if form.joiningDate}<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
              <span class="text-muted block text-[11px] font-medium">Joining Date</span>
              <span class="text-slate-800 font-medium">{form.joiningDate}</span>
            </div>{/if}
        </div>
      </div>

      
      <div class="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-3">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <SvgIcon name="Building2" class="size-4 text-primary" />
            <h3 class="text-sm font-bold text-foreground">Organizational Placement</h3>
          </div>
          <Button type="button" variant="ghost" size="sm" onclick={() => onEditStep(2)} disabled={isSubmitting} class="h-8 gap-1 text-xs text-muted hover:text-foreground">
            <SvgIcon name="Edit3" class="size-3.5" />
            <span>Edit</span>
          </Button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 text-xs">
          <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span class="text-muted block text-[11px] font-medium">Department</span>
            <span class="font-semibold text-foreground">
              {#if selectedDept}{`${selectedDept.name}${selectedDept.code ? ` (${selectedDept.code})` : ""}`}{:else}{#if form.departmentId}{"Assigned"}{:else}{"Not assigned"}{/if}{/if}
            </span>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
            <span class="text-muted block text-[11px] font-medium">Designation / Title</span>
            <span class="font-semibold text-foreground">
              {#if selectedDesig}{`${selectedDesig.name}${selectedDesig.code ? ` (${selectedDesig.code})` : ""}`}{:else}{#if form.designationId}{"Assigned"}{:else}{"None / Unassigned"}{/if}{/if}
            </span>
          </div>

          {#if canAssignShift}
              <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
                <span class="text-muted block text-[11px] font-medium">Work Shift</span>
                <span class="font-semibold text-foreground">
                  {#if selectedShift}{`${selectedShift.name}${selectedShift.startTime && selectedShift.endTime ? ` (${selectedShift.startTime.slice(0, 5)} – ${selectedShift.endTime.slice(0, 5)})` : ""}`}{:else}{#if form.shiftId}{"Assigned"}{:else}{"Standard organization shift"}{/if}{/if}
                </span>
              </div>

              <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
                <span class="text-muted block text-[11px] font-medium">Employment Type</span>
                <span class="font-semibold text-foreground">
                  {#if selectedType}{`${selectedType.name}${selectedType.code ? ` (${selectedType.code})` : ""}`}{:else}{#if form.employmentTypeId}{"Assigned"}{:else}{"Full-time regular"}{/if}{/if}
                </span>
              </div>
            {/if}

          
          {#if !isHrRole && form.teamId}<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
              <span class="text-muted block text-[11px] font-medium">Team / Squad</span>
              <span class="font-semibold text-foreground">
                {#if selectedTeam}{`${selectedTeam.name}${selectedTeam.code ? ` (${selectedTeam.code})` : ""}`}{:else}{form.teamId}{/if}
              </span>
            </div>{/if}

          {#if !isHrRole && form.locationId}<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
              <span class="text-muted block text-[11px] font-medium">Location / Office</span>
              <span class="font-semibold text-foreground">
                {#if selectedLocation}{selectedLocation.name}{:else}{form.locationId}{/if}
              </span>
            </div>{/if}

          {#if (isEmployeeRole || isLeadershipRole) && form.reportingManagerId}<div class="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
              <span class="text-muted block text-[11px] font-medium">Reporting Manager</span>
              <span class="font-semibold text-foreground">
                {#if selectedManager}{`${selectedManager.displayName} (${selectedManager.employeeId})`}{:else}{form.reportingManagerId}{/if}
              </span>
            </div>{/if}
        </div>

        <p class="text-xs text-muted leading-relaxed">
          The employee record will be enrolled in the directory with status{" "}
          <span class="font-semibold text-foreground">INVITED</span>. Account credential
          linking and activation will follow invitation dispatch.
        </p>
      </div>

      
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div class="space-y-0.5">
          <span class="text-xs font-bold text-emerald-900">
            Ready to enroll {form.firstName} {form.lastName}?
          </span>
          <p class="text-[11px] text-emerald-700">
            Clicking &quot;Create Employee Profile&quot; will generate the employee ID and directory entry.
          </p>
        </div>

        <Button type="button" onclick={onSubmit} disabled={isSubmitting} class="w-full sm:w-auto shrink-0 font-bold">
          {#if isSubmitting}{"Creating profile…"}{:else}{"Create Employee Profile"}{/if}
        </Button>
      </div>
    </div>
