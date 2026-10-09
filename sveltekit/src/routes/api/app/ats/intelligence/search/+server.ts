import { AppError, errorResponse } from "@/lib/errors";
import { intelligentSearch } from "@/modules/recruiter-intelligence/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";
export const POST: RequestHandler = async (event) => { try { const body = await event.request.json() as { query?: string; limit?: number }; if (!body.query?.trim()) throw new AppError("VALIDATION_ERROR", "A recruiter search query is required.", 400); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, ...(await intelligentSearch({ organizationId: tenant.organization.id, userId: user.id, rawQuery: body.query!, limit: body.limit })) }; })); } catch (cause) { return errorResponse(cause); } };
