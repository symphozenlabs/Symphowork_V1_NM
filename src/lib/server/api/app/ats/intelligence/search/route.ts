import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { intelligentSearch } from "@/modules/recruiter-intelligence/service";

export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); await authorize({ organizationId: tenant.organization.id, permission: "ats.candidate.view" }); const body = await request.json() as { query?: string; limit?: number }; if (!body.query?.trim()) throw new AppError("VALIDATION_ERROR", "A recruiter search query is required.", 400); return NextResponse.json({ success: true, ...(await intelligentSearch({ organizationId: tenant.organization.id, userId: tenant.user.id, rawQuery: body.query, limit: body.limit })) }); } catch (error) { return errorResponse(error); } }
