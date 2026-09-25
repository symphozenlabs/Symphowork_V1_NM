import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { createTalentPool } from "@/modules/ats/service";
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const body = await request.json() as { name?: string; description?: string; ownerEmployeeId?: string }; if (!body.name) throw new AppError("VALIDATION_ERROR", "Pool name is required.", 400); return NextResponse.json({ success: true, pool: await createTalentPool({ organizationId: tenant.organization.id, userId: tenant.user.id, name: body.name, description: body.description, ownerEmployeeId: body.ownerEmployeeId }) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
