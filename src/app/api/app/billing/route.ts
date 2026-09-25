import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { changePlan, getBillingOverview } from "@/modules/billing/service";
export async function GET() { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, ...(await getBillingOverview({ organizationId: tenant.organization.id, userId: tenant.user.id })) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return NextResponse.json({ success: true, subscription: await changePlan({ organizationId: tenant.organization.id, userId: tenant.user.id, ...(await request.json()) }) }); } catch (error) { return errorResponse(error); } }
