import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { processResumeJob, retryResumeJob } from "@/modules/resume-intelligence/service";
export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { jobId } = await context.params; const body = await request.json().catch(() => ({})) as { retry?: boolean }; if (body.retry) return NextResponse.json({ success: true, job: await retryResumeJob({ organizationId: tenant.organization.id, userId: tenant.user.id, jobId }) }); return NextResponse.json({ success: true, extraction: await processResumeJob({ organizationId: tenant.organization.id, userId: tenant.user.id, jobId }) }); } catch (error) { return errorResponse(error); } }
