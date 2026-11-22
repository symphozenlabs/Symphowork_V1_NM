import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { listNotificationPreferences, updateNotificationPreference } from "@/modules/notifications/service";

export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, preferences: await listNotificationPreferences(tenant.organization.id, tenant.user.id) }); } catch (error) { return errorResponse(error); } }

export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = await request.json() as { category?: "attendance" | "leave" | "expense" | "documents" | "onboarding" | "approvals" | "system"; inAppEnabled?: boolean; emailEnabled?: boolean }; if (!body.category) throw new AppError("VALIDATION_ERROR", "Notification category is required.", 400); return NextResponse.json({ success: true, preference: await updateNotificationPreference({ organizationId: tenant.organization.id, userId: tenant.user.id, category: body.category, inAppEnabled: body.inAppEnabled, emailEnabled: body.emailEnabled }) }); } catch (error) { return errorResponse(error); } }
