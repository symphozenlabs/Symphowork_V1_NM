import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { publishJob } from "@/modules/ats/service";
export async function POST(_request: Request, context: { params: Promise<{ jobId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { jobId } = await context.params; return NextResponse.json({ success: true, job: await publishJob({ organizationId: tenant.organization.id, userId: tenant.user.id, jobId }) }); } catch (error) { return errorResponse(error); } }
