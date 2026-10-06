import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { attendancePunches, attendanceRecords } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { getOrEnsureEmployeeForUser } from "@/modules/employees/service";
export async function GET(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); await authorize({ organizationId: tenant.organization.id, permission: "attendance.read" }); const employee = await getOrEnsureEmployeeForUser(tenant.organization.id, tenant.user.id); const date = new URL(request.url).searchParams.get("date"); const records = await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.organizationId, tenant.organization.id), eq(attendanceRecords.employeeId, employee.id), ...(date ? [eq(attendanceRecords.attendanceDate, date)] : []))).orderBy(desc(attendanceRecords.attendanceDate)).limit(50); const punches = records[0] ? await db.select().from(attendancePunches).where(eq(attendancePunches.attendanceId, records[0].id)).orderBy(attendancePunches.punchedAt) : []; return NextResponse.json({ success: true, records, punches }); } catch (error) { return errorResponse(error); } }
