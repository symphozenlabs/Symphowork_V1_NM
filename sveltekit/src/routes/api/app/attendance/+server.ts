import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { attendancePunches, attendanceRecords, employees } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      const [employee] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.organizationId, tenant.organization.id), eq(employees.userId, user.id)));
      if (!employee) throw new AppError("NOT_FOUND", "Your employee profile is not linked.", 404);
      const date = new URL(event.request.url).searchParams.get("date");
      const records = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.organizationId, tenant.organization.id), eq(attendanceRecords.employeeId, employee.id), ...(date ? [eq(attendanceRecords.attendanceDate, date)] : []))).orderBy(desc(attendanceRecords.attendanceDate)).limit(50);
      const punches = records[0] ? await db.select().from(attendancePunches).where(eq(attendancePunches.attendanceId, records[0].id)).orderBy(attendancePunches.punchedAt) : [];
      return { success: true, records, punches };
    }));
  } catch (cause) { return errorResponse(cause); }
};
