import { AppError, errorResponse } from "@/lib/errors";
import { createTask, listTasks } from "@/modules/collaboration/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      const url = new URL(event.request.url);
      return { success: true, tasks: await listTasks({ organizationId: tenant.organization.id, userId: user.id, projectId: url.searchParams.get("projectId") ?? undefined, assigneeEmployeeId: url.searchParams.get("assigneeEmployeeId") ?? undefined, status: url.searchParams.get("status") ?? undefined, query: url.searchParams.get("q") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 50), offset: Number(url.searchParams.get("offset") ?? 0) }) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const data = await event.request.json();
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, task: await createTask({ organizationId: tenant.organization.id, userId: user.id, data }) };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
