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
  steps = ONBOARDING_WIZARD_STEPS,
}:{
  currentStep: OnboardingWizardStepId;
  steps?: OnboardingWizardStepDefinition[];
}=$props();
const currentStepDef=$derived(steps.find((s) => s.id === currentStep) || steps[0]);
const progressPercent=$derived(Math.round(((currentStep - 1) / (steps.length - 1)) * 100));
</script>
<div class="w-full space-y-2">
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5 font-bold text-foreground">
          <span class="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {currentStep}
          </span>
          <span>{currentStepDef.title}</span>
        </div>
        <span class="font-mono text-[11px] text-muted">
          Step {currentStep} of {steps.length}
        </span>
      </div>

      <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div class="h-full bg-primary transition-all duration-300 ease-out" style:width={`${progressPercent}%`}></div>
      </div>
    </div>
