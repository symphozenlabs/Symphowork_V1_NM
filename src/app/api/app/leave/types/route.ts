import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { listLeaveTypes } from "@/modules/leave/service";

export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, leaveTypes: await listLeaveTypes(tenant.organization.id) }); } catch (error) { return errorResponse(error); } }
