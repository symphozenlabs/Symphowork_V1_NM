import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex items-end justify-between">
        <div>
          <Badge>Organizations</Badge>
          <h1 className="mt-3 text-3xl font-bold">Tenant operations</h1>
          <p className="mt-2 text-sm text-muted">
            Inspect organization lifecycle without entering tenant membership context.
          </p>
        </div>
        <OrganizationCreateDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All organizations <span className="ml-2 text-sm font-normal text-muted">{result.total}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationListTable initialRows={serializedRows} />
        </CardContent>
      </Card>
    </div>
  );
}

