<script lang="ts">
import{ROLE_METADATA,getAssignableRoles,type SystemRole}from'$lib/domain/rbac/permissions';import{ONBOARDING_WIZARD_STEPS,type OnboardingWizardStepId,type OnboardingWizardStepDefinition,type OnboardingWizardFormState,type MasterDataItem,type ManagerSummary}from'./types';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import RoleIllustration from "$lib/components/employees/onboarding/RoleIllustration.svelte";
import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface Step5InvitationStatusProps {
  form: OnboardingWizardFormState;
  onResendInvite: () => Promise<void>;
  isResending: boolean;
  resendError: string | null;
  onResetWizard: () => void;
}
let {
  form,
  onResendInvite,
  isResending,
  resendError,
  onResetWizard,
}:Step5InvitationStatusProps=$props();
let copied=$state(untrack(()=>(false)));
const setCopied=(next:typeof copied|((previous:typeof copied)=>typeof copied))=>{copied=typeof next==="function"?(next as (previous:typeof copied)=>typeof copied)(copied):next;};
const roleMeta=$derived(ROLE_METADATA[form.targetRole] || ROLE_METADATA.EMPLOYEE);
const fullName=$derived(form.createdDisplayName || [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" "));
const employeeCode=$derived(form.createdEmployeeCode || "Assigned");
const delivery=$derived(form.invitationDelivery || "failed");
const handleCopyLink = async () => {
    if (!form.invitationUrl) return;
    try {
      await navigator.clipboard.writeText(form.invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };
const lifecycleStages=$derived([
    {
      title: "Profile Created",
      subtitle: `ID: ${employeeCode}`,
      state: "completed" as const,
    },
    {
      title: delivery === "sent" ? "Invitation Sent" : "Invitation Delivery",
      subtitle: delivery === "not_configured" ? "Manual link ready" : delivery === "sent" ? "Dispatched" : "Needs attention",
      state: delivery === "sent" || delivery === "not_configured" ? "completed" as const : "pending" as const,
    },
    {
      title: "Token Accepted",
      subtitle: "Awaiting candidate",
      state: "pending" as const,
    },
    {
      title: "Active Employee",
      subtitle: "Role granted",
      state: "upcoming" as const,
    },
  ]);
</script>
<div class="space-y-6">
      
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6">
        <div class="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <SvgIcon name="Sparkles" class="size-8 stroke-[2.2]" />
          </div>
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <span class="size-1.5 rounded-full bg-emerald-600"></span>
              Onboarding Initiated
            </div>
            <h2 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {delivery === "sent" ? "Invitation Dispatched" : delivery === "not_configured" ? "Invitation Link Ready" : "Invitation Needs Attention"} for {fullName}
            </h2>
            <p class="text-xs text-muted">
              The user account link is initialized with the authorized{" "}
              <span class="font-semibold text-foreground">{roleMeta.title}</span> role.
            </p>
          </div>
        </div>
      </div>

      
      <div class="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <SvgIcon name="Clock" class="size-4 text-primary" />
            <h3 class="text-sm font-bold text-foreground">Onboarding Lifecycle Tracker</h3>
          </div>
          <span class="text-[11px] font-medium text-muted">Step 2 of 4 In Progress</span>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {#each lifecycleStages as stage, idx}{@const isCompleted = stage.state === "completed"}{@const isPending = stage.state === "pending"}<div class={`relative flex flex-col rounded-xl border p-3 transition-colors ${
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-950"
                    : isPending
                      ? "border-amber-200 bg-amber-50/50 text-amber-950"
                      : "border-slate-200 bg-slate-50/50 text-slate-500"
                }`}>
                <div class="flex items-center gap-2 mb-1.5">
                  <span class={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isPending
                          ? "bg-amber-500 text-white animate-pulse"
                          : "bg-slate-300 text-slate-700"
                    }`}>
                    {#if isCompleted}<SvgIcon name="Check" class="size-3 stroke-[3]" />{:else}{idx + 1}{/if}
                  </span>
                  <span class="text-[11px] font-bold tracking-tight">
                    {stage.title}
                  </span>
                </div>
                <span class="text-[10px] text-muted-foreground">{stage.subtitle}</span>
              </div>{/each}
        </div>
      </div>

      
      {#if delivery === "sent"}<div class="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950">
          <SvgIcon name="CheckCircle2" class="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <div class="space-y-0.5">
            <span class="font-bold">Email dispatched successfully</span>
            <p class="text-emerald-800 leading-relaxed">
              An invitation email containing a secure 7-day sign-in token has been sent to{" "}
              <strong class="font-semibold text-emerald-950">{form.personalEmail}</strong>.
            </p>
          </div>
        </div>{/if}

      {#if delivery === "not_configured"}<div class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950">
          <SvgIcon name="AlertTriangle" class="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div class="space-y-1">
            <span class="font-bold">Email service not configured in this environment</span>
            <p class="text-amber-800 leading-relaxed">
              Automated SMTP/Resend email delivery is inactive in development or demo mode.
              You can copy the secure invitation link below and share it directly with the user.
            </p>
          </div>
        </div>{/if}

      {#if delivery === "failed"}<div class="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-950">
          <SvgIcon name="AlertTriangle" class="size-4 shrink-0 text-rose-600 mt-0.5" />
          <div class="space-y-1">
            <span class="font-bold">Automated email delivery failed</span>
            <p class="text-rose-800 leading-relaxed">
              Invitation delivery could not be confirmed.
              {form.invitationUrl ? "Use the available invitation link or try resending." : "Try resending, or return to the employee directory to review the invitation status."}
            </p>
          </div>
        </div>{/if}

      
      {#if form.invitationUrl}<div class="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-foreground">
              Direct Invitation URL (1-Click Copy)
            </span>
            <span class="text-[11px] font-medium text-muted">Expires in 7 days</span>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch gap-2">
            <input type="text" readOnly value={form.invitationUrl} class="flex-1 rounded-xl border border-border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary" />
            <Button type="button" onclick={handleCopyLink} class="shrink-0 gap-1.5 font-bold" variant={copied ? "primary" : "outline"}>
              {#if copied}
                  <SvgIcon name="Check" class="size-3.5 text-emerald-400 stroke-[3]" />
                  <span>Copied!</span>
                {:else}
                  <SvgIcon name="Copy" class="size-3.5" />
                  <span>Copy Link</span>
                {/if}
            </Button>
          </div>

          <p class="text-[11px] text-muted leading-relaxed">
            When the candidate opens this link, they will verify their details, configure a secure password,
            and instantly gain workspace access as <strong class="text-foreground">{roleMeta.title}</strong>.
          </p>
        </div>{/if}

      {#if resendError}<div role="alert" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
          {resendError}
        </div>{/if}

      
      <div class="flex items-center gap-4 rounded-2xl border border-border/80 bg-white p-4 shadow-xs">
        <RoleIllustration roleKey={form.targetRole} selected class="size-12 shrink-0" />
        <div class="flex-1 min-w-0 space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-bold text-foreground">{fullName}</span>
            <span class="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-700">
              {employeeCode}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 text-xs text-muted">
            <span>Role: <strong class="text-foreground">{roleMeta.title}</strong></span>
            <span>•</span>
            <span class="truncate">Email: <span class="font-mono">{form.personalEmail}</span></span>
          </div>
        </div>
      </div>

      
      <div class="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <div class="flex w-full sm:w-auto items-center gap-2">
          <Button type="button" variant="outline" onclick={onResetWizard} class="w-full sm:w-auto gap-1.5 text-xs font-semibold">
            <SvgIcon name="PlusCircle" class="size-3.5" />
            <span>Onboard Another Employee</span>
          </Button>

          {#if delivery !== "sent"}<Button type="button" variant="ghost" onclick={onResendInvite} disabled={isResending} class="hidden sm:inline-flex gap-1.5 text-xs text-muted hover:text-foreground">
              <SvgIcon name="RotateCw" class={`size-3.5 ${isResending ? "animate-spin" : ""}`} />
              <span>Resend</span>
            </Button>{/if}
        </div>

        <a href="/app/employees" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-colors">
          <SvgIcon name="Users" class="size-3.5" />
          <span>View in Employee Directory</span>
        </a>
      </div>
    </div>
