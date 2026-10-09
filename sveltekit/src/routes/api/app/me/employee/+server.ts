import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { employeeInputSchema } from "@/modules/employees/validation";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const [employee] = await db.select().from(employees).where(and(eq(employees.userId, user.id), eq(employees.organizationId, tenant.organization.id))); if (!employee) throw new AppError("NOT_FOUND", "Your employee profile is not linked yet.", 404); return { success: true, employee }; })); } catch (cause) { return errorResponse(cause); } };
export const PATCH: RequestHandler = async (event) => { try { const changes = employeeInputSchema.pick({ firstName: true, middleName: true, lastName: true, personalEmail: true, phone: true }).partial().parse(await event.request.json()); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const [employee] = await db.select().from(employees).where(and(eq(employees.userId, user.id), eq(employees.organizationId, tenant.organization.id))); if (!employee) throw new AppError("NOT_FOUND", "Your employee profile is not linked yet.", 404); const [updated] = await db.update(employees).set({ ...changes, displayName: [changes.firstName ?? employee.firstName, changes.middleName ?? employee.middleName, changes.lastName ?? employee.lastName].filter(Boolean).join(" "), updatedAt: new Date() }).where(eq(employees.id, employee.id)).returning(); return { success: true, employee: updated }; })); } catch (cause) { return errorResponse(cause); } };
