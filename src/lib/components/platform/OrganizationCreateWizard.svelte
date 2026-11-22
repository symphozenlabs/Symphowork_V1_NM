<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import CompactStepProgress from "$lib/components/platform/CompactStepProgress.svelte";
import VerticalStepNav from "$lib/components/platform/VerticalStepNav.svelte";
import WizardStepOrganization from "$lib/components/platform/WizardStepOrganization.svelte";
import WizardStepContactAddress from "$lib/components/platform/WizardStepContactAddress.svelte";
import WizardStepOwner from "$lib/components/platform/WizardStepOwner.svelte";
import WizardStepPlan from "$lib/components/platform/WizardStepPlan.svelte";
import WizardStepRegional from "$lib/components/platform/WizardStepRegional.svelte";
import WizardStepReview from "$lib/components/platform/WizardStepReview.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface OrganizationCreateWizardProps {
  initialPlans: PlanSummary[];
  isModal?: boolean;
  onSuccess?: (createdOrg: { id: string; name: string }) => void;
  onCancel?: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}
const DRAFT_STORAGE_KEY = "symphowork_create_org_draft_v1";
let {
  initialPlans,
  isModal = false,
  onSuccess,
  onCancel,
  onSubmittingChange,
}:OrganizationCreateWizardProps=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
let scrollContainerRef=$state({current:null as HTMLElement|null});
const defaultPlan=$derived(initialPlans.find((p) => p.active && p.code.toUpperCase() === "FREE") ||
    initialPlans.find((p) => p.active) ||
    initialPlans[0]);
const defaultState:OrganizationWizardFormState=$derived({
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
  });
let form=$state<OrganizationWizardFormState>(untrack(()=>(defaultState)));
const setForm=(next:typeof form|((previous:typeof form)=>typeof form))=>{form=typeof next==="function"?(next as (previous:typeof form)=>typeof form)(form):next;};
let currentStep=$state<WizardStepId>(untrack(()=>(1)));
const setCurrentStep=(next:typeof currentStep|((previous:typeof currentStep)=>typeof currentStep))=>{currentStep=typeof next==="function"?(next as (previous:typeof currentStep)=>typeof currentStep)(currentStep):next;};
let completedSteps=$state<Set<WizardStepId>>(untrack(()=>(new Set())));
const setCompletedSteps=(next:typeof completedSteps|((previous:typeof completedSteps)=>typeof completedSteps))=>{completedSteps=typeof next==="function"?(next as (previous:typeof completedSteps)=>typeof completedSteps)(completedSteps):next;};
let errors=$state<Record<string, string>>(untrack(()=>({})));
const setErrors=(next:typeof errors|((previous:typeof errors)=>typeof errors))=>{errors=typeof next==="function"?(next as (previous:typeof errors)=>typeof errors)(errors):next;};
let isSubmitting=$state(untrack(()=>(false)));
const setIsSubmitting=(next:typeof isSubmitting|((previous:typeof isSubmitting)=>typeof isSubmitting))=>{isSubmitting=typeof next==="function"?(next as (previous:typeof isSubmitting)=>typeof isSubmitting)(isSubmitting):next;};
let submissionError=$state<string | null>(untrack(()=>(null)));
const setSubmissionError=(next:typeof submissionError|((previous:typeof submissionError)=>typeof submissionError))=>{submissionError=typeof next==="function"?(next as (previous:typeof submissionError)=>typeof submissionError)(submissionError):next;};
let createdSuccess=$state<string | null>(untrack(()=>(null)));
const setCreatedSuccess=(next:typeof createdSuccess|((previous:typeof createdSuccess)=>typeof createdSuccess))=>{createdSuccess=typeof next==="function"?(next as (previous:typeof createdSuccess)=>typeof createdSuccess)(createdSuccess):next;};
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
$effect(()=>{initialPlans;return untrack(() => {
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
  });});
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

      if (!response.ok || body.success !== true || typeof body.organization?.id !== "string" || !body.organization.id) {
        const errorMsg =
          body.error?.message ||
          body.message ||
          "Unable to create organization. Please verify your input and try again.";
        setSubmissionError(errorMsg);
        showToast({
          type: "error",
          title: "Organization creation failed",
          message: errorMsg,
        });
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
      showToast({
        type: "success",
        title: "Organization created",
        message: `${createdOrg?.name || form.name} has been created; provisioning status is available on its detail page.`,
      });

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
      const netMsg =
        "A network or server error occurred while creating the organization. Please check your connection and try again.";
      setSubmissionError(netMsg);
      showToast({
        type: "error",
        title: "Connection error",
        message: netMsg,
      });
      setSubmittingState(false);
    }
  };


