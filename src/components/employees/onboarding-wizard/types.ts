import type { SystemRole } from "@/modules/rbac/permissions";

export type OnboardingWizardStepId = 1 | 2 | 3 | 4 | 5;

export interface OnboardingWizardStepDefinition {
  id: OnboardingWizardStepId;
  title: string;
  shortTitle: string;
  description: string;
}

export const ONBOARDING_WIZARD_STEPS: OnboardingWizardStepDefinition[] = [
  {
    id: 1,
    title: "Select Role",
    shortTitle: "Role",
    description: "Choose the operational role to assign",
  },
  {
    id: 2,
    title: "Profile & Assignments",
    shortTitle: "Details",
    description: "Role-specific identity and employment details",
  },
  {
    id: 3,
    title: "Review & Confirm",
    shortTitle: "Review",
    description: "Verify profile data prior to registration",
  },
  {
    id: 4,
    title: "Profile Created",
    shortTitle: "Created",
    description: "Directory profile generation confirmed",
  },
  {
    id: 5,
    title: "Send Invitation",
    shortTitle: "Invitation",
    description: "Dispatch credential link & track status",
  },
];

export interface OnboardingWizardFormState {
  // Step 1
  targetRole: SystemRole;

  // Step 2 Core Identity
  firstName: string;
  middleName: string;
  lastName: string;
  personalEmail: string;
  workEmail: string;
  phone: string;

  // Step 2 Organizational Placements
  joiningDate: string;
  departmentId: string;
  designationId: string;
  teamId: string;
  locationId: string;
  shiftId: string;
  employmentTypeId: string;
  reportingManagerId: string;

  // Step 4 & 5 Persistence state
  createdEmployeeRecordId?: string; // UUID in employees table
  createdEmployeeCode?: string;     // e.g. EMP0004
  createdDisplayName?: string;
  invitationUrl?: string;
  invitationDelivery?: "sent" | "not_configured" | "failed";
  invitationStatus?: "pending" | "accepted" | "revoked" | "expired";
}

export interface MasterDataItem {
  id: string;
  name: string;
  code?: string;
}

export interface ManagerSummary {
  id: string;
  displayName: string;
  employeeId: string;
}
