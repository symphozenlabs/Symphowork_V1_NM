import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employeeHistory, employees } from "@/db/schema";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can } from "@/modules/tenancy/authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeInvitationActions } from "@/components/employees/employee-invitation-actions";
import { OnboardingChecklist } from "@/components/employees/onboarding-checklist";
import {
  ArrowLeft,
  User,
  Briefcase,
  CheckSquare,
  History,
  ShieldCheck,
} from "lucide-react";

export default async function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");

  const { employeeId } = await params;
  const [employee] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.id, employeeId),
        eq(employees.organizationId, tenant.organization.id)
      )
    );

  if (!employee) notFound();

  const [canInvite, canOnboard] = await Promise.all([
    can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "employee.invite",
    }),
    can({
      userId: user.id,
      organizationId: tenant.organization.id,
      permission: "employee.onboard",
    }),
  ]);

  const history = await db
    .select()
    .from(employeeHistory)
    .where(
      and(
        eq(employeeHistory.employeeId, employee.id),
        eq(employeeHistory.organizationId, tenant.organization.id)
      )
    );

  const statusMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
    onboarding: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
    suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
    terminated: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  };

  const currentTheme = statusMap[employee.status] || statusMap.active;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          href="/app/employees"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Employee Directory</span>
        </Link>
      </div>

      {/* Executive Employee Header */}
      <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-md font-bold text-xl">
              {employee.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {employee.displayName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${currentTheme.dot}`} />
                  {employee.status.toUpperCase()}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600">
                  ID: {employee.employeeId}
                </span>
              </div>
              <p className="text-sm text-muted">
                {employee.workEmail ?? employee.personalEmail ?? "No email address registered"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canInvite && (
              <EmployeeInvitationActions
                employeeId={employee.id}
                email={employee.personalEmail ?? employee.workEmail}
                status={employee.status}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3 Detail Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal Details */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Personal Profile
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-muted">Full Name</span>
              <span className="font-medium text-foreground">
                {employee.firstName} {employee.lastName}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-muted">Phone Number</span>
              <span className="text-slate-800">{employee.phone ?? "Not provided"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-muted">Location / City</span>
              <span className="text-slate-800">{employee.city ?? "Not provided"}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted">Personal Email</span>
              <span className="text-slate-800 font-mono">{employee.personalEmail ?? "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Employment Status & Hierarchy */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Employment Terms
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-muted">Lifecycle Status</span>
              <span className="font-semibold text-foreground capitalize">{employee.status}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-muted">Joining Date</span>
              <span className="font-medium text-slate-800">{employee.joiningDate ?? "Not set"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-muted">Work Email</span>
              <span className="font-mono text-slate-800">{employee.workEmail ?? "—"}</span>
            </div>
            <div className="pt-1 text-[11px] text-muted leading-relaxed">
              Departments, designations, and shifts are assigned via Organization Settings.
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Checklist */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Onboarding Checklist
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {canOnboard ? (
              <OnboardingChecklist employeeId={employee.id} />
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
                <ShieldCheck className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-muted">
                  Onboarding workflow access is restricted to authorized people-operations roles.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee History & Audit Ledger */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold text-foreground">
              Employee Lifecycle History
            </CardTitle>
          </div>
          <span className="text-xs text-muted">{history.length} records</span>
        </CardHeader>
        <CardContent className="pt-4">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
              <p className="text-xs text-muted">No historical events recorded for this employee profile yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-50/50 p-3 text-xs transition-colors hover:bg-slate-50"
                >
                  <span className="font-semibold text-foreground font-mono">
                    {event.eventType}
                  </span>
                  <span className="text-muted">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
