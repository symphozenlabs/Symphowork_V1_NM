import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
      <div>
        <Badge>Support operations</Badge>
        <h1 className="mt-3 text-3xl font-bold">Organization support view</h1>
        <p className="mt-2 text-sm text-muted">
          Operational context only. This does not grant tenant membership or unrestricted employee data access.
        </p>
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
