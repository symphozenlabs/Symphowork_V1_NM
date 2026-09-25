import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { createConversation } from "@/modules/collaboration/service";
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, conversation: await createConversation({ organizationId: tenant.organization.id, userId: tenant.user.id, ...(await request.json()) }) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
