import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import {
  departments,
  employeeHistory,
  employees,
  invitations,
  memberships,
  onboarding,
  onboardingChecklistItems,
  roles,
  shifts,
  teams,
} from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { isOrganizationOwnerEmployee, isActorPrivilegedForOwnerRecord } from "@/modules/employees/service";

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

    const isOwner = await isOrganizationOwnerEmployee(tenant.organization.id, employee.id);
    if (isOwner) {
      const isPrivileged = await isActorPrivilegedForOwnerRecord(tenant.organization.id, tenant.user.id);
      if (!isPrivileged) {
        throw new AppError(
          "FORBIDDEN",
          "The Organization Owner onboarding records are protected from modification by other tenant roles.",
          403
        );
      }
    }

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

    const isOwner = await isOrganizationOwnerEmployee(tenant.organization.id, employee.id);
    if (isOwner) {
      const isPrivileged = await isActorPrivilegedForOwnerRecord(tenant.organization.id, tenant.user.id);
      if (!isPrivileged) {
        throw new AppError(
          "FORBIDDEN",
          "The Organization Owner onboarding records are protected from modification by other tenant roles.",
          403
        );
      }
    }
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
      .where(and(eq(onboardingChecklistItems.onboardingId, record.id), ne(onboardingChecklistItems.status, "completed")));
    if (pending.length) throw new AppError("VALIDATION_ERROR", "Complete all onboarding checklist items first.", 400);

    // Verify joiningDate before activation
    if (!employee.joiningDate) {
      throw new AppError("VALIDATION_ERROR", "Joining date is required before onboarding can be completed.", 400);
    }

    // Determine employee role to enforce role-specific requirements
    let employeeRole: string | null = null;
    if (employee.userId) {
      try {
        const [mem] = await db
          .select({ roleKey: roles.key })
          .from(memberships)
          .innerJoin(roles, eq(roles.id, memberships.roleId))
          .where(
            and(
              eq(memberships.organizationId, tenant.organization.id),
              eq(memberships.userId, employee.userId),
              eq(memberships.status, "active")
            )
          )
          .limit(1);
        if (mem?.roleKey) employeeRole = mem.roleKey;
      } catch {}
    }
    if (!employeeRole) {
      try {
        const [inv] = await db
          .select({ intendedRole: invitations.intendedRole })
          .from(invitations)
          .where(
            and(
              eq(invitations.organizationId, tenant.organization.id),
              eq(invitations.employeeId, employee.id)
            )
          )
          .limit(1);
        if (inv?.intendedRole) employeeRole = inv.intendedRole;
      } catch {}
    }
    if (!employeeRole) {
      try {
        const historyEvents = await db
          .select({ newValue: employeeHistory.newValue })
          .from(employeeHistory)
          .where(
            and(
              eq(employeeHistory.organizationId, tenant.organization.id),
              eq(employeeHistory.employeeId, employee.id),
              eq(employeeHistory.eventType, "joining")
            )
          )
          .limit(1);
        if (historyEvents[0]?.newValue) {
          try {
            const parsed = JSON.parse(historyEvents[0].newValue);
            if (parsed?.targetRole) employeeRole = parsed.targetRole;
          } catch {}
        }
      } catch {}
    }

    // Department validation (mandatory for MANAGER, TEAM_LEAD, PROJECT_MANAGER, EMPLOYEE)
    const departmentMandatoryRoles = ["MANAGER", "TEAM_LEAD", "PROJECT_MANAGER", "EMPLOYEE"];
    const isDeptMandatory = !employeeRole || departmentMandatoryRoles.includes(employeeRole);
    if (isDeptMandatory && !employee.departmentId) {
      throw new AppError("VALIDATION_ERROR", "Department is required for this role before completing onboarding.", 400);
    }

    if (employee.departmentId) {
      const [dept] = await db
        .select()
        .from(departments)
        .where(
          and(
            eq(departments.id, employee.departmentId),
            eq(departments.organizationId, tenant.organization.id)
          )
        );
      if (!dept) {
        throw new AppError("VALIDATION_ERROR", "Assigned department does not belong to this organization.", 400);
      }
      if (dept.status !== "active") {
        throw new AppError("VALIDATION_ERROR", "Assigned department is not active.", 400);
      }
    }

    // Shift validation (must belong to same organization and be active)
    if (employee.shiftId) {
      const [shift] = await db
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.id, employee.shiftId),
            eq(shifts.organizationId, tenant.organization.id)
          )
        );
      if (!shift) {
        throw new AppError("VALIDATION_ERROR", "Assigned shift does not belong to this organization.", 400);
      }
      if (shift.status !== "active") {
        throw new AppError("VALIDATION_ERROR", "Assigned shift is not active.", 400);
      }
    }

    // Team validation (must belong to same organization, be active, and belong to assigned department)
    if (employee.teamId) {
      const [team] = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.id, employee.teamId),
            eq(teams.organizationId, tenant.organization.id)
          )
        );
      if (!team) {
        throw new AppError("VALIDATION_ERROR", "Assigned team does not belong to this organization.", 400);
      }
      if (team.status !== "active") {
        throw new AppError("VALIDATION_ERROR", "Assigned team is not active.", 400);
      }
      if (!employee.departmentId || team.departmentId !== employee.departmentId) {
        throw new AppError("VALIDATION_ERROR", "Assigned team does not belong to the assigned department.", 400);
      }
    }

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
