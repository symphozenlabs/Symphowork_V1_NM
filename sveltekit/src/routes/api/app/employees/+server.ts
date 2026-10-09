import { AppError, errorResponse } from "@/lib/errors";
import { employeeInputSchema } from "@/modules/employees/validation";
import { createEmployee, listEmployees } from "@/modules/employees/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const membership = await resolveTenantContextForUser(user);
      if (!membership.organization) return { success: true, rows: [], page: 1, pageSize: 25 };
      const url = new URL(event.request.url);
      return { success: true, ...(await listEmployees(membership.organization.id, { search: url.searchParams.get("search") ?? undefined, status: url.searchParams.get("status") ?? undefined, page: Number(url.searchParams.get("page") ?? "1"), pageSize: Number(url.searchParams.get("pageSize") ?? "25") })) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const input = employeeInputSchema.parse(await event.request.json());
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const { organization } = await resolveTenantContextForUser(user);
      if (!organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, ...(await createEmployee(organization.id, user.id, input)) };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
