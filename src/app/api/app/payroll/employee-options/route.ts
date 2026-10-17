import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "payroll.view" });

    const rows = await db
      .select({
        id: employees.id,
        displayName: employees.displayName,
        employeeId: employees.employeeId,
      })
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, tenant.organization.id),
          inArray(employees.status, ["active", "probation", "confirmed", "notice_period"])
        )
      )
      .orderBy(asc(employees.displayName));

    return NextResponse.json({ success: true, employees: rows });
  } catch (error) {
    return errorResponse(error);
  }
}
