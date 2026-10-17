"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAssignableRoles,
  type SystemRole,
} from "@/modules/rbac/permissions";
import {
  OnboardingVerticalStepNav,
  OnboardingCompactStepProgress,
} from "./onboarding-wizard-step-indicator";
import { Step1RoleSelection } from "./step-1-role-selection";
import { Step2RoleDetails } from "./step-2-role-details";
import { Step3ReviewConfirm } from "./step-3-review-confirm";
import { Step4ProfileCreated } from "./step-4-profile-created";
import { Step5InvitationStatus } from "./step-5-invitation-status";
import {
  ONBOARDING_WIZARD_STEPS,
  type OnboardingWizardStepId,
  type OnboardingWizardFormState,
} from "./types";

interface OnboardingWizardProps {
  currentUserRole?: string | null;
  organizationId?: string;
}

export function OnboardingWizard({
  currentUserRole,
}: OnboardingWizardProps) {
  const assignableRoles = getAssignableRoles(currentUserRole);
  const defaultRole: SystemRole = assignableRoles[0] || "EMPLOYEE";

  const [currentStep, setCurrentStep] = useState<OnboardingWizardStepId>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingWizardStepId>>(
    new Set()
  );

  const initialFormState: OnboardingWizardFormState = {
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
  };

  const [form, setForm] = useState<OnboardingWizardFormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

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

  // Step 2 Validation
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

    const isDeptRequired = [
      "MANAGER",
      "TEAM_LEAD",
      "PROJECT_MANAGER",
      "EMPLOYEE",
    ].includes(form.targetRole);

    if (isDeptRequired && !form.departmentId) {
      errors.departmentId = `Department assignment is required for ${form.targetRole} role.`;
    }

    if (form.teamId && !form.departmentId) {
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

  // Step 3 submission to POST /api/app/employees
  const handleSubmitProfile = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
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
        teamId: form.departmentId ? (form.teamId || undefined) : undefined,
        locationId: form.locationId || undefined,
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

  // Step 4 trigger to send invitation -> advances to Step 5
  const handleProceedToInvite = async () => {
    if (!form.createdEmployeeRecordId) {
      setCurrentStep(5);
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
        invitationDelivery: data.invitation?.delivery || "sent",
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

  // Step 5 resend invitation
  const handleResendInvite = async () => {
    if (!form.createdEmployeeRecordId) return;

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
        invitationDelivery: data.invitation?.delivery || "sent",
        invitationStatus: data.invitation?.status || "pending",
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to resend invitation.";
      setResendError(message);
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Reset wizard for another onboard
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

  const isRoleRestricted = assignableRoles.length === 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/app/employees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
      </div>

      {/* Mobile Step Indicator */}
      <div className="block lg:hidden rounded-2xl border border-border/80 bg-white p-4 shadow-xs">
        <OnboardingCompactStepProgress currentStep={currentStep} steps={ONBOARDING_WIZARD_STEPS} />
      </div>

      {/* Desktop Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Vertical Stepper */}
        <div className="hidden lg:block lg:col-span-4 rounded-2xl border border-border/80 bg-white p-5 shadow-xs sticky top-6">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Onboarding Stepper
            </span>
            <h3 className="text-sm font-bold text-foreground">5-Step User Enrollment</h3>
          </div>

          <OnboardingVerticalStepNav
            currentStep={currentStep}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
            steps={ONBOARDING_WIZARD_STEPS}
          />
        </div>

        {/* Right Column: Step Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs sm:p-8">
            {currentStep === 1 && (
              <Step1RoleSelection
                currentUserRole={currentUserRole}
                selectedRole={form.targetRole}
                onSelectRole={(role) => handleFormChange({ targetRole: role })}
              />
            )}

            {currentStep === 2 && (
              <Step2RoleDetails
                form={form}
                onChange={handleFormChange}
                errors={fieldErrors}
              />
            )}

            {currentStep === 3 && (
              <Step3ReviewConfirm
                form={form}
                onEditStep={(stepId) => setCurrentStep(stepId)}
                isSubmitting={isSubmitting}
                submissionError={submissionError}
                onSubmit={handleSubmitProfile}
              />
            )}

            {currentStep === 4 && (
              <Step4ProfileCreated
                form={form}
                onProceedToInvite={handleProceedToInvite}
                isSendingInvite={isSendingInvite}
              />
            )}

            {currentStep === 5 && (
              <Step5InvitationStatus
                form={form}
                onResendInvite={handleResendInvite}
                isResending={isSendingInvite}
                resendError={resendError}
                onResetWizard={handleResetWizard}
              />
            )}

            {/* Stepper Navigation Buttons (Step 1 & 2) */}
            {currentStep === 1 && !isRoleRestricted && (
              <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
                <Button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="gap-2 font-bold bg-primary text-white hover:bg-primary/90"
                >
                  <span>Next: Profile Details</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Role Selection</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="gap-2 font-bold bg-primary text-white hover:bg-primary/90"
                >
                  <span>Next: Review & Confirm</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="mt-6 flex items-center justify-start border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Edit Details</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
