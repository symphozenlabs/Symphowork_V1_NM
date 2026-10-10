import { redirect } from "next/navigation";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Workforce Licensing
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {result.total === 1 ? "organization" : "organizations"} monitored
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Usage & Seat Allocation
          </h1>
          <p className="mt-1 text-sm text-muted">
            Live tenant workforce telemetry compared against contractual plan employee limits. Active employees derive strictly from the core workforce model.
          </p>
        </div>
      </div>

      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Tenant Capacity Registry
          </CardTitle>
          <p className="text-xs text-muted">
            Track seat utilization ratios, identify over-limit tenants, and review licensing headroom
          </p>
        </CardHeader>
        <CardContent className="pt-6">
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
