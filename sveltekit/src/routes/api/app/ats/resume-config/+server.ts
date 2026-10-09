import { AppError, errorResponse } from "@/lib/errors";
import { getResumeProcessingConfig, updateResumeProcessingConfig } from "@/modules/resume-intelligence/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, config: await getResumeProcessingConfig(tenant.organization.id) }; })); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const data = await event.request.json(); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, config: await updateResumeProcessingConfig({ organizationId: tenant.organization.id, userId: user.id, data }) }; })); } catch (cause) { return errorResponse(cause); } };
