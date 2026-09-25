import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { getCandidateResumeProfile } from "@/modules/resume-intelligence/service";
export async function GET(_request: Request, context: { params: Promise<{ candidateId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { candidateId } = await context.params; return NextResponse.json({ success: true, ...(await getCandidateResumeProfile({ organizationId: tenant.organization.id, userId: tenant.user.id, candidateId })) }); } catch (error) { return errorResponse(error); } }
