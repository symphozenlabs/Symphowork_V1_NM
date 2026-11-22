import { NextResponse } from "next/server";
import { and, asc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import { departments, designations, employees } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);

    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim();

    const activeStatuses = ["active", "probation", "confirmed"];
    const baseConditions = [
      eq(employees.organizationId, tenant.organization.id),
      inArray(employees.status, activeStatuses as never),
    ];

    if (query) {
      const searchPattern = `%${query}%`;
      baseConditions.push(
        or(
          ilike(employees.displayName, searchPattern),
          ilike(employees.workEmail, searchPattern),
          ilike(departments.name, searchPattern),
          ilike(designations.name, searchPattern)
        )!
      );
    }

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
      .where(and(...baseConditions))
      .orderBy(asc(employees.displayName));

    return NextResponse.json({ success: true, employees: rows });
  } catch (error) {
    return errorResponse(error);
  }
}
