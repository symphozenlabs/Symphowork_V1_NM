import { AppError, errorResponse } from "@/lib/errors";
import { addTaskComment, addTaskDependency, getTask, updateTask } from "@/modules/collaboration/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

async function withTask(event: Parameters<NonNullable<RequestHandler>>[0], callback: (user: Awaited<ReturnType<typeof import("$lib/server/request-context").requireSvelteUser>>, organizationId: string) => Promise<unknown>) {
  return withSvelteRequestUser(event, async (user) => {
    const tenant = await resolveTenantContextForUser(user);
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    return callback(user, tenant.organization.id);
  });
}

export const GET: RequestHandler = async (event) => {
  try { return Response.json(await withTask(event, (user, organizationId) => getTask({ organizationId, userId: user.id, taskId: event.params.taskId }).then((result) => ({ success: true, ...result })))); }
  catch (cause) { return errorResponse(cause); }
};

export const PATCH: RequestHandler = async (event) => {
  try { const data = await event.request.json(); return Response.json(await withTask(event, (user, organizationId) => updateTask({ organizationId, userId: user.id, taskId: event.params.taskId, data }).then((task) => ({ success: true, task })))); }
  catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { action?: string; content?: string; successorTaskId?: string };
    return Response.json(await withTask(event, async (user, organizationId) => {
      if (body.action === "dependency") {
        if (!body.successorTaskId) throw new AppError("VALIDATION_ERROR", "successorTaskId is required.", 400);
        return { success: true, dependency: await addTaskDependency({ organizationId, userId: user.id, predecessorTaskId: event.params.taskId, successorTaskId: body.successorTaskId }) };
      }
      if (body.action && body.action !== "comment") throw new AppError("VALIDATION_ERROR", "Unsupported task action.", 400);
      return { success: true, comment: await addTaskComment({ organizationId, userId: user.id, taskId: event.params.taskId, content: body.content ?? "" }) };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
