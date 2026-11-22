import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { reviewExtractionField } from "@/modules/resume-intelligence/service";
export async function POST(request: Request, context: { params: Promise<{ fieldId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = await request.json() as { status?: "reviewed" | "confirmed" | "rejected" }; if (!body.status) throw new AppError("VALIDATION_ERROR", "Review status is required.", 400); const { fieldId } = await context.params; return NextResponse.json({ success: true, field: await reviewExtractionField({ organizationId: tenant.organization.id, userId: tenant.user.id, fieldId, status: body.status }) }); } catch (error) { return errorResponse(error); } }
