import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { getResumeProcessingConfig, updateResumeProcessingConfig } from "@/modules/resume-intelligence/service";
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, config: await getResumeProcessingConfig(tenant.organization.id) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, config: await updateResumeProcessingConfig({ organizationId: tenant.organization.id, userId: tenant.user.id, data: await request.json() }) }); } catch (error) { return errorResponse(error); } }
