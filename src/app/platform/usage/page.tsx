import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listOrganizationUsage, type PaginatedUsageResult } from "@/modules/platform/commercial";
import {
  UsageManagement,
  type SerializedUsageRow,
} from "@/components/platform/usage-management";

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{
    query?: string;
    q?: string;
    status?: string;
    plan?: string;
    page?: string;
  }>;
}) {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.usageView);
  } catch {
    redirect("/platform/login");
  }

  const params = await searchParams;
  const query = params.q ?? params.query ?? "";
  const status = params.status ?? "all";
  const plan = params.plan ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const result = (await listOrganizationUsage({
    query: query || undefined,
    status: status !== "all" ? status : undefined,
    plan: plan !== "all" ? plan : undefined,
    page,
    pageSize: 10,
  })) as PaginatedUsageResult;

  const serializedRows: SerializedUsageRow[] = result.rows.map((row) => ({
    organization: {
      id: row.organization.id,
      name: row.organization.name,
      slug: row.organization.slug,
    },
    plan: row.plan
      ? {
          id: row.plan.id,
          code: row.plan.code,
          name: row.plan.name,
          maxUsers: row.plan.maxUsers,
        }
      : null,
    activeEmployees: row.activeEmployees,
    employeeLimit: row.employeeLimit,
    remaining: row.remaining,
    overLimit: row.overLimit,
    nearLimit: row.nearLimit,
    limitReached: row.limitReached,
    status: row.status,
    statusLabel: row.statusLabel,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Badge>Licensing</Badge>
        <h1 className="mt-3 text-3xl font-bold">Usage & licensing</h1>
        <p className="mt-2 text-sm text-muted">
          Active employees are counted from the existing employee lifecycle model.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Employee capacity{" "}
            <span className="ml-2 text-sm font-normal text-muted">({result.total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsageManagement
            initialRows={serializedRows}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
            pageCount={result.pageCount}
            availablePlans={result.availablePlans}
            initialQuery={query}
            initialStatus={status}
            initialPlan={plan}
          />
        </CardContent>
      </Card>
    </div>
  );
}
