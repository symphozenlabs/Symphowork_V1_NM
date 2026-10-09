import { AppError, errorResponse } from "@/lib/errors";
import { addProjectMember, getProject, removeProjectMember, updateProject } from "@/modules/collaboration/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

async function withProject(event: Parameters<NonNullable<RequestHandler>>[0], callback: (user: Awaited<ReturnType<typeof import("$lib/server/request-context").requireSvelteUser>>, organizationId: string) => Promise<unknown>) {
  return withSvelteRequestUser(event, async (user) => {
    const tenant = await resolveTenantContextForUser(user);
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    return callback(user, tenant.organization.id);
  });
}

export const GET: RequestHandler = async (event) => {
  try { return Response.json(await withProject(event, (user, organizationId) => getProject({ organizationId, userId: user.id, projectId: event.params.projectId }).then((result) => ({ success: true, ...result })))); }
  catch (cause) { return errorResponse(cause); }
};

export const PATCH: RequestHandler = async (event) => {
  try { const data = await event.request.json(); return Response.json(await withProject(event, (user, organizationId) => updateProject({ organizationId, userId: user.id, projectId: event.params.projectId, data }).then((project) => ({ success: true, project })))); }
  catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { action?: "add_member" | "remove_member"; employeeId?: string; role?: "manager" | "member" | "viewer" };
    if (!body.employeeId || !body.action || !["add_member", "remove_member"].includes(body.action)) throw new AppError("VALIDATION_ERROR", "A supported member action and employee are required.", 400);
    return Response.json(await withProject(event, (user, organizationId) => (body.action === "add_member" ? addProjectMember({ organizationId, userId: user.id, projectId: event.params.projectId, employeeId: body.employeeId!, role: body.role }) : removeProjectMember({ organizationId, userId: user.id, projectId: event.params.projectId, employeeId: body.employeeId! })).then((member) => ({ success: true, member }))));
  } catch (cause) { return errorResponse(cause); }
};
