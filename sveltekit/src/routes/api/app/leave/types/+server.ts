import { AppError, errorResponse } from "@/lib/errors";
import { listLeaveTypes } from "@/modules/leave/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, leaveTypes: await listLeaveTypes(tenant.organization.id) };
    }));
  } catch (cause) { return errorResponse(cause); }
};
