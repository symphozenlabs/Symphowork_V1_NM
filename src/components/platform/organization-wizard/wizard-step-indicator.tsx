"use client";

import React from "react";
import { Check } from "lucide-react";
import { WIZARD_STEPS, type WizardStepId, type WizardStepDefinition } from "./types";

export interface StepNavProps {
  currentStep: WizardStepId;
  onStepClick: (stepId: WizardStepId) => void;
  completedSteps?: Set<WizardStepId>;
  steps?: WizardStepDefinition[];
}

/**
 * Desktop Two-Pane Vertical Step Navigation
 * Fixed/stable left sidebar display for all 6 steps with status, title, description, and connector lines.
 */
export function VerticalStepNav({
  currentStep,
  onStepClick,
  completedSteps = new Set(),
  steps = WIZARD_STEPS,
}: StepNavProps) {
  return (
    <nav aria-label="Wizard Steps Progress" className="w-full">
      <ol className="space-y-1.5">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = completedSteps.has(step.id) || currentStep > step.id;
          const isClickable = isCompleted || step.id < currentStep;

          return (
            <li key={step.id} className="relative">
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`absolute left-[19px] top-[32px] bottom-[-6px] w-[2px] transition-colors duration-200 ${
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
                    ? "bg-white shadow-xs border border-slate-200/90 ring-1 ring-slate-200/50"
                    : isClickable
                    ? "cursor-pointer hover:bg-white/80"
                    : "cursor-default opacity-85"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Node circle */}
                <span
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-[#172338] text-white ring-4 ring-[#172338]/15 shadow-xs"
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

                {/* Step Info */}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold tracking-tight transition-colors ${
                        isCurrent
                          ? "text-[#172338]"
                          : isCompleted
                          ? "text-slate-800 group-hover:text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="size-1.5 rounded-full bg-[#172338] animate-pulse" />
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

/**
 * Mobile and Tablet Compact Progress Indicator
 * Renders a segmented progress bar and current step title without squeezing the desktop stepper.
 */
export function CompactStepProgress({
  currentStep,
  steps = WIZARD_STEPS,
}: {
  currentStep: WizardStepId;
  steps?: WizardStepDefinition[];
}) {
  const currentStepDef = steps.find((s) => s.id === currentStep) || steps[0];
  const progressPercent = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#172338] text-[10px] font-bold text-white">
            {currentStep}
          </span>
          <span className="font-bold text-slate-900">{currentStepDef.title}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Step {currentStep} of {steps.length}</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">{progressPercent}%</span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="mt-2 flex items-center gap-1.5">
        {steps.map((s) => {
          const isPast = currentStep > s.id;
          const isCurr = currentStep === s.id;
          return (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                isPast
                  ? "bg-emerald-500"
                  : isCurr
                  ? "bg-[#172338]"
                  : "bg-slate-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Backward compatible export
 */
export function WizardStepIndicator(props: StepNavProps & { inModal?: boolean }) {
  return <VerticalStepNav {...props} />;
}
