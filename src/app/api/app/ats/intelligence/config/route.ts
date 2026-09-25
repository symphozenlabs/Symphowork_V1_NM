import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { getSemanticConfig, updateSemanticConfig } from "@/modules/recruiter-intelligence/service";

export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, config: await getSemanticConfig(tenant.organization.id) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, config: await updateSemanticConfig({ organizationId: tenant.organization.id, userId: tenant.user.id, data: await request.json() }) }); } catch (error) { return errorResponse(error); } }
