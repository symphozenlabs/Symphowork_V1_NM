import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { updateEmployee } from "@/modules/employees/service";
import { employeeInputSchema } from "@/modules/employees/validation";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      const [employee] = await db.select().from(employees).where(and(eq(employees.id, event.params.employeeId), eq(employees.organizationId, tenant.organization.id)));
      if (!employee) throw new AppError("NOT_FOUND", "Employee was not found.", 404);
      return { success: true, employee };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const PATCH: RequestHandler = async (event) => {
  try {
    const changes = employeeInputSchema.partial().parse(await event.request.json());
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, employee: await updateEmployee(tenant.organization.id, user.id, event.params.employeeId, changes) };
    }));
  } catch (cause) { return errorResponse(cause); }
};
