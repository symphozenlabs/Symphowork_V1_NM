import { redirect } from "next/navigation";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { searchSupportOrganizations } from "@/modules/platform/support";
import { SupportOrganizationList } from "@/components/platform/support-organization-list";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    query?: string;
    page?: string;
  }>;
}) {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.supportView);
  } catch {
    redirect("/platform/login");
  }

  const params = await searchParams;
  const query = params.q ?? params.query ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const result = await searchSupportOrganizations({
    query: query || undefined,
    page,
    pageSize: 10,
  });

  const serializedRows = result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Support Operations
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {result.total === 1 ? "organization" : "organizations"} available
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Organization Support Console
          </h1>
          <p className="mt-1 text-sm text-muted">
            Read-only operational troubleshooting view. Support mode maintains strict tenant boundary isolation and never bypasses row-level employee privacy gates.
          </p>
        </div>
      </div>

      <SupportOrganizationList
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
