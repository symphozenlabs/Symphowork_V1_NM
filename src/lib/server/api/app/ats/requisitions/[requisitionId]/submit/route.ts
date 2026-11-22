import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { submitRequisition } from "@/modules/ats/service";
export async function POST(_request: Request, context: { params: Promise<{ requisitionId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { requisitionId } = await context.params; return NextResponse.json({ success: true, requisition: await submitRequisition({ organizationId: tenant.organization.id, userId: tenant.user.id, requisitionId }) }); } catch (error) { return errorResponse(error); } }
