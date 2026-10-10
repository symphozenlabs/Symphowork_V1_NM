import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can } from "@/modules/tenancy/authorization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeInvitationActions } from "@/components/employees/employee-invitation-actions";
import { Users, UserPlus } from "lucide-react";

export default async function EmployeesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");

  const canInvite = await can({
    userId: user.id,
    organizationId: tenant.organization.id,
    permission: "employee.invite",
  });

  const rows = await db
    .select()
    .from(employees)
    .where(eq(employees.organizationId, tenant.organization.id))
    .orderBy(desc(employees.createdAt));

  const statusMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
    onboarding: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
    suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
    terminated: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  };

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
              {rows.length} {rows.length === 1 ? "record" : "records"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Workforce Directory
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage organization employee profiles, onboarding lifecycles, account invitations, and employment statuses.
          </p>
        </div>

        <div className="shrink-0">
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/app/employees/new">
              <UserPlus className="h-4 w-4" />
              <span>Create Employee</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Directory Table Card */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Active Employee Roster
          </CardTitle>
          <p className="text-xs text-muted">
            Employee directory with credential invitation states and joining timeline records
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
              <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No employee records yet</p>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                Begin by creating your organization’s first employee profile. Onboarding and invitation access can follow.
              </p>
              <div className="mt-4">
                <Button asChild size="sm">
                  <Link href="/app/employees/new">Create first employee</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 border-b border-border/70 text-xs font-semibold text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joining Date</th>
                    <th className="px-4 py-3">Account Invitation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rows.map((employee) => {
                    const theme = statusMap[employee.status] || statusMap.active;
                    const email = employee.workEmail ?? employee.personalEmail;

                    return (
                      <tr
                        key={employee.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                              {employee.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/app/employees/${employee.id}`}
                                className="block font-semibold text-foreground text-sm hover:text-primary transition-colors"
                              >
                                {employee.displayName}
                              </Link>
                              {email && (
                                <span className="text-xs text-muted font-mono">{email}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-slate-600">
                          {employee.employeeId}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${theme.bg} ${theme.text} ${theme.border}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                            {employee.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted">
                          {employee.joiningDate ?? "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {canInvite ? (
                            <EmployeeInvitationActions
                              employeeId={employee.id}
                              email={employee.personalEmail ?? employee.workEmail}
                              status={employee.status}
                            />
                          ) : (
                            <span className="text-xs text-muted">Restricted</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
