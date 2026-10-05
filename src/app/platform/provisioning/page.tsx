import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
      <div>
        <Badge>Provisioning</Badge>
        <h1 className="mt-3 text-3xl font-bold">Provisioning operations</h1>
        <p className="mt-2 text-sm text-muted">
          Process organization setup, roles, subscription, and primary-admin invitation from one place.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provisioning jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <ProvisioningManager initialRows={serializedRows} />
        </CardContent>
      </Card>
    </div>
  );
}

