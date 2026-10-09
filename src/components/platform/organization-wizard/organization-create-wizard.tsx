"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Building2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerticalStepNav, CompactStepProgress } from "./wizard-step-indicator";
import { WizardStepOrganization } from "./wizard-step-organization";
import { WizardStepContactAddress } from "./wizard-step-contact-address";
import { WizardStepOwner } from "./wizard-step-owner";
import { WizardStepPlan } from "./wizard-step-plan";
import { WizardStepRegional } from "./wizard-step-regional";
import { WizardStepReview } from "./wizard-step-review";
import {
  type OrganizationWizardFormState,
  type PlanSummary,
  type WizardStepId,
} from "./types";

export interface OrganizationCreateWizardProps {
  initialPlans: PlanSummary[];
  isModal?: boolean;
  onSuccess?: (createdOrg: { id: string; name: string }) => void;
  onCancel?: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

const DRAFT_STORAGE_KEY = "symphowork_create_org_draft_v1";

export function OrganizationCreateWizard({
  initialPlans,
  isModal = false,
  onSuccess,
  onCancel,
  onSubmittingChange,
}: OrganizationCreateWizardProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Find default plan (prefer active FREE plan, or first active plan)
  const defaultPlan =
    initialPlans.find((p) => p.active && p.code.toUpperCase() === "FREE") ||
    initialPlans.find((p) => p.active) ||
    initialPlans[0];

  const defaultState: OrganizationWizardFormState = {
    // Step 1
    name: "",
    legalName: "",
    slug: "",
    slugEditedManually: false,
    website: "",

    // Step 2
    contactEmail: "",
    contactPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",

    // Step 3
    ownerEmail: "",
    ownerFullName: "",

    // Step 4
    planId: defaultPlan?.id || "",
    billingCycle: "monthly",

    // Step 5
    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "dd/MM/yyyy",
  };

  const [form, setForm] = useState<OrganizationWizardFormState>(defaultState);
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStepId>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<string | null>(null);

  function getNextButtonLabel(step: WizardStepId): string {
    switch (step) {
      case 1:
        return "Next: Contact & Address";
      case 2:
        return "Next: Owner";
      case 3:
        return "Next: Plan";
      case 4:
        return "Next: Regional";
      case 5:
        return "Review";
      case 6:
        return "Create Pending Organization";
      default:
        return "Next";
    }
  }

  // Restore draft from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({
          ...prev,
          ...parsed,
          // Preserve valid planId if saved plan no longer exists
          planId:
            initialPlans.some((p) => p.id === parsed.planId && p.active)
              ? parsed.planId
              : prev.planId,
        }));
      }
    } catch {
      // Ignore sessionStorage read failures
    }
  }, [initialPlans]);

  // Persist draft to sessionStorage on state changes
  const updateForm = (updates: Partial<OrganizationWizardFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore sessionStorage write failures
      }
      return next;
    });
    // Clear field errors as user edits
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(updates)) {
        delete next[k];
      }
      return next;
    });
  };

  // Step validation helpers
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      errs.name = "Organization name is required.";
    } else if (trimmedName.length < 2) {
      errs.name = "Organization name must be at least 2 characters.";
    } else if (trimmedName.length > 160) {
      errs.name = "Organization name must not exceed 160 characters.";
    }

    if (form.legalName && form.legalName.trim().length > 0) {
      if (form.legalName.trim().length < 2) {
        errs.legalName = "Legal name must be at least 2 characters.";
      } else if (form.legalName.trim().length > 240) {
        errs.legalName = "Legal name must not exceed 240 characters.";
      }
    }

    const trimmedSlug = form.slug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!trimmedSlug) {
      errs.slug = "Workspace slug is required.";
    } else if (trimmedSlug.length < 2) {
      errs.slug = "Slug must be at least 2 characters.";
    } else if (trimmedSlug.length > 80) {
      errs.slug = "Slug must not exceed 80 characters.";
    } else if (!slugRegex.test(trimmedSlug)) {
      errs.slug =
        "Slug must consist of lowercase letters, numbers, and single hyphens without spaces or underscores.";
    }

    if (form.website && form.website.trim().length > 0) {
      const trimmedUrl = form.website.trim();
      try {
        const parsedUrl = new URL(
          trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")
            ? trimmedUrl
            : `https://${trimmedUrl}`
        );
        if (!parsedUrl.hostname || !parsedUrl.hostname.includes(".")) {
          errs.website = "Please enter a valid website URL (e.g. https://example.com).";
        }
      } catch {
        errs.website = "Please enter a valid website URL.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};

    if (form.contactEmail && form.contactEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.contactEmail.trim())) {
        errs.contactEmail = "Please enter a valid email address.";
      }
    }

    if (form.contactPhone && form.contactPhone.trim().length > 0) {
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(form.contactPhone.trim())) {
        errs.contactPhone =
          "Please enter a valid phone number with 8–15 digits (e.g. +919876543210).";
      }
    }

    if (form.addressLine1 && form.addressLine1.length > 240) {
      errs.addressLine1 = "Address line 1 must not exceed 240 characters.";
    }
    if (form.addressLine2 && form.addressLine2.length > 240) {
      errs.addressLine2 = "Address line 2 must not exceed 240 characters.";
    }
    if (form.city && form.city.length > 120) {
      errs.city = "City must not exceed 120 characters.";
    }
    if (form.state && form.state.length > 120) {
      errs.state = "State must not exceed 120 characters.";
    }
    if (form.country && form.country.length > 120) {
      errs.country = "Country must not exceed 120 characters.";
    }

    if (form.postalCode && form.postalCode.trim().length > 0) {
      const postalRegex = /^[A-Za-z0-9][A-Za-z0-9 -]{2,19}$/;
      if (!postalRegex.test(form.postalCode.trim())) {
        errs.postalCode = "Please enter a valid postal or ZIP code.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedEmail = form.ownerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errs.ownerEmail = "Organization owner email is required.";
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.ownerEmail = "Please enter a valid owner email address.";
    }

    if (form.ownerFullName && form.ownerFullName.trim().length > 0) {
      const name = form.ownerFullName.trim();
      if (name.length < 2) {
        errs.ownerFullName = "Owner name must be at least 2 characters.";
      } else if (name.length > 160) {
        errs.ownerFullName = "Owner name must not exceed 160 characters.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.planId) {
      errs.planId = "Please select a subscription plan.";
    } else {
      const activePlan = initialPlans.find((p) => p.id === form.planId && p.active);
      if (!activePlan) {
        errs.planId = "Selected subscription plan is not active or available.";
      }
    }

    if (!["monthly", "annual"].includes(form.billingCycle)) {
      errs.billingCycle = "Please select a valid billing cycle.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep5 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.timezone) {
      errs.timezone = "Timezone is required.";
    }

    if (!form.currency || form.currency.length !== 3) {
      errs.currency = "Please select a valid 3-letter currency code.";
    }

    if (!["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"].includes(form.dateFormat)) {
      errs.dateFormat = "Please select a supported date format.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      case 5:
        return validateStep5();
      case 6:
        return (
          validateStep1() &&
          validateStep2() &&
          validateStep3() &&
          validateStep4() &&
          validateStep5()
        );
      default:
        return true;
    }
  };

  const setSubmittingState = (val: boolean) => {
    setIsSubmitting(val);
    onSubmittingChange?.(val);
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentStep < 6) {
      setCurrentStep((prev) => ((prev + 1) as WizardStepId));
      scrollToTop();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => ((prev - 1) as WizardStepId));
      scrollToTop();
    }
  };

  const handleGoToStep = (stepId: WizardStepId) => {
    setCurrentStep(stepId);
    scrollToTop();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmissionError(null);

    // Validate all steps
    if (
      !validateStep1() ||
      !validateStep2() ||
      !validateStep3() ||
      !validateStep4() ||
      !validateStep5()
    ) {
      setSubmissionError("Please correct the validation errors in previous steps before submitting.");
      return;
    }

    setSubmittingState(true);

    try {
      // Normalize website
      let normalizedWebsite = form.website.trim();
      if (
        normalizedWebsite &&
        !normalizedWebsite.startsWith("http://") &&
        !normalizedWebsite.startsWith("https://")
      ) {
        normalizedWebsite = `https://${normalizedWebsite}`;
      }

      const payload = {
        name: form.name.trim(),
        legalName: form.legalName.trim() || undefined,
        slug: form.slug.trim().toLowerCase(),
        website: normalizedWebsite || undefined,

        contactEmail: form.contactEmail.trim().toLowerCase() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        addressLine1: form.addressLine1.trim() || undefined,
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,

        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        ownerFullName: form.ownerFullName.trim() || undefined,

        planId: form.planId,
        billingCycle: form.billingCycle,

        timezone: form.timezone,
        currency: form.currency.toUpperCase(),
        dateFormat: form.dateFormat,
      };

      const response = await fetch("/api/platform/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmissionError(
          body.error?.message ||
            body.message ||
            "Unable to create organization. Please verify your input and try again."
        );
        setSubmittingState(false);
        return;
      }

      // Success
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }

      const createdOrg = body.organization;
      setCreatedSuccess(createdOrg?.name || form.name);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(createdOrg || { id: "", name: form.name });
        } else {
          router.push(
            createdOrg?.id
              ? `/platform/organizations/${createdOrg.id}`
              : "/platform/organizations"
          );
        }
      }, 900);
    } catch {
      setSubmissionError(
        "A network or server error occurred while creating the organization. Please check your connection and try again."
      );
      setSubmittingState(false);
    }
  };

  if (isModal) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {/* Success Notification Alert */}
        {createdSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top duration-300"
          >
            <div className="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-950">Organization Created</p>
              <p className="text-xs text-slate-600">
                &ldquo;{createdSuccess}&rdquo; is pending Platform Owner approval.
              </p>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-bold tracking-tight text-slate-900">
                Create New Organization
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500">
                Multi-step setup wizard for tenant workspace registration, subscription configuration, and owner provisioning.
              </Dialog.Description>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || Boolean(createdSuccess)}
            aria-label="Close dialog"
            className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Main Content Area: Responsive Two-Pane Layout */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-white">
          {/* Mobile & Tablet Compact Progress Indicator */}
          <div className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-5 py-3 lg:hidden">
            <CompactStepProgress currentStep={currentStep} />
          </div>

          {/* Left Pane (Desktop): Vertical Stepper */}
          <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 border-r border-slate-200 bg-slate-50/70 p-6 overflow-y-auto [scrollbar-width:none]">
            <VerticalStepNav
              currentStep={currentStep}
              onStepClick={handleGoToStep}
              completedSteps={completedSteps}
            />
          </aside>

          {/* Right Pane: Scrollable Form Body */}
          <main
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto px-6 py-6 md:px-8 md:py-7 [scrollbar-width:thin]"
          >
            {currentStep === 1 && (
              <WizardStepOrganization
                form={form}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 2 && (
              <WizardStepContactAddress
                form={form}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 3 && (
              <WizardStepOwner
                form={form}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 4 && (
              <WizardStepPlan
                form={form}
                plans={initialPlans}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 5 && (
              <WizardStepRegional
                form={form}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 6 && (
              <WizardStepReview
                form={form}
                plans={initialPlans}
                onGoToStep={handleGoToStep}
                submissionError={submissionError}
              />
            )}
          </main>
        </div>

        {/* Modal Footer Controls */}
        <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-slate-50/90 px-6 py-4">
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting || Boolean(createdSuccess)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting || Boolean(createdSuccess)}
              className="gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="size-3.5" /> Back
            </Button>

            {currentStep < 6 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || Boolean(createdSuccess)}
                className="gap-1.5 text-xs font-semibold shadow-sm"
              >
                {getNextButtonLabel(currentStep)}
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || Boolean(createdSuccess)}
                className="gap-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating Pending Organization&hellip;
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Create Pending Organization
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Notification Modal */}
      {createdSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top duration-300"
        >
          <div className="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-emerald-950">Organization Created</p>
            <p className="text-xs text-slate-600">
              &ldquo;{createdSuccess}&rdquo; is pending Platform Owner approval. Redirecting&hellip;
            </p>
          </div>
        </div>
      )}

      {/* Wizard Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Create New Organization
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Multi-step setup wizard for tenant workspace registration, subscription configuration, and owner provisioning.
          </p>
        </div>

        <Link
          href="/platform/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 self-start sm:self-auto"
        >
          <ArrowLeft className="size-3.5" /> Back to Organizations
        </Link>
      </div>

      {/* Standalone Two-Pane Container */}
      <div className="flex flex-col lg:flex-row rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[640px]">
        {/* Mobile & Tablet Compact Progress Indicator */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/70 px-5 py-3 lg:hidden">
          <CompactStepProgress currentStep={currentStep} />
        </div>

        {/* Left Pane (Desktop): Vertical Stepper */}
        <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 border-r border-slate-200 bg-slate-50/70 p-6">
          <VerticalStepNav
            currentStep={currentStep}
            onStepClick={handleGoToStep}
            completedSteps={completedSteps}
          />
        </aside>

        {/* Right Pane: Form Body and Footer */}
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 p-6 md:p-8">
            {currentStep === 1 && (
              <WizardStepOrganization
                form={form}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 2 && (
              <WizardStepContactAddress
                form={form}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 3 && (
              <WizardStepOwner
                form={form}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 4 && (
              <WizardStepPlan
                form={form}
                plans={initialPlans}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 5 && (
              <WizardStepRegional
                form={form}
                errors={errors}
                onChange={updateForm}
              />
            )}

            {currentStep === 6 && (
              <WizardStepReview
                form={form}
                plans={initialPlans}
                onGoToStep={handleGoToStep}
                submissionError={submissionError}
              />
            )}
          </main>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4 md:px-8">
            <div>
              <Link
                href="/platform/organizations"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting || Boolean(createdSuccess)}
                className="gap-1.5 text-xs font-semibold"
              >
                <ArrowLeft className="size-3.5" /> Back
              </Button>

              {currentStep < 6 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || Boolean(createdSuccess)}
                  className="gap-1.5 text-xs font-semibold shadow-sm"
                >
                  {getNextButtonLabel(currentStep)}
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || Boolean(createdSuccess)}
                  className="gap-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating Pending Organization&hellip;
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Create Pending Organization
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
