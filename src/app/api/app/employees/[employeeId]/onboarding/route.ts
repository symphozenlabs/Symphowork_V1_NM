import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employeeHistory, employees, onboarding, onboardingChecklistItems } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";

export async function GET(_request: Request, context: { params: Promise<{ employeeId: string }> }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "employee.onboard" });
    const { employeeId } = await context.params;
    const [record] = await db
      .select()
      .from(onboarding)
      .where(and(eq(onboarding.employeeId, employeeId), eq(onboarding.organizationId, tenant.organization.id)));
    if (!record) throw new AppError("NOT_FOUND", "Onboarding record was not found.", 404);
    const items = await db
      .select()
      .from(onboardingChecklistItems)
      .where(and(eq(onboardingChecklistItems.onboardingId, record.id), eq(onboardingChecklistItems.organizationId, tenant.organization.id)));
    return NextResponse.json({ success: true, onboarding: record, items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ employeeId: string }> }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "employee.onboard" });
    const { employeeId } = await context.params;
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.organizationId, tenant.organization.id)));
    if (!employee) throw new AppError("NOT_FOUND", "Employee was not found.", 404);

    const [record] = await db
      .select()
      .from(onboarding)
      .where(and(eq(onboarding.employeeId, employeeId), eq(onboarding.organizationId, tenant.organization.id)));
    if (!record) throw new AppError("NOT_FOUND", "Onboarding record was not found.", 404);
    if (record.status === "completed") {
      throw new AppError("VALIDATION_ERROR", "Checklist items cannot be modified after onboarding is completed.", 400);
    }

    const body = (await request.json()) as { itemId?: string; status?: "pending" | "completed" | "blocked" };
    if (!body.itemId || !body.status) throw new AppError("VALIDATION_ERROR", "Checklist item and status are required.", 400);
    const [item] = await db
      .update(onboardingChecklistItems)
      .set({
        status: body.status,
        completedAt: body.status === "completed" ? new Date() : null,
        completedByUserId: body.status === "completed" ? tenant.user.id : null,
      })
      .where(and(eq(onboardingChecklistItems.id, body.itemId), eq(onboardingChecklistItems.organizationId, tenant.organization.id)))
      .returning();
    if (!item) throw new AppError("NOT_FOUND", "Checklist item was not found.", 404);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(_request: Request, context: { params: Promise<{ employeeId: string }> }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "employee.onboard" });
    const { employeeId } = await context.params;
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.organizationId, tenant.organization.id)));
    if (!employee) throw new AppError("NOT_FOUND", "Employee was not found.", 404);
    const [record] = await db
      .select()
      .from(onboarding)
      .where(and(eq(onboarding.employeeId, employeeId), eq(onboarding.organizationId, tenant.organization.id)));
    if (!record) throw new AppError("NOT_FOUND", "Onboarding record was not found.", 404);

    if (record.status === "completed") {
      return NextResponse.json({ success: true, onboarding: record });
    }

    const pending = await db
      .select()
      .from(onboardingChecklistItems)
      .where(and(eq(onboardingChecklistItems.onboardingId, record.id), eq(onboardingChecklistItems.status, "pending")));
    if (pending.length) throw new AppError("VALIDATION_ERROR", "Complete all onboarding checklist items first.", 400);

    const [updated] = await db
      .update(onboarding)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(onboarding.id, record.id))
      .returning();
    await db.update(employees).set({ status: "active", updatedAt: new Date() }).where(eq(employees.id, employeeId));
    await db.insert(employeeHistory).values({
      organizationId: tenant.organization.id,
      employeeId,
      eventType: "onboarding_completed",
      previousValue: employee.status,
      newValue: "active",
      actorUserId: tenant.user.id,
    });
    await recordAudit({
      actorUserId: tenant.user.id,
      organizationId: tenant.organization.id,
      action: "onboarding_completed",
      resource: "employee",
      resourceId: employeeId,
    });
    return NextResponse.json({ success: true, onboarding: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
