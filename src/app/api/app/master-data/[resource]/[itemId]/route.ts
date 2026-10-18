import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { updateDepartment, deleteDepartment } from "@/modules/departments/service";
import { departmentUpdateSchema } from "@/modules/departments/validation";

const definitions = {
  departments: { table: "departments", permission: "department.update", fields: ["name", "code", "description", "status"] },
  designations: { table: "designations", permission: "designation.update", fields: ["name", "code", "description", "level", "status"] },
  locations: { table: "locations", permission: "location.update", fields: ["name", "code", "address_line_1", "address_line_2", "city", "state", "country", "postal_code", "timezone", "status"] },
  teams: { table: "teams", permission: "team.update", fields: ["name", "code", "description", "department_id", "status"] },
  shifts: { table: "shifts", permission: "organization.settings.update", fields: ["name", "code", "start_time", "end_time", "break_minutes", "grace_minutes", "overnight", "status"] },
  holidays: { table: "holidays", permission: "organization.settings.update", fields: ["name", "holiday_date", "category", "description", "status"] },
  employmentTypes: { table: "employment_types", permission: "organization.settings.update", fields: ["name", "code", "status"] },
  workingDays: { table: "working_days", permission: "organization.settings.update", fields: ["day_of_week", "is_working_day"] },
} as const;

export async function PATCH(request: Request, context: { params: Promise<{ resource: string; itemId: string }> }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const { resource, itemId } = await context.params;

    if (resource === "departments") {
      const rawInput = await request.json();
      const validatedInput = departmentUpdateSchema.parse(rawInput);
      const updated = await updateDepartment(tenant.organization.id, tenant.user.id, itemId, validatedInput);
      return NextResponse.json({ success: true, item: updated });
    }

    const definition = definitions[resource as keyof typeof definitions];
    if (!definition) throw new AppError("NOT_FOUND", "Master-data resource was not found.", 404);
    await authorize({ organizationId: tenant.organization.id, permission: definition.permission as never });
    const rawInput = (await request.json()) as Record<string, unknown>;

    const camelToSnakeMap: Record<string, string> = {
      startTime: "start_time",
      endTime: "end_time",
      breakMinutes: "break_minutes",
      graceMinutes: "grace_minutes",
      holidayDate: "holiday_date",
      isWorkingDay: "is_working_day",
      dayOfWeek: "day_of_week",
      departmentId: "department_id",
      addressLine1: "address_line_1",
      addressLine2: "address_line_2",
      postalCode: "postal_code",
    };

    const input: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawInput)) {
      const normalizedKey = camelToSnakeMap[key] || key;
      input[normalizedKey] = value;
    }

    if (resource === "shifts") {
      const startTime = typeof input.start_time === "string" ? input.start_time : undefined;
      const endTime = typeof input.end_time === "string" ? input.end_time : undefined;
      const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
      if (startTime && !timeRegex.test(startTime)) {
        throw new AppError("VALIDATION_ERROR", "Invalid start time format. Use HH:MM.", 400);
      }
      if (endTime && !timeRegex.test(endTime)) {
        throw new AppError("VALIDATION_ERROR", "Invalid end time format. Use HH:MM.", 400);
      }
      if (startTime && endTime) {
        if (startTime === endTime) {
          throw new AppError("VALIDATION_ERROR", "Start time and end time cannot be identical.", 400);
        }
        const isOvernight = Boolean(input.overnight);
        if (!isOvernight && endTime < startTime) {
          throw new AppError("VALIDATION_ERROR", "End time must be after start time unless marked as an overnight shift.", 400);
        }
      }
    }

    const entries = Object.entries(input).filter(([key, value]) => definition.fields.includes(key as never) && value !== undefined);
    if (!entries.length) throw new AppError("VALIDATION_ERROR", "At least one editable field is required.", 400);
    const assignments = entries.map(([key, value]) => sql`${sql.raw(key)} = ${value}`);
    const [row] = await db.execute(sql`UPDATE ${sql.raw(definition.table)} SET ${sql.join(assignments, sql`, `)}, updated_at = now() WHERE id = ${itemId} AND organization_id = ${tenant.organization.id} RETURNING *`);
    if (!row) throw new AppError("NOT_FOUND", "Master-data item was not found.", 404);
    return NextResponse.json({ success: true, item: row });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ resource: string; itemId: string }> }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const { resource, itemId } = await context.params;

    if (resource === "departments") {
      // Safely deactivate via department service ensuring owner-only authorization
      await deleteDepartment(tenant.organization.id, tenant.user.id, itemId, true);
      return NextResponse.json({ success: true });
    }

    const definition = definitions[resource as keyof typeof definitions];
    if (!definition) throw new AppError("NOT_FOUND", "Master-data resource was not found.", 404);
    await authorize({ organizationId: tenant.organization.id, permission: definition.permission as never });
    const statement = resource === "workingDays"
      ? sql`DELETE FROM ${sql.raw(definition.table)} WHERE id = ${itemId} AND organization_id = ${tenant.organization.id} RETURNING id`
      : sql`UPDATE ${sql.raw(definition.table)} SET status = 'inactive', updated_at = now() WHERE id = ${itemId} AND organization_id = ${tenant.organization.id} RETURNING id`;
    const [row] = await db.execute(statement);
    if (!row) throw new AppError("NOT_FOUND", "Master-data item was not found.", 404);
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
