import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { getOrEnsureEmployeeForUser } from "@/modules/employees/service";
import { recordPunch } from "@/modules/attendance/service";
import type { PunchType } from "@/modules/attendance/types";

const VALID_PUNCH_TYPES = new Set<PunchType>(["clock_in", "clock_out", "break_start", "break_end"]);

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      employeeId?: string;
    };

    if (!body.type) {
      throw new AppError("VALIDATION_ERROR", "A punch type is required.", 400);
    }

    if (!VALID_PUNCH_TYPES.has(body.type as PunchType)) {
      throw new AppError("VALIDATION_ERROR", `Invalid punch type: '${body.type}'.`, 400);
    }

    const callerEmployee = await getOrEnsureEmployeeForUser(tenant.organization.id, tenant.user.id);

    // If an employeeId is explicitly provided in the request body, validate tenant isolation and self-service punch constraint
    if (body.employeeId && body.employeeId !== callerEmployee.id && body.employeeId !== callerEmployee.employeeId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.employeeId);
      const matchCondition = isUuid
        ? or(eq(employees.id, body.employeeId), eq(employees.employeeId, body.employeeId))
        : eq(employees.employeeId, body.employeeId);

      const [targetEmp] = await db
        .select()
        .from(employees)
        .where(
          and(
            matchCondition,
            eq(employees.organizationId, tenant.organization.id)
          )
        );

      if (!targetEmp) {
        throw new AppError("NOT_FOUND", "Employee not found in this organization.", 404);
      }

      // Existing policy: Punches are self-service only.
      // HR audit mode and other users cannot punch on behalf of another employee unless explicitly allowed by existing policy.
      throw new AppError("FORBIDDEN", "You are not authorized to record attendance punches for other employees.", 403);
    }

    const record = await recordPunch({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      type: body.type as PunchType,
      employeeId: callerEmployee.id,
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    return errorResponse(error);
  }
}
