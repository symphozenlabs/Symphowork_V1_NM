import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listPlatformAudit } from "@/modules/platform/operations";
import { PlatformAuditList } from "@/components/platform/platform-audit-list";

export default async function PlatformAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    query?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.auditView);
  } catch {
    redirect("/platform/login");
  }

  const params = await searchParams;
  const query = params.query ?? params.q ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const rawPageSize = Number(params.pageSize ?? "10");
  const pageSize = [10, 25, 50, 100].includes(rawPageSize) ? rawPageSize : 10;

  const result = await listPlatformAudit({
    query: query || undefined,
    page,
    pageSize,
  });

  const serializedRows = result.rows.map(({ audit, actor, organization }) => ({
    audit: {
      id: audit.id,
      action: audit.action,
      resource: audit.resource,
      organizationId: audit.organizationId,
      createdAt: audit.createdAt.toLocaleString(),
    },
    actor: {
      name: actor?.name ?? null,
    },
    organization: organization?.name ? { name: organization.name } : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Badge>Audit</Badge>
        <h1 className="mt-3 text-3xl font-bold">Platform activity</h1>
        <p className="mt-2 text-sm text-muted">Operational events with safe metadata only.</p>
      </div>

      <PlatformAuditList
        initialRows={serializedRows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        initialQuery={query}
      />
    </div>
  );
}
