import { sql } from "drizzle-orm";
import { AppError, errorResponse } from "@/lib/errors";
import { db } from "@/db/client";
import { authorize } from "@/modules/tenancy/authorization";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

const definitions = {
  departments: { table: "departments", permission: "department.update", fields: ["name", "code", "description", "status"] },
  designations: { table: "designations", permission: "designation.update", fields: ["name", "code", "description", "level", "status"] },
  locations: { table: "locations", permission: "location.update", fields: ["name", "code", "address_line_1", "address_line_2", "city", "state", "country", "postal_code", "timezone", "status"] },
  teams: { table: "teams", permission: "team.update", fields: ["name", "code", "description", "department_id", "status"] },
  shifts: { table: "shifts", permission: "organization.settings.update", fields: ["name", "code", "start_time", "end_time", "break_minutes", "grace_minutes", "overnight", "status"] },
  holidays: { table: "holidays", permission: "organization.settings.update", fields: ["name", "holiday_date", "category", "description", "status"] },
  employmentTypes: { table: "employment_types", permission: "organization.settings.update", fields: ["name", "code", "status"] },
  workingDays: { table: "working_days", permission: "organization.settings.update", fields: ["day_of_week", "is_working_day"] }
} as const;

async function getContext(event: Parameters<RequestHandler>[0], user: Awaited<ReturnType<typeof import("$lib/server/request-context").requireSvelteUser>>) {
  const tenant = await resolveTenantContextForUser(user);
  if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
  const definition = definitions[event.params.resource as keyof typeof definitions];
  if (!definition) throw new AppError("NOT_FOUND", "Master-data resource was not found.", 404);
  await authorize({ organizationId: tenant.organization.id, permission: definition.permission as never });
  return { user, tenant, definition };
}

export const PATCH: RequestHandler = async (event) => { try { const input = await event.request.json() as Record<string, unknown>; return Response.json(await withSvelteRequestUser(event, async (user) => { const { tenant, definition } = await getContext(event, user); const entries = Object.entries(input).filter(([key, value]) => definition.fields.includes(key as never) && value !== undefined); if (!entries.length) throw new AppError("VALIDATION_ERROR", "At least one editable field is required.", 400); const assignments = entries.map(([key, value]) => sql`${sql.raw(key)} = ${value}`); const [row] = await db.execute(sql`UPDATE ${sql.raw(definition.table)} SET ${sql.join(assignments, sql`, `)}, updated_at = now() WHERE id = ${event.params.itemId} AND organization_id = ${tenant.organization.id} RETURNING *`); if (!row) throw new AppError("NOT_FOUND", "Master-data item was not found.", 404); return { success: true, item: row }; })); } catch (cause) { return errorResponse(cause); } };
export const DELETE: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const { tenant, definition } = await getContext(event, user); const statement = event.params.resource === "workingDays" ? sql`DELETE FROM ${sql.raw(definition.table)} WHERE id = ${event.params.itemId} AND organization_id = ${tenant.organization.id} RETURNING id` : sql`UPDATE ${sql.raw(definition.table)} SET status = 'inactive', updated_at = now() WHERE id = ${event.params.itemId} AND organization_id = ${tenant.organization.id} RETURNING id`; const [row] = await db.execute(statement); if (!row) throw new AppError("NOT_FOUND", "Master-data item was not found.", 404); return { success: true }; })); } catch (cause) { return errorResponse(cause); } };
