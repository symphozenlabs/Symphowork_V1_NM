export interface ProvisioningJobData {
  id: string;
  organizationId: string;
  organizationName: string;
  status: string;
  currentStep: string;
  attempts: number;
  startedAt?: string | null;
  completedAt?: string | null;
  failureMessage?: string | null;
}
