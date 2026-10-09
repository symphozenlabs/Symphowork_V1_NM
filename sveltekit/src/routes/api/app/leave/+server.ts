import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employees, leaveApplications, leaveBalances, leaveTypes } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { applyLeave } from "@/modules/leave/service";
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
      const [applications, balances] = await Promise.all([
        db.select({ application: leaveApplications, typeName: leaveTypes.name }).from(leaveApplications).leftJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id)).where(and(eq(leaveApplications.organizationId, tenant.organization.id), eq(leaveApplications.employeeId, employee.id))).orderBy(desc(leaveApplications.submittedAt)),
        db.select({ balance: leaveBalances, typeName: leaveTypes.name }).from(leaveBalances).leftJoin(leaveTypes, eq(leaveBalances.leaveTypeId, leaveTypes.id)).where(and(eq(leaveBalances.organizationId, tenant.organization.id), eq(leaveBalances.employeeId, employee.id), eq(leaveBalances.leaveYear, new Date().getFullYear())))
      ]);
      return { success: true, applications, balances };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { leaveTypeId?: string; startDate?: string; endDate?: string; halfDay?: boolean; reason?: string };
    if (!body.leaveTypeId || !body.startDate || !body.endDate || !body.reason) throw new AppError("VALIDATION_ERROR", "Leave type, dates, and reason are required.", 400);
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, application: await applyLeave({ organizationId: tenant.organization.id, userId: user.id, leaveTypeId: body.leaveTypeId!, startDate: body.startDate!, endDate: body.endDate!, halfDay: Boolean(body.halfDay), reason: body.reason! }) };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
