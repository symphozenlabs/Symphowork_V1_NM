import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { recordPunch } from "@/modules/attendance/service";
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = (await request.json()) as { type?: "clock_in" | "clock_out" | "break_start" | "break_end" }; if (!body.type) throw new AppError("VALIDATION_ERROR", "A punch type is required.", 400); const record = await recordPunch({ organizationId: tenant.organization.id, userId: tenant.user.id, type: body.type }); return NextResponse.json({ success: true, record }); } catch (error) { return errorResponse(error); } }
