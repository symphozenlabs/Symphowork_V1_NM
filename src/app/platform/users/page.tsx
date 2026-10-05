import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
      <div>
        <Badge>Platform identity</Badge>
        <h1 className="mt-3 text-3xl font-bold">Platform users</h1>
        <p className="mt-2 text-sm text-muted">
          Platform roles are separate from organization memberships.
        </p>
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
