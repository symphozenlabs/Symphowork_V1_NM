import { redirect } from "next/navigation";
import { authorizePlatform, PLATFORM_PERMISSIONS, platformRoleLabel } from "@/modules/platform/authorization";
import { listPlatformUsers } from "@/modules/platform/operations";
import { PlatformUserList } from "@/components/platform/platform-user-list";

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    query?: string;
    page?: string;
  }>;
}) {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.userView);
  } catch {
    redirect("/platform/login");
  }

  const params = await searchParams;
  const query = params.q ?? params.query ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const result = await listPlatformUsers({
    query: query || undefined,
    page,
    pageSize: 10,
  });

  const serializedRows = result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    status: row.status,
    platformRole: row.platformRole,
    roleLabel: platformRoleLabel(row.platformRole),
    createdAt: row.createdAt.toLocaleDateString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Platform Identity
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {result.total === 1 ? "administrator" : "administrators"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Users & Roles
          </h1>
          <p className="mt-1 text-sm text-muted">
            Platform operator accounts and privileged authorization levels. Platform roles operate strictly outside organization tenant memberships.
          </p>
        </div>
      </div>

      <PlatformUserList
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
