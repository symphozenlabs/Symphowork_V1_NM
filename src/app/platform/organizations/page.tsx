import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listPlatformOrganizations } from "@/modules/platform/operations";
import { OrganizationListTable } from "@/components/platform/organization-list-table";
import { OrganizationCreateDialog } from "@/components/platform/organization-create-dialog";

export default async function OrganizationsPage() {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.organizationView);
  } catch {
    redirect("/platform/login");
  }

  const result = await listPlatformOrganizations({ pageSize: 50 });

  const serializedRows = result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    provisioningStatus: row.provisioningStatus,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Tenant Management
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {result.total === 1 ? "organization" : "organizations"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Organizations & Multi-Tenant Registry
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage tenant lifecycles, monitor onboarding stages, and inspect tenant health without entering tenant membership context.
          </p>
        </div>
        <div className="shrink-0">
          <OrganizationCreateDialog />
        </div>
      </div>

      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Registered Organizations
              </CardTitle>
              <p className="text-xs text-muted">
                Filter by status, search by name or subdomain slug, and review provisioning states
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <OrganizationListTable initialRows={serializedRows} />
        </CardContent>
      </Card>
    </div>
  );
}

