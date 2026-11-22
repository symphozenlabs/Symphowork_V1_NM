import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { markNotificationRead } from "@/modules/notifications/service";

export async function POST(_request: Request, context: { params: Promise<{ notificationId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { notificationId } = await context.params; return NextResponse.json({ success: true, notification: await markNotificationRead(tenant.organization.id, tenant.user.id, notificationId) }); } catch (error) { return errorResponse(error); } }
