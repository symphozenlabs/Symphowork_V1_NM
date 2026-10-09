import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { payrollPeriods } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { createPayrollPeriod } from "@/modules/payroll/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, periods: await db.select().from(payrollPeriods).where(eq(payrollPeriods.organizationId, tenant.organization.id)).orderBy(desc(payrollPeriods.year), desc(payrollPeriods.month)) }; })); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const body = await event.request.json() as { month?: number; year?: number }; if (!body.month || !body.year) throw new AppError("VALIDATION_ERROR", "Month and year are required.", 400); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, period: await createPayrollPeriod({ organizationId: tenant.organization.id, userId: user.id, month: body.month!, year: body.year! }) }; }), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