import type { PlanSummary, OrganizationWizardFormState, WizardStepId } from '$lib/components/platform/organization-wizard-types';</script>
{#if isModal}<div class="flex flex-col h-full overflow-hidden bg-white">
        
        {#if createdSuccess}<div role="status" aria-live="polite" class="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top duration-300">
            <div class="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              <SvgIcon name="CheckCircle2" class="size-5" />
            </div>
            <div>
              <p class="font-semibold text-emerald-950">Organization Created</p>
              <p class="text-xs text-slate-600">
                &ldquo;{createdSuccess}&rdquo; is pending Platform Owner approval.
              </p>
            </div>
          </div>{/if}

        
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SvgIcon name="Building2" class="size-5" />
            </div>
            <div>
              <h2 class="text-lg font-bold tracking-tight text-slate-900">
                Create New Organization
              </h2>
              <p class="text-xs text-slate-500">
                Multi-step setup wizard for tenant workspace registration, subscription configuration, and owner provisioning.
              </p>
            </div>
          </div>
          <button type="button" onclick={onCancel} disabled={isSubmitting || Boolean(createdSuccess)} aria-label="Close dialog" class="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none">
            <SvgIcon name="X" class="size-5" />
          </button>
        </div>

        
        <div class="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-white">
          
          <div class="shrink-0 border-b border-slate-200 bg-slate-50/70 px-5 py-3 lg:hidden">
            <CompactStepProgress currentStep={currentStep} />
          </div>

          
          <aside class="hidden lg:flex lg:flex-col w-72 shrink-0 border-r border-slate-200 bg-slate-50/70 p-6 overflow-y-auto [scrollbar-width:none]">
            <VerticalStepNav currentStep={currentStep} onStepClick={handleGoToStep} completedSteps={completedSteps} />
          </aside>

          
          <main bind:this={scrollContainerRef.current} class="flex-1 min-h-0 overflow-y-auto px-6 py-6 md:px-8 md:py-7 [scrollbar-width:thin]">
            {#if currentStep === 1}<WizardStepOrganization form={form} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 2}<WizardStepContactAddress form={form} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 3}<WizardStepOwner form={form} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 4}<WizardStepPlan form={form} plans={initialPlans} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 5}<WizardStepRegional form={form} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 6}<WizardStepReview form={form} plans={initialPlans} onGoToStep={handleGoToStep} submissionError={submissionError} />{/if}
          </main>
        </div>

        
        <div class="shrink-0 flex items-center justify-between border-t border-slate-200 bg-slate-50/90 px-6 py-4">
          <div>
            <Button type="button" variant="ghost" onclick={onCancel} disabled={isSubmitting || Boolean(createdSuccess)} class="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
              Cancel
            </Button>
          </div>

          <div class="flex items-center gap-3">
            <Button type="button" variant="secondary" onclick={handleBack} disabled={currentStep === 1 || isSubmitting || Boolean(createdSuccess)} class="gap-1.5 text-xs font-semibold">
              <SvgIcon name="ArrowLeft" class="size-3.5" /> Back
            </Button>

            {#if currentStep < 6}<Button type="button" onclick={handleNext} disabled={isSubmitting || Boolean(createdSuccess)} class="gap-1.5 text-xs font-semibold shadow-sm">
                {getNextButtonLabel(currentStep)}
                <SvgIcon name="ArrowRight" class="size-3.5" />
              </Button>{:else}<Button type="button" onclick={handleSubmit} disabled={isSubmitting || Boolean(createdSuccess)} class="gap-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm">
                {#if isSubmitting}
                    <SvgIcon name="Loader2" class="size-4 animate-spin" />
                    Creating Pending Organization&hellip;
                  {:else}
                    <SvgIcon name="CheckCircle2" class="size-4" />
                    Create Pending Organization
                  {/if}
              </Button>{/if}
          </div>
        </div>
      </div>{:else}<div class="space-y-6">
      
      {#if createdSuccess}<div role="status" aria-live="polite" class="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top duration-300">
          <div class="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            <SvgIcon name="CheckCircle2" class="size-5" />
          </div>
          <div>
            <p class="font-semibold text-emerald-950">Organization Created</p>
            <p class="text-xs text-slate-600">
              &ldquo;{createdSuccess}&rdquo; is pending Platform Owner approval. Redirecting&hellip;
            </p>
          </div>
        </div>{/if}

      
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <div class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SvgIcon name="Building2" class="size-5" />
            </div>
            <h1 class="text-xl font-bold tracking-tight text-slate-900">
              Create New Organization
            </h1>
          </div>
          <p class="mt-1 text-xs text-slate-600">
            Multi-step setup wizard for tenant workspace registration, subscription configuration, and owner provisioning.
          </p>
        </div>

        <a href="/platform/organizations" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 self-start sm:self-auto">
          <SvgIcon name="ArrowLeft" class="size-3.5" /> Back to Organizations
        </a>
      </div>

      
      <div class="flex flex-col lg:flex-row rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[640px]">
        
        <div class="shrink-0 border-b border-slate-200 bg-slate-50/70 px-5 py-3 lg:hidden">
          <CompactStepProgress currentStep={currentStep} />
        </div>

        
        <aside class="hidden lg:flex lg:flex-col w-72 shrink-0 border-r border-slate-200 bg-slate-50/70 p-6">
          <VerticalStepNav currentStep={currentStep} onStepClick={handleGoToStep} completedSteps={completedSteps} />
        </aside>

        
        <div class="flex flex-1 flex-col min-w-0">
          <main class="flex-1 p-6 md:p-8">
            {#if currentStep === 1}<WizardStepOrganization form={form} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 2}<WizardStepContactAddress form={form} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 3}<WizardStepOwner form={form} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 4}<WizardStepPlan form={form} plans={initialPlans} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 5}<WizardStepRegional form={form} errors={errors} onChange={updateForm} />{/if}

            {#if currentStep === 6}<WizardStepReview form={form} plans={initialPlans} onGoToStep={handleGoToStep} submissionError={submissionError} />{/if}
          </main>

          <div class="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4 md:px-8">
            <div>
              <a href="/platform/organizations" class="text-xs font-semibold text-slate-600 hover:text-slate-900">
                Cancel
              </a>
            </div>

            <div class="flex items-center gap-3">
              <Button type="button" variant="secondary" onclick={handleBack} disabled={currentStep === 1 || isSubmitting || Boolean(createdSuccess)} class="gap-1.5 text-xs font-semibold">
                <SvgIcon name="ArrowLeft" class="size-3.5" /> Back
              </Button>

              {#if currentStep < 6}<Button type="button" onclick={handleNext} disabled={isSubmitting || Boolean(createdSuccess)} class="gap-1.5 text-xs font-semibold shadow-sm">
                  {getNextButtonLabel(currentStep)}
                  <SvgIcon name="ArrowRight" class="size-3.5" />
                </Button>{:else}<Button type="button" onclick={handleSubmit} disabled={isSubmitting || Boolean(createdSuccess)} class="gap-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm">
                  {#if isSubmitting}
                      <SvgIcon name="Loader2" class="size-4 animate-spin" />
                      Creating Pending Organization&hellip;
                    {:else}
                      <SvgIcon name="CheckCircle2" class="size-4" />
                      Create Pending Organization
                    {/if}
                </Button>{/if}
            </div>
          </div>
        </div>
      </div>
    </div>{/if}
