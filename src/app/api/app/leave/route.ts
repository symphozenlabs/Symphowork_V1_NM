import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { employees, leaveApplications } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { applyLeave } from "@/modules/leave/service";

export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const [employee] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.organizationId, tenant.organization.id), eq(employees.userId, tenant.user.id))); if (!employee) throw new AppError("NOT_FOUND", "Your employee profile is not linked.", 404); return NextResponse.json({ success: true, applications: await db.select().from(leaveApplications).where(and(eq(leaveApplications.organizationId, tenant.organization.id), eq(leaveApplications.employeeId, employee.id))).orderBy(desc(leaveApplications.submittedAt)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = await request.json() as { leaveTypeId?: string; startDate?: string; endDate?: string; halfDay?: boolean; reason?: string }; if (!body.leaveTypeId || !body.startDate || !body.endDate || !body.reason) throw new AppError("VALIDATION_ERROR", "Leave type, dates, and reason are required.", 400); const application = await applyLeave({ organizationId: tenant.organization.id, userId: tenant.user.id, leaveTypeId: body.leaveTypeId, startDate: body.startDate, endDate: body.endDate, halfDay: Boolean(body.halfDay), reason: body.reason }); return NextResponse.json({ success: true, application }, { status: 201 }); } catch (error) { return errorResponse(error); } }
