import { redirect } from "next/navigation";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Immutable Governance
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {result.total === 1 ? "audit event" : "audit events"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Audit Trail
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tamper-evident governance ledger logging administrative changes, security actions, and tenant lifecycle events with sanitized metadata.
          </p>
        </div>
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
