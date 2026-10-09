import { AppError, errorResponse } from "@/lib/errors";
import { calculatePayrollRun, listPayrollRuns } from "@/modules/payroll/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, runs: await listPayrollRuns({ organizationId: tenant.organization.id, userId: user.id }) }; })); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const body = await event.request.json() as { periodId?: string }; if (!body.periodId) throw new AppError("VALIDATION_ERROR", "Period is required.", 400); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, run: await calculatePayrollRun({ organizationId: tenant.organization.id, userId: user.id, periodId: body.periodId! }) }; }), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
