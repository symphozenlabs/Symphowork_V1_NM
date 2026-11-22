<script lang="ts">
import{ROLE_METADATA,getAssignableRoles,type SystemRole}from'$lib/domain/rbac/permissions';import{ONBOARDING_WIZARD_STEPS,type OnboardingWizardStepId,type OnboardingWizardStepDefinition,type OnboardingWizardFormState,type MasterDataItem,type ManagerSummary}from'./types';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import OnboardingCompactStepProgress from "$lib/components/employees/onboarding/OnboardingCompactStepProgress.svelte";
import OnboardingVerticalStepNav from "$lib/components/employees/onboarding/OnboardingVerticalStepNav.svelte";
import Step1RoleSelection from "$lib/components/employees/onboarding/Step1RoleSelection.svelte";
import Step2RoleDetails from "$lib/components/employees/onboarding/Step2RoleDetails.svelte";
import Step3ReviewConfirm from "$lib/components/employees/onboarding/Step3ReviewConfirm.svelte";
import Step4ProfileCreated from "$lib/components/employees/onboarding/Step4ProfileCreated.svelte";
import Step5InvitationStatus from "$lib/components/employees/onboarding/Step5InvitationStatus.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface OnboardingWizardProps {
  currentUserRole?: string | null;
  organizationId?: string;
}
let {
  currentUserRole,
}:OnboardingWizardProps=$props();
const assignableRoles=$derived(getAssignableRoles(currentUserRole));
const defaultRole:SystemRole=$derived(assignableRoles[0] || "EMPLOYEE");
let currentStep=$state<OnboardingWizardStepId>(untrack(()=>(1)));
const setCurrentStep=(next:typeof currentStep|((previous:typeof currentStep)=>typeof currentStep))=>{currentStep=typeof next==="function"?(next as (previous:typeof currentStep)=>typeof currentStep)(currentStep):next;};
let completedSteps=$state<Set<OnboardingWizardStepId>>(untrack(()=>(new Set())));
const setCompletedSteps=(next:typeof completedSteps|((previous:typeof completedSteps)=>typeof completedSteps))=>{completedSteps=typeof next==="function"?(next as (previous:typeof completedSteps)=>typeof completedSteps)(completedSteps):next;};
const initialFormState:OnboardingWizardFormState=$derived({
    targetRole: defaultRole,
    firstName: "",
    middleName: "",
    lastName: "",
    personalEmail: "",
    workEmail: "",
    phone: "",
    joiningDate: "",
    departmentId: "",
    designationId: "",
    teamId: "",
    locationId: "",
    shiftId: "",
    employmentTypeId: "",
    reportingManagerId: "",
  });
