import { and, eq, ne } from "drizzle-orm";
import { withTenantTransaction } from "@/db/client";
import { employeeHistory, employees, invitations, memberships, roles, sessions, users } from "@/db/schema";
import { recordAuditInTransaction } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { isOrganizationOwnerEmployee } from "./service";

export async function offboardEmployee(employeeId: string) {
  const actor = await resolveTenantContext();
  if (!actor.organization || actor.user.platformRole !== "NONE" ||
      actor.membership?.status !== "active" || actor.membership.organizationId !== actor.organization.id ||
      actor.role?.key !== "ORGANIZATION_OWNER") {
    throw new AppError("FORBIDDEN", "Only an active Organization Owner can offboard employees.", 403);
  }
  const organizationId = actor.organization.id;
  return withTenantTransaction(organizationId, async (tx) => {
    const [employee] = await tx.select().from(employees)
      .where(and(eq(employees.organizationId, organizationId), eq(employees.id, employeeId)))
      .for("update");
    if (!employee) throw new AppError("NOT_FOUND", "Employee was not found in this organization.", 404);
    if (employee.userId === actor.user.id || await isOrganizationOwnerEmployee(organizationId, employeeId, tx)) {
      throw new AppError("FORBIDDEN", "Organization Owner records cannot be offboarded.", 403);
    }

    const audited = await tx.query.employeeHistory.findFirst({
      where: and(eq(employeeHistory.organizationId, organizationId), eq(employeeHistory.employeeId, employeeId),
        eq(employeeHistory.eventType, "employee_offboarded")),
    });

    let revokedSessions = 0;
    if (employee.userId) {
      // A membership is unique per user. Only revoke sessions for the verified linked
      // tenant member, never for a platform user or a user outside this tenant.
      const [target] = await tx.select({ id: memberships.id, platformRole: users.platformRole, roleKey: roles.key })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .innerJoin(roles, eq(roles.id, memberships.roleId))
        .where(and(eq(memberships.organizationId, organizationId), eq(memberships.userId, employee.userId)))
        .for("update", { of: memberships });
      if (!target || target.platformRole !== "NONE" || target.roleKey === "ORGANIZATION_OWNER") {
        throw new AppError("FORBIDDEN", "The linked account cannot be offboarded from this organization.", 403);
      }
      await tx.update(memberships).set({ status: "removed", updatedAt: new Date() })
        .where(and(eq(memberships.id, target.id), eq(memberships.organizationId, organizationId), ne(memberships.status, "removed")));
      revokedSessions = (await tx.delete(sessions).where(eq(sessions.userId, employee.userId))
        .returning({ id: sessions.id })).length;
    }

    const revoked = await tx.update(invitations).set({ status: "revoked", updatedAt: new Date() })
      .where(and(eq(invitations.organizationId, organizationId), eq(invitations.employeeId, employeeId),
        eq(invitations.status, "pending"))).returning({ id: invitations.id });
    if (employee.status !== "exited") {
      await tx.update(employees).set({ status: "exited", updatedAt: new Date() })
        .where(and(eq(employees.organizationId, organizationId), eq(employees.id, employeeId)));
    }
    if (!audited) {
      await tx.insert(employeeHistory).values({
        organizationId, employeeId, actorUserId: actor.user.id, eventType: "employee_offboarded",
        previousValue: JSON.stringify({ status: employee.status }),
        newValue: JSON.stringify({ status: "exited" }),
      });
      await recordAuditInTransaction(tx, {
        organizationId, actorUserId: actor.user.id, action: "employee_offboarded",
        resource: "employee", resourceId: employeeId,
        metadata: { revokedSessions, revokedInvitations: revoked.length },
      });
    }
    return { alreadyOffboarded: Boolean(audited), revokedSessions, revokedInvitations: revoked.length };
  });
}
