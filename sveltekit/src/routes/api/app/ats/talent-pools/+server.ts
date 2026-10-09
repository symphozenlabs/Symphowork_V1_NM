import { AppError, errorResponse } from "@/lib/errors";
import { createTalentPool } from "@/modules/ats/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => { try { const body = await event.request.json() as { name?: string; description?: string; ownerEmployeeId?: string }; if (!body.name) throw new AppError("VALIDATION_ERROR", "Pool name is required.", 400); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, pool: await createTalentPool({ organizationId: tenant.organization.id, userId: user.id, name: body.name!, description: body.description, ownerEmployeeId: body.ownerEmployeeId }) }; }), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
