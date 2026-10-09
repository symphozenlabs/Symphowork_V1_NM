import { AppError, errorResponse } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { findOrCreateCandidate, searchCandidates } from "@/modules/ats/service";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const url = new URL(event.request.url); return { success: true, candidates: await searchCandidates({ organizationId: tenant.organization.id, userId: user.id, query: url.searchParams.get("q") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 50), offset: Number(url.searchParams.get("offset") ?? 0) }) }; })); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const data = await event.request.json(); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); await authorize({ organizationId: tenant.organization.id, permission: "ats.candidate.create" }); return { success: true, ...(await findOrCreateCandidate({ organizationId: tenant.organization.id, userId: user.id, data })) }; }), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
