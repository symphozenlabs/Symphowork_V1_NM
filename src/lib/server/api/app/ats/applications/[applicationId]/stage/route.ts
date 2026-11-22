import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { moveApplication } from "@/modules/ats/service";
export async function POST(request: Request, context: { params: Promise<{ applicationId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = await request.json() as { stageId?: string; reason?: string }; if (!body.stageId) throw new AppError("VALIDATION_ERROR", "Stage is required.", 400); const { applicationId } = await context.params; return NextResponse.json({ success: true, application: await moveApplication({ organizationId: tenant.organization.id, userId: tenant.user.id, applicationId, stageId: body.stageId, reason: body.reason }) }); } catch (error) { return errorResponse(error); } }
