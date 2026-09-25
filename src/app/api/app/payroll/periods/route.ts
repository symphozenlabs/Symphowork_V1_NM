import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { createPayrollPeriod } from "@/modules/payroll/service";
import { db } from "@/db/client";
import { payrollPeriods } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, periods: await db.select().from(payrollPeriods).where(eq(payrollPeriods.organizationId, tenant.organization.id)).orderBy(desc(payrollPeriods.year), desc(payrollPeriods.month)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = await request.json() as { month?: number; year?: number }; if (!body.month || !body.year) throw new AppError("VALIDATION_ERROR", "Month and year are required.", 400); return NextResponse.json({ success: true, period: await createPayrollPeriod({ organizationId: tenant.organization.id, userId: tenant.user.id, month: body.month, year: body.year }) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
