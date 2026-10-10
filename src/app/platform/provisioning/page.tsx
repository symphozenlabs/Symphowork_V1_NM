import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listProvisioningJobs } from "@/modules/platform/operations";
import { ProvisioningManager, ProvisioningRowData } from "@/components/platform/provisioning-manager";

export default async function ProvisioningPage() {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.provisioningView);
  } catch {
    redirect("/platform/login");
  }

  const rows = await listProvisioningJobs();

  const serializedRows: ProvisioningRowData[] = rows.map(({ job, organization }) => ({
    job: {
      id: job.id,
      organizationId: job.organizationId,
      jobType: job.jobType,
      status: job.status,
      currentStep: job.currentStep,
      attempts: job.attempts,
      startedAt: job.startedAt ? job.startedAt.toISOString() : null,
      completedAt: job.completedAt ? job.completedAt.toISOString() : null,
      failureMessage: job.failureMessage,
      createdAt: job.createdAt.toISOString(),
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      contactEmail: organization.contactEmail,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Orchestration Engine
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {rows.length} {rows.length === 1 ? "pipeline job" : "pipeline jobs"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tenant Provisioning Pipeline
          </h1>
          <p className="mt-1 text-sm text-muted">
            End-to-end multi-step orchestration pipeline: workspace isolation, database roles, plan subscriptions, and owner credential dispatch.
          </p>
        </div>
      </div>

      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Pipeline Orchestration Registry
          </CardTitle>
          <p className="text-xs text-muted">
            Inspect real-time stage progress, retry failed pipeline jobs, or re-dispatch owner invitations
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <ProvisioningManager initialRows={serializedRows} />
        </CardContent>
      </Card>
    </div>
  );
}

