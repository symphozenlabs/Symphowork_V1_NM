import { AppError, errorResponse } from "@/lib/errors";
import { submitExpenseClaim } from "@/modules/expenses/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";
export const POST: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, claim: await submitExpenseClaim({ organizationId: tenant.organization.id, userId: user.id, claimId: event.params.claimId }) }; })); } catch (cause) { return errorResponse(cause); } };