let form=$state<OnboardingWizardFormState>(untrack(()=>(initialFormState)));
const setForm=(next:typeof form|((previous:typeof form)=>typeof form))=>{form=typeof next==="function"?(next as (previous:typeof form)=>typeof form)(form):next;};
let fieldErrors=$state<Record<string, string>>(untrack(()=>({})));
const setFieldErrors=(next:typeof fieldErrors|((previous:typeof fieldErrors)=>typeof fieldErrors))=>{fieldErrors=typeof next==="function"?(next as (previous:typeof fieldErrors)=>typeof fieldErrors)(fieldErrors):next;};
let isSubmitting=$state(untrack(()=>(false)));
const setIsSubmitting=(next:typeof isSubmitting|((previous:typeof isSubmitting)=>typeof isSubmitting))=>{isSubmitting=typeof next==="function"?(next as (previous:typeof isSubmitting)=>typeof isSubmitting)(isSubmitting):next;};
let submissionError=$state<string | null>(untrack(()=>(null)));
const setSubmissionError=(next:typeof submissionError|((previous:typeof submissionError)=>typeof submissionError))=>{submissionError=typeof next==="function"?(next as (previous:typeof submissionError)=>typeof submissionError)(submissionError):next;};
let isSendingInvite=$state(untrack(()=>(false)));
const setIsSendingInvite=(next:typeof isSendingInvite|((previous:typeof isSendingInvite)=>typeof isSendingInvite))=>{isSendingInvite=typeof next==="function"?(next as (previous:typeof isSendingInvite)=>typeof isSendingInvite)(isSendingInvite):next;};
let resendError=$state<string | null>(untrack(()=>(null)));
const setResendError=(next:typeof resendError|((previous:typeof resendError)=>typeof resendError))=>{resendError=typeof next==="function"?(next as (previous:typeof resendError)=>typeof resendError)(resendError):next;};
let departments=$state<MasterDataItem[]>(untrack(()=>([])));
const setDepartments=(next:typeof departments|((previous:typeof departments)=>typeof departments))=>{departments=typeof next==="function"?(next as (previous:typeof departments)=>typeof departments)(departments):next;};
let designations=$state<MasterDataItem[]>(untrack(()=>([])));
const setDesignations=(next:typeof designations|((previous:typeof designations)=>typeof designations))=>{designations=typeof next==="function"?(next as (previous:typeof designations)=>typeof designations)(designations):next;};
let locations=$state<MasterDataItem[]>(untrack(()=>([])));
const setLocations=(next:typeof locations|((previous:typeof locations)=>typeof locations))=>{locations=typeof next==="function"?(next as (previous:typeof locations)=>typeof locations)(locations):next;};
let shifts=$state<MasterDataItem[]>(untrack(()=>([])));
const setShifts=(next:typeof shifts|((previous:typeof shifts)=>typeof shifts))=>{shifts=typeof next==="function"?(next as (previous:typeof shifts)=>typeof shifts)(shifts):next;};
let employmentTypes=$state<MasterDataItem[]>(untrack(()=>([])));
const setEmploymentTypes=(next:typeof employmentTypes|((previous:typeof employmentTypes)=>typeof employmentTypes))=>{employmentTypes=typeof next==="function"?(next as (previous:typeof employmentTypes)=>typeof employmentTypes)(employmentTypes):next;};
let managers=$state<ManagerSummary[]>(untrack(()=>([])));
const setManagers=(next:typeof managers|((previous:typeof managers)=>typeof managers))=>{managers=typeof next==="function"?(next as (previous:typeof managers)=>typeof managers)(managers):next;};
let isLoadingMasterData=$state(untrack(()=>(false)));
const setIsLoadingMasterData=(next:typeof isLoadingMasterData|((previous:typeof isLoadingMasterData)=>typeof isLoadingMasterData))=>{isLoadingMasterData=typeof next==="function"?(next as (previous:typeof isLoadingMasterData)=>typeof isLoadingMasterData)(isLoadingMasterData):next;};
$effect(()=>{return untrack(() => {
    let isMounted = true;
    async function loadMasterData() {
      setIsLoadingMasterData(true);
      try {
        const [
          deptRes,
          desigRes,
          locRes,
          shiftRes,
          typeRes,
          empRes,
        ] = await Promise.allSettled([
          fetch("/api/app/master-data/departments").then((r) => r.json()),
          fetch("/api/app/master-data/designations").then((r) => r.json()),
          fetch("/api/app/master-data/locations").then((r) => r.json()),
          fetch("/api/app/master-data/shifts").then((r) => r.json()),
          fetch("/api/app/master-data/employment-types").then((r) => r.json()),
          fetch("/api/app/employees?pageSize=100").then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (deptRes.status === "fulfilled" && deptRes.value.items) {
          setDepartments(deptRes.value.items);
        }
        if (desigRes.status === "fulfilled" && desigRes.value.items) {
          setDesignations(desigRes.value.items);
        }
        if (locRes.status === "fulfilled" && locRes.value.items) {
          setLocations(locRes.value.items);
        }
        if (shiftRes.status === "fulfilled" && shiftRes.value.items) {
          setShifts(shiftRes.value.items);
        }
        if (typeRes.status === "fulfilled" && typeRes.value.items) {
          setEmploymentTypes(typeRes.value.items);
        }
        if (empRes.status === "fulfilled" && empRes.value.rows) {
          setManagers(
            empRes.value.rows.map((e: { id: string; displayName: string; employeeId: string }) => ({
              id: e.id,
              displayName: e.displayName,
              employeeId: e.employeeId,
            }))
          );
        }
      } catch {
        // Fall back gracefully
      } finally {
        if (isMounted) setIsLoadingMasterData(false);
      }
    }

    void loadMasterData();
    return () => {
      isMounted = false;
    };
  });});
const handleFormChange = (patch: Partial<OnboardingWizardFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Clear relevant errors
    if (Object.keys(fieldErrors).length > 0) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        Object.keys(patch).forEach((key) => delete next[key]);
        return next;
      });
    }
  };
