import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employeeHistory, employees, onboarding, onboardingChecklistItems } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError, errorResponse } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

async function tenantOnboarding(event: Parameters<NonNullable<RequestHandler>>[0], callback: (user: NonNullable<Awaited<ReturnType<typeof import("$lib/server/request-context").requireSvelteUser>>>, organizationId: string) => Promise<Response | Record<string, unknown>>) {
  return withSvelteRequestUser(event, async (user) => {
    const tenant = await resolveTenantContextForUser(user);
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "employee.onboard" });
    return callback(user, tenant.organization.id);
  });
}

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await tenantOnboarding(event, async (_user, organizationId) => {
      const [record] = await db.select().from(onboarding).where(and(eq(onboarding.employeeId, event.params.employeeId), eq(onboarding.organizationId, organizationId)));
      if (!record) throw new AppError("NOT_FOUND", "Onboarding record was not found.", 404);
      return { success: true, onboarding: record, items: await db.select().from(onboardingChecklistItems).where(and(eq(onboardingChecklistItems.onboardingId, record.id), eq(onboardingChecklistItems.organizationId, organizationId))) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const PATCH: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { itemId?: string; status?: "pending" | "completed" | "blocked" };
    if (!body.itemId || !body.status) throw new AppError("VALIDATION_ERROR", "Checklist item and status are required.", 400);
    return Response.json(await tenantOnboarding(event, async (user, organizationId) => {
      const [employee] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.id, event.params.employeeId), eq(employees.organizationId, organizationId)));
      if (!employee) throw new AppError("NOT_FOUND", "Employee was not found.", 404);
      const [item] = await db.update(onboardingChecklistItems).set({ status: body.status!, completedAt: body.status === "completed" ? new Date() : null, completedByUserId: body.status === "completed" ? user.id : null }).where(and(eq(onboardingChecklistItems.id, body.itemId!), eq(onboardingChecklistItems.organizationId, organizationId))).returning();
      if (!item) throw new AppError("NOT_FOUND", "Checklist item was not found.", 404);
      return { success: true, item };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    return Response.json(await tenantOnboarding(event, async (user, organizationId) => {
      const [employee] = await db.select().from(employees).where(and(eq(employees.id, event.params.employeeId), eq(employees.organizationId, organizationId)));
      if (!employee) throw new AppError("NOT_FOUND", "Employee was not found.", 404);
      const [record] = await db.select().from(onboarding).where(and(eq(onboarding.employeeId, event.params.employeeId), eq(onboarding.organizationId, organizationId)));
      if (!record) throw new AppError("NOT_FOUND", "Onboarding record was not found.", 404);
      const pending = await db.select().from(onboardingChecklistItems).where(and(eq(onboardingChecklistItems.onboardingId, record.id), eq(onboardingChecklistItems.status, "pending")));
      if (pending.length) throw new AppError("VALIDATION_ERROR", "Complete all onboarding checklist items first.", 400);
      const [updated] = await db.update(onboarding).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(onboarding.id, record.id)).returning();
      await db.update(employees).set({ status: "active", updatedAt: new Date() }).where(eq(employees.id, event.params.employeeId));
      await db.insert(employeeHistory).values({ organizationId, employeeId: event.params.employeeId, eventType: "onboarding_completed", previousValue: employee.status, newValue: "active", actorUserId: user.id });
      await recordAudit({ actorUserId: user.id, organizationId, action: "onboarding_completed", resource: "employee", resourceId: event.params.employeeId });
      return { success: true, onboarding: updated };
    }));
  } catch (cause) { return errorResponse(cause); }
};
