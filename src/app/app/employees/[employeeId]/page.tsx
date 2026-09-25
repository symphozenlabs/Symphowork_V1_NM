import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employeeHistory, employees } from "@/db/schema";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { can } from "@/modules/tenancy/authorization";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeInvitationActions } from "@/components/employees/employee-invitation-actions";
import { OnboardingChecklist } from "@/components/employees/onboarding-checklist";

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");
  const { employeeId } = await params;
  const [employee] = await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.organizationId, tenant.organization.id)));
  if (!employee) notFound();
  const [canInvite, canOnboard] = await Promise.all([
    can({ userId: user.id, organizationId: tenant.organization.id, permission: "employee.invite" }),
    can({ userId: user.id, organizationId: tenant.organization.id, permission: "employee.onboard" }),
  ]);
  const history = await db.select().from(employeeHistory).where(and(eq(employeeHistory.employeeId, employee.id), eq(employeeHistory.organizationId, tenant.organization.id)));
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Badge>{employee.status}</Badge><h1 className="mt-3 text-3xl font-bold">{employee.displayName}</h1><p className="mt-2 text-sm text-muted">{employee.employeeId} · {employee.workEmail ?? employee.personalEmail ?? "No email"}</p></div><div className="flex items-center gap-4">{canInvite && <EmployeeInvitationActions employeeId={employee.id} email={employee.personalEmail ?? employee.workEmail} status={employee.status} />}<Link className="text-sm font-semibold text-primary" href="/app/employees">Back to employees</Link></div></div>
    <div className="grid gap-5 lg:grid-cols-3"><Card><CardHeader><CardTitle>Personal</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>{employee.firstName} {employee.lastName}</p><p className="text-muted">{employee.phone ?? "No phone"}</p><p className="text-muted">{employee.city ?? "No address"}</p></CardContent></Card><Card><CardHeader><CardTitle>Employment</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Status: <span className="font-semibold">{employee.status}</span></p><p>Joining date: <span className="font-semibold">{employee.joiningDate ?? "—"}</span></p><p className="text-muted">Assign department, designation, team, location, shift, and employment type from organization settings.</p></CardContent></Card><Card><CardHeader><CardTitle>Onboarding</CardTitle></CardHeader><CardContent>{canOnboard ? <OnboardingChecklist employeeId={employee.id} /> : <p className="text-sm text-muted">Onboarding access is restricted to authorized people-operations roles.</p>}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Employee history</CardTitle></CardHeader><CardContent>{history.length === 0 ? <p className="text-sm text-muted">No history events yet.</p> : <div className="space-y-3">{history.map((event) => <div key={event.id} className="rounded-xl border p-3"><p className="text-sm font-semibold">{event.eventType}</p><p className="mt-1 text-xs text-muted">{event.createdAt.toLocaleString()}</p></div>)}</div>}</CardContent></Card>
  </div>;
}
