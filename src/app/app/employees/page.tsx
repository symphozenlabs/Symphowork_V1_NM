import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can } from "@/modules/tenancy/authorization";
import { listEmployees } from "@/modules/employees/service";
import { Button } from "@/components/ui/button";
import { WorkforceDirectoryTable } from "@/components/employees/workforce-directory-table";
import { UserPlus } from "lucide-react";

interface EmployeesPageProps {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");

  const canRead = await can({
    userId: user.id,
    organizationId: tenant.organization.id,
    permission: "employee.read",
    user,
  });

  if (!canRead) {
    redirect("/app/directory");
  }

  const canCreate = await can({
    userId: user.id,
    organizationId: tenant.organization.id,
    permission: "employee.create",
  });

  const canInvite = await can({
    userId: user.id,
    organizationId: tenant.organization.id,
    permission: "employee.invite",
  });

  const resolvedParams = searchParams ? await searchParams : {};
  const search = resolvedParams.search || undefined;
  const page = Number(resolvedParams.page || "1");
  const pageSize = Number(resolvedParams.pageSize || "25");

  const result = await listEmployees(tenant.organization.id, {
    search,
    page,
    pageSize,
  });

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              People Operations
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {result.total === 1 ? "record" : "records"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Workforce Directory
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage organization employee profiles, role authorizations, onboarding lifecycles, and invitation statuses.
          </p>
        </div>

        {canCreate && (
          <div className="shrink-0">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/app/employees/new">
                <UserPlus className="h-4 w-4" />
                <span>Onboard Employee</span>
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Interactive Directory Table with Search, Role, and Pagination */}
      <WorkforceDirectoryTable
        initialEmployees={result.rows}
        initialTotal={result.total}
        initialPage={result.page}
        initialPageSize={result.pageSize}
        canInvite={canInvite}
        currentUserId={user.id}
        currentUserRole={tenant.role?.key}
        isPlatformOwner={Boolean(user.platformRole && user.platformRole !== "NONE")}
      />
    </div>
  );
}
