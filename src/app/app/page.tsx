import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { approvalTasks, employees } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { AppError } from "@/lib/errors";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can, canAny } from "@/modules/tenancy/authorization";
import { APPROVAL_PERMISSIONS } from "@/modules/rbac/permissions";
import { unreadNotificationCount } from "@/modules/notifications/service";

export default async function WorkspacePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.platformRole && user.platformRole !== "NONE") {
    redirect("/platform");
  }

  let tenant;
  try {
    tenant = await resolveTenantContext();
  } catch (error) {
    if (error instanceof AppError && error.code === "ORG_ACCESS_DENIED") {
      redirect("/login");
    }

    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                Workspace Unavailable
              </span>
            </div>
            <CardTitle className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Organization Workspace is not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm leading-relaxed text-muted">
              Your organization workspace is currently not accessible. This may occur if the organization is pending activation, suspended, or undergoing administrative review.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Please contact your organization owner or platform support for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenant?.organization) {
    redirect("/platform");
  }

  const [canReadEmployees, canViewApprovals, canViewAts] = await Promise.all([
    can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "employee.read",
      user,
    }),
    canAny({
      userId: user.id,
      organizationId: tenant.organization.id,
      permissions: APPROVAL_PERMISSIONS,
      user,
    }),
    can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "ats.view",
      user,
    }),
  ]);

  // Load lightweight summary metrics concurrently on the server
  const [workforceCount, pendingApprovalsCount, unreadNotificationsCount] = await Promise.all([
    canReadEmployees
      ? db
          .select({ count: sql<number>`count(*)::int` })
          .from(employees)
          .where(eq(employees.organizationId, tenant.organization.id))
          .then(([r]) => Number(r?.count ?? 0))
          .catch(() => 0)
      : Promise.resolve(0),
    canViewApprovals
      ? db
          .select({ count: sql<number>`count(*)::int` })
          .from(approvalTasks)
          .where(
            and(
              eq(approvalTasks.organizationId, tenant.organization.id),
              eq(approvalTasks.approverUserId, user.id),
              eq(approvalTasks.status, "pending")
            )
          )
          .then(([r]) => Number(r?.count ?? 0))
          .catch(() => 0)
      : Promise.resolve(0),
    unreadNotificationCount(tenant.organization.id, user.id).catch(() => 0),
  ]);

  return (
    <Overview
      fullName={user.fullName}
      canReadEmployees={canReadEmployees}
      canViewApprovals={canViewApprovals}
      canViewAts={canViewAts}
      initialMetrics={{
        workforceCount,
        pendingApprovalsCount,
        unreadNotificationsCount,
      }}
    />
  );
}
