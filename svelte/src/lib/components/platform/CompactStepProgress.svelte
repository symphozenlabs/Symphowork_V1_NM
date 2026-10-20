<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface StepNavProps {
  currentStep: WizardStepId;
  onStepClick: (stepId: WizardStepId) => void;
  completedSteps?: Set<WizardStepId>;
  steps?: WizardStepDefinition[];
}
let {
  currentStep,
  steps = WIZARD_STEPS,
}:{
  currentStep: WizardStepId;
  steps?: WizardStepDefinition[];
}=$props();
const currentStepDef=$derived(steps.find((s) => s.id === currentStep) || steps[0]);
const progressPercent=$derived(Math.round((currentStep / steps.length) * 100));


import { WIZARD_STEPS } from '$lib/components/platform/organization-wizard-types';
import type { WizardStepId, WizardStepDefinition } from '$lib/components/platform/organization-wizard-types';</script>
<div class="w-full">
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span class="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {currentStep}
          </span>
          <span class="font-bold text-slate-900">{currentStepDef.title}</span>
          <span class="text-slate-400">·</span>
          <span class="text-slate-500">Step {currentStep} of {steps.length}</span>
        </div>
        <span class="text-[11px] font-semibold text-slate-500">{progressPercent}%</span>
      </div>

      
      <div class="mt-2 flex items-center gap-1.5">
        {#each steps as s}{@const isPast = currentStep > s.id}{@const isCurr = currentStep === s.id}<div class={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                isPast
                  ? "bg-emerald-500"
                  : isCurr
                  ? "bg-primary"
                  : "bg-slate-200"
              }`}></div>{/each}
      </div>
    </div>
