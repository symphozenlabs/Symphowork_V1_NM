import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employeeHistory, employees, invitations } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { canAssignRole } from "@/modules/rbac/permissions";
import { isOrganizationOwnerEmployee, isActorPrivilegedForOwnerRecord } from "@/modules/employees/service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ employeeId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }
    await authorize({
      organizationId: tenant.organization.id,
      permission: "employee.invite",
    });

    const { employeeId } = await context.params;

    const [employee] = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, tenant.organization.id)
        )
      );

    if (!employee) {
      throw new AppError("NOT_FOUND", "Employee was not found.", 404);
    }

    const isOwner = await isOrganizationOwnerEmployee(tenant.organization.id, employee.id);
    if (isOwner) {
      const isPrivileged = await isActorPrivilegedForOwnerRecord(tenant.organization.id, tenant.user.id);
      if (!isPrivileged) {
        throw new AppError(
          "FORBIDDEN",
          "The Organization Owner employee record is protected from modification by other tenant roles.",
          403
        );
      }
    }

    // Find the latest invitation for this employee in this organization
    const invitation = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.employeeId, employee.id),
        eq(invitations.organizationId, tenant.organization.id)
      ),
      orderBy: (inv, { desc }) => [desc(inv.createdAt)],
    });

    if (!invitation) {
      throw new AppError("NOT_FOUND", "No invitation was found for this employee.", 404);
    }

    if (invitation.status === "accepted") {
      throw new AppError(
        "INVITATION_ALREADY_ACCEPTED",
        "This invitation has already been accepted and cannot be revoked.",
        409
      );
    }

    if (invitation.status === "revoked") {
      return NextResponse.json({
        success: true,
        message: "Invitation has already been revoked.",
        invitation: { id: invitation.id, status: "revoked" },
      });
    }

    const actorRoleKey = tenant.role?.key;
    if (!canAssignRole(actorRoleKey, invitation.intendedRole)) {
      throw new AppError(
        "FORBIDDEN",
        `You are not authorized to revoke invitations for role ${invitation.intendedRole}.`,
        403
      );
    }

    const [revoked] = await db
      .update(invitations)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitation.id))
      .returning();

    await db.insert(employeeHistory).values({
      organizationId: tenant.organization.id,
      employeeId: employee.id,
      eventType: "invitation_revoked",
      previousValue: invitation.status,
      newValue: "revoked",
      actorUserId: tenant.user.id,
    });

    await recordAudit({
      actorUserId: tenant.user.id,
      organizationId: tenant.organization.id,
      action: "employee_invitation_revoked",
      resource: "invitation",
      resourceId: invitation.id,
      metadata: {
        employeeId: employee.id,
        intendedRole: invitation.intendedRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation has been revoked successfully.",
      invitation: {
        id: revoked.id,
        status: revoked.status,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
