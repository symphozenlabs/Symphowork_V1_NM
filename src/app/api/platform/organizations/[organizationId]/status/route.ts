import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { requireSession } from "@/modules/identity/auth";
export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) { try { const user = await requireSession(); if (user.platformRole !== "PLATFORM_OWNER") throw new AppError("FORBIDDEN", "Platform Owner access is required.", 403); const { organizationId } = await context.params; const body = (await request.json()) as { status?: "active" | "suspended" | "rejected" }; if (!body.status) throw new AppError("VALIDATION_ERROR", "A status is required.", 400); const [organization] = await db.update(organizations).set({ status: body.status, updatedAt: new Date() }).where(eq(organizations.id, organizationId)).returning(); if (!organization) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404); await recordAudit({ actorUserId: user.id, action: `organization_${body.status}`, resource: "organization", resourceId: organizationId }); return NextResponse.json({ success: true, organization }); } catch (error) { return errorResponse(error); } }
