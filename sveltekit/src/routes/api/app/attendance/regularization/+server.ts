import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { attendanceRegularizationRequests, employees } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { createRegularizationRequest } from "@/modules/attendance/regularization";
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
      return { success: true, requests: await db.select().from(attendanceRegularizationRequests).where(and(eq(attendanceRegularizationRequests.organizationId, tenant.organization.id), eq(attendanceRegularizationRequests.employeeId, employee.id))).orderBy(desc(attendanceRegularizationRequests.submittedAt)) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { attendanceId?: string; requestedIn?: string; requestedOut?: string; reason?: string };
    if (!body.attendanceId || !body.reason) throw new AppError("VALIDATION_ERROR", "Attendance record and reason are required.", 400);
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, request: await createRegularizationRequest({ organizationId: tenant.organization.id, userId: user.id, attendanceId: body.attendanceId!, requestedIn: body.requestedIn, requestedOut: body.requestedOut, reason: body.reason! }) };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
