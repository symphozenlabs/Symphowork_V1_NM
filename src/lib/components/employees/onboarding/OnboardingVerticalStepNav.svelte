<script lang="ts">
import{ROLE_METADATA,getAssignableRoles,type SystemRole}from'$lib/domain/rbac/permissions';import{ONBOARDING_WIZARD_STEPS,type OnboardingWizardStepId,type OnboardingWizardStepDefinition,type OnboardingWizardFormState,type MasterDataItem,type ManagerSummary}from'./types';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface OnboardingStepNavProps {
  currentStep: OnboardingWizardStepId;
  onStepClick: (stepId: OnboardingWizardStepId) => void;
  completedSteps?: Set<OnboardingWizardStepId>;
  steps?: OnboardingWizardStepDefinition[];
}
let {
  currentStep,
  onStepClick,
  completedSteps = new Set(),
  steps = ONBOARDING_WIZARD_STEPS,
}:OnboardingStepNavProps=$props();
</script>
<nav aria-label="Onboarding Progress" class="w-full">
      <ol class="space-y-2">
        {#each steps as step, index}{@const isCurrent = step.id === currentStep}{@const isCompleted = completedSteps.has(step.id) || currentStep > step.id}{@const isClickable = (step.id < currentStep && currentStep <= 3) ||
            (isCompleted && step.id <= 3)}<li class="relative">
              {#if index < steps.length - 1}<div aria-hidden="true" class={`absolute left-[19px] top-[32px] bottom-[-8px] w-[2px] transition-colors duration-200 ${
                    currentStep > step.id ? "bg-emerald-500" : "bg-slate-200"
                  }`}></div>{/if}

              <button type="button" disabled={!isClickable} onclick={() => isClickable && onStepClick(step.id)} class={`group flex items-start gap-3 w-full text-left p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-white shadow-xs border border-primary/20 ring-1 ring-primary/20"
                    : isClickable
                    ? "cursor-pointer hover:bg-white/80"
                    : "cursor-default opacity-80"
                }`} aria-current={isCurrent ? "step" : undefined}>
                <span class={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-primary text-white ring-4 ring-primary/15 shadow-xs"
                      : isCompleted
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border-2 border-slate-200 bg-white text-slate-400"
                  }`}>
                  {#if isCompleted && !isCurrent}<SvgIcon name="Check" class="size-4 stroke-[2.5]" />{:else}{step.id}{/if}
                </span>

                <div class="min-w-0 flex-1 pt-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class={`text-xs font-bold tracking-tight transition-colors ${
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                          ? "text-slate-800 group-hover:text-slate-900"
                          : "text-slate-500"
                      }`}>
                      {step.title}
                    </span>
                    {#if isCurrent}<span class="size-1.5 rounded-full bg-primary animate-pulse"></span>{/if}
                  </div>
                  <p class={`mt-0.5 text-[11px] leading-snug transition-colors line-clamp-2 ${
                      isCurrent
                        ? "text-slate-600 font-medium"
                        : isCompleted
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}>
                    {step.description}
                  </p>
                </div>
              </button>
            </li>{/each}
      </ol>
    </nav>
