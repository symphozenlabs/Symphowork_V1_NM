import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { finalizePayrollRun } from "@/modules/payroll/service";
export async function POST(_request: Request, context: { params: Promise<{ runId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { runId } = await context.params; return NextResponse.json({ success: true, run: await finalizePayrollRun({ organizationId: tenant.organization.id, userId: tenant.user.id, runId }) }); } catch (error) { return errorResponse(error); } }
