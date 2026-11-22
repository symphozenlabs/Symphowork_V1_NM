import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { submitExpenseClaim } from "@/modules/expenses/service";
export async function POST(_request: Request, context: { params: Promise<{ claimId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { claimId } = await context.params; return NextResponse.json({ success: true, claim: await submitExpenseClaim({ organizationId: tenant.organization.id, userId: tenant.user.id, claimId }) }); } catch (error) { return errorResponse(error); } }