const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }
    if (!form.personalEmail.trim()) {
      errors.personalEmail = "Personal email is required for invitation delivery.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personalEmail.trim())) {
      errors.personalEmail = "Please enter a valid email address.";
    }

    if (form.workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail.trim())) {
      errors.workEmail = "Please enter a valid work email address.";
    }

    const isHrRole = form.targetRole === "HR_ADMIN" || form.targetRole === "HR_EXECUTIVE";
    const isDeptRequired =
      isHrRole ||
      [
        "MANAGER",
        "TEAM_LEAD",
        "PROJECT_MANAGER",
        "EMPLOYEE",
      ].includes(form.targetRole);

    if (isDeptRequired && !form.departmentId) {
      errors.departmentId = isHrRole
        ? "HR department assignment is required for HR roles."
        : `Department assignment is required for ${form.targetRole} role.`;
    }

    if (!isHrRole && form.teamId && !form.departmentId) {
      errors.teamId = "A department must be selected before assigning a team.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
const handleNextFromStep1 = () => {
    if (assignableRoles.length === 0) return;
    setCompletedSteps((prev) => new Set([...prev, 1]));
    setCurrentStep(2);
  };
const handleNextFromStep2 = () => {
    if (!validateStep2()) return;
    setCompletedSteps((prev) => new Set([...prev, 2]));
    setCurrentStep(3);
  };
const handleSubmitProfile = async () => {
    if (isSubmitting || form.createdEmployeeRecordId) return;
    if (!assignableRoles.includes(form.targetRole) || !validateStep2()) {
      setSubmissionError("Select an authorized role and complete the required profile fields.");
      return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const isHrRole = form.targetRole === "HR_ADMIN" || form.targetRole === "HR_EXECUTIVE";
      const payload = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        personalEmail: form.personalEmail.trim().toLowerCase(),
        workEmail: form.workEmail.trim().toLowerCase() || undefined,
        phone: form.phone.trim() || undefined,
        joiningDate: form.joiningDate || undefined,
        departmentId: form.departmentId || undefined,
        designationId: form.designationId || undefined,
        teamId: isHrRole ? undefined : (form.departmentId ? (form.teamId || undefined) : undefined),
        locationId: isHrRole ? undefined : (form.locationId || undefined),
        shiftId: form.shiftId || undefined,
        employmentTypeId: form.employmentTypeId || undefined,
        reportingManagerId: form.reportingManagerId || undefined,
        targetRole: form.targetRole,
      };

      const res = await fetch("/api/app/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create employee profile.");
      }

      setForm((prev) => ({
        ...prev,
        createdEmployeeRecordId: data.employee?.id,
        createdEmployeeCode: data.employee?.employeeId,
        createdDisplayName: `${data.employee?.firstName || ""} ${data.employee?.lastName || ""}`.trim(),
      }));

      setCompletedSteps((prev) => new Set([...prev, 1, 2, 3]));
      setCurrentStep(4);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create employee profile.";
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
const handleProceedToInvite = async () => {
    if (isSendingInvite) return;
    if (!form.createdEmployeeRecordId) {
      setResendError("Create the employee profile before sending an invitation.");
      return;
    }

    setIsSendingInvite(true);
    setResendError(null);

    try {
      const res = await fetch(
        `/api/app/employees/${encodeURIComponent(form.createdEmployeeRecordId)}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleKey: form.targetRole }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to dispatch invitation.");
      }

      setForm((prev) => ({
        ...prev,
        invitationUrl: data.invitationUrl,
        invitationDelivery: data.invitation?.delivery || "failed",
        invitationStatus: data.invitation?.status || "pending",
      }));

      setCompletedSteps((prev) => new Set([...prev, 4]));
      setCurrentStep(5);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to dispatch invitation.";
      setResendError(message);
      // Still show Step 5 with failed status so user can see manual links / retry
      setForm((prev) => ({
        ...prev,
        invitationDelivery: "failed",
      }));
      setCompletedSteps((prev) => new Set([...prev, 4]));
      setCurrentStep(5);
    } finally {
      setIsSendingInvite(false);
    }
  };
const handleResendInvite = async () => {
    if (isSendingInvite || !form.createdEmployeeRecordId) return;

    setIsSendingInvite(true);
    setResendError(null);

    try {
      const res = await fetch(
        `/api/app/employees/${encodeURIComponent(form.createdEmployeeRecordId)}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleKey: form.targetRole, resend: true }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to resend invitation.");
      }

      setForm((prev) => ({
        ...prev,
        invitationUrl: data.invitationUrl || prev.invitationUrl,
        invitationDelivery: data.invitation?.delivery || "failed",
        invitationStatus: data.invitation?.status || "pending",
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend invitation.";
      setResendError(message);
    } finally {
      setIsSendingInvite(false);
    }
  };
const handleResetWizard = () => {
    setForm({
      ...initialFormState,
      targetRole: assignableRoles[0] || "EMPLOYEE",
    });
    setFieldErrors({});
    setSubmissionError(null);
    setResendError(null);
    setCompletedSteps(new Set());
    setCurrentStep(1);
  };
const handleStepClick = (stepId: OnboardingWizardStepId) => {
    // Only allow navigating backwards between steps 1, 2, 3 before submission
    if (currentStep >= 4) return;
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    } else if (stepId === 2 && currentStep === 1) {
      handleNextFromStep1();
    } else if (stepId === 3 && currentStep === 2) {
      handleNextFromStep2();
    }
  };
const isRoleRestricted=$derived(assignableRoles.length === 0);
</script>
<div class="space-y-6">
      
      <div>
        <a href="/app/employees" class="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground">
          <SvgIcon name="ArrowLeft" class="size-3.5" />
          <span>Back to Employee Directory</span>
        </a>
      </div>

      
      <div class="block lg:hidden rounded-2xl border border-border/80 bg-white p-4 shadow-xs">
        <OnboardingCompactStepProgress currentStep={currentStep} steps={ONBOARDING_WIZARD_STEPS} />
      </div>

      
      <div class="grid gap-6 lg:grid-cols-12 items-start">
        
        <div class="hidden lg:block lg:col-span-4 rounded-2xl border border-border/80 bg-white p-5 shadow-xs sticky top-6">
          <div class="mb-4 pb-3 border-b border-slate-100">
            <span class="text-[11px] font-bold uppercase tracking-wider text-muted">
              Onboarding Stepper
            </span>
            <h3 class="text-sm font-bold text-foreground">5-Step User Enrollment</h3>
          </div>

          <OnboardingVerticalStepNav currentStep={currentStep} onStepClick={handleStepClick} completedSteps={completedSteps} steps={ONBOARDING_WIZARD_STEPS} />
        </div>

        
        <div class="lg:col-span-8 space-y-6">
          <div class="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs sm:p-8">
            {#if currentStep === 1}<Step1RoleSelection currentUserRole={currentUserRole} selectedRole={form.targetRole} onSelectRole={(role) => handleFormChange({ targetRole: role })} />{/if}

            {#if currentStep === 2}<Step2RoleDetails form={form} onChange={handleFormChange} errors={fieldErrors} departments={departments} designations={designations} locations={locations} shifts={shifts} employmentTypes={employmentTypes} managers={managers} isLoadingMasterData={isLoadingMasterData} />{/if}

            {#if currentStep === 3}<Step3ReviewConfirm form={form} onEditStep={(stepId) => setCurrentStep(stepId)} isSubmitting={isSubmitting} submissionError={submissionError} onSubmit={handleSubmitProfile} departments={departments} designations={designations} locations={locations} shifts={shifts} employmentTypes={employmentTypes} managers={managers} />{/if}

            {#if currentStep === 4}<Step4ProfileCreated form={form} onProceedToInvite={handleProceedToInvite} isSendingInvite={isSendingInvite} />{/if}

            {#if currentStep === 5}<Step5InvitationStatus form={form} onResendInvite={handleResendInvite} isResending={isSendingInvite} resendError={resendError} onResetWizard={handleResetWizard} />{/if}

            
            {#if currentStep === 1 && !isRoleRestricted}<div class="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
                <Button type="button" onclick={handleNextFromStep1} class="gap-2 font-bold bg-primary text-white hover:bg-primary/90">
                  <span>Next: Profile Details</span>
                  <SvgIcon name="ArrowRight" class="size-4" />
                </Button>
              </div>{/if}

            {#if currentStep === 2}<div class="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                <Button type="button" variant="outline" onclick={() => setCurrentStep(1)} class="gap-1.5 text-xs font-semibold">
                  <SvgIcon name="ArrowLeft" class="size-3.5" />
                  <span>Back to Role Selection</span>
                </Button>

                <Button type="button" onclick={handleNextFromStep2} class="gap-2 font-bold bg-primary text-white hover:bg-primary/90">
                  <span>Next: Review & Confirm</span>
                  <SvgIcon name="ArrowRight" class="size-4" />
                </Button>
              </div>{/if}

            {#if currentStep === 3}<div class="mt-6 flex items-center justify-start border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onclick={() => setCurrentStep(2)} disabled={isSubmitting} class="gap-1.5 text-xs font-semibold">
                  <SvgIcon name="ArrowLeft" class="size-3.5" />
                  <span>Back to Edit Details</span>
                </Button>
              </div>{/if}
          </div>
        </div>
      </div>
    </div>
