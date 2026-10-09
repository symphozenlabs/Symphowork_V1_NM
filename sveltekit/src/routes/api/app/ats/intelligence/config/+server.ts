import { AppError, errorResponse } from "@/lib/errors";
import { getSemanticConfig, updateSemanticConfig } from "@/modules/recruiter-intelligence/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, config: await getSemanticConfig(tenant.organization.id) }; })); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const data = await event.request.json(); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, config: await updateSemanticConfig({ organizationId: tenant.organization.id, userId: user.id, data }) }; })); } catch (cause) { return errorResponse(cause); } };
