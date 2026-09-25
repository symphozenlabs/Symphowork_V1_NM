import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { listEmployeePayslips } from "@/modules/payroll/service";
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, payslips: await listEmployeePayslips({ organizationId: tenant.organization.id, userId: tenant.user.id }) }); } catch (error) { return errorResponse(error); } }
