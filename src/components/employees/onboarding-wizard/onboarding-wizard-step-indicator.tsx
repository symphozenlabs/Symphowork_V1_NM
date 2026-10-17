"use client";

import React from "react";
import { Check } from "lucide-react";
import {
  ONBOARDING_WIZARD_STEPS,
  type OnboardingWizardStepId,
  type OnboardingWizardStepDefinition,
} from "./types";

export interface OnboardingStepNavProps {
  currentStep: OnboardingWizardStepId;
  onStepClick: (stepId: OnboardingWizardStepId) => void;
  completedSteps?: Set<OnboardingWizardStepId>;
  steps?: OnboardingWizardStepDefinition[];
}

export function OnboardingVerticalStepNav({
  currentStep,
  onStepClick,
  completedSteps = new Set(),
  steps = ONBOARDING_WIZARD_STEPS,
}: OnboardingStepNavProps) {
  return (
    <nav aria-label="Onboarding Progress" className="w-full">
      <ol className="space-y-2">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = completedSteps.has(step.id) || currentStep > step.id;
          // Step 4 and 5 are completed after creation and cannot be navigated backward into form edit without resetting
          const isClickable =
            (step.id < currentStep && currentStep <= 3) ||
            (isCompleted && step.id <= 3);

          return (
            <li key={step.id} className="relative">
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`absolute left-[19px] top-[32px] bottom-[-8px] w-[2px] transition-colors duration-200 ${
                    currentStep > step.id ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}

              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.id)}
                className={`group flex items-start gap-3 w-full text-left p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-white shadow-xs border border-primary/20 ring-1 ring-primary/20"
                    : isClickable
                    ? "cursor-pointer hover:bg-white/80"
                    : "cursor-default opacity-80"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-primary text-white ring-4 ring-primary/15 shadow-xs"
                      : isCompleted
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border-2 border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="size-4 stroke-[2.5]" />
                  ) : (
                    step.id
                  )}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold tracking-tight transition-colors ${
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                          ? "text-slate-800 group-hover:text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p
                    className={`mt-0.5 text-[11px] leading-snug transition-colors line-clamp-2 ${
                      isCurrent
                        ? "text-slate-600 font-medium"
                        : isCompleted
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function OnboardingCompactStepProgress({
  currentStep,
  steps = ONBOARDING_WIZARD_STEPS,
}: {
  currentStep: OnboardingWizardStepId;
  steps?: OnboardingWizardStepDefinition[];
}) {
  const currentStepDef = steps.find((s) => s.id === currentStep) || steps[0];
  const progressPercent = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {currentStep}
          </span>
          <span>{currentStepDef.title}</span>
        </div>
        <span className="font-mono text-[11px] text-muted">
          Step {currentStep} of {steps.length}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
