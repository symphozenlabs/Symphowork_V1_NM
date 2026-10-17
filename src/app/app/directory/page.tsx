import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { departments, designations, employees } from "@/db/schema";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { CompanyDirectoryView } from "@/components/employees/company-directory-view";
import { Users } from "lucide-react";

export default async function CompanyDirectoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tenant = await resolveTenantContext();
  if (!tenant.organization) redirect("/platform");

  const activeStatuses = ["active", "probation", "confirmed"];
  const rows = await db
    .select({
      id: employees.id,
      displayName: employees.displayName,
      firstName: employees.firstName,
      lastName: employees.lastName,
      workEmail: employees.workEmail,
      departmentName: departments.name,
      designationTitle: designations.name,
    })
    .from(employees)
    .leftJoin(
      departments,
      and(eq(employees.departmentId, departments.id), eq(departments.organizationId, tenant.organization.id))
    )
    .leftJoin(
      designations,
      and(eq(employees.designationId, designations.id), eq(designations.organizationId, tenant.organization.id))
    )
    .where(
      and(
        eq(employees.organizationId, tenant.organization.id),
        inArray(employees.status, activeStatuses as never)
      )
    )
    .orderBy(asc(employees.displayName));

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Users className="h-3 w-3" />
              Company Directory
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {rows.length} {rows.length === 1 ? "colleague" : "colleagues"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Coworkers & Organization Directory
          </h1>
          <p className="mt-1 text-sm text-muted">
            Find colleagues, departments, designations, and corporate email addresses across {tenant.organization.name}.
          </p>
        </div>
      </div>

      <CompanyDirectoryView initialEmployees={rows} />
    </div>
  );
}
