import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { convertMessageToTask } from "@/modules/collaboration/service";
export async function POST(request: Request, context: { params: Promise<{ messageId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { messageId } = await context.params; return NextResponse.json({ success: true, ...(await convertMessageToTask({ organizationId: tenant.organization.id, userId: tenant.user.id, messageId, ...(await request.json()) })) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
