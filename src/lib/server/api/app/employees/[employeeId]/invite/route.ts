import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, withTenantTransaction } from "@/db/client";
import { employees, invitations, roles } from "@/db/schema";
import { createOpaqueToken, hashToken } from "@/lib/crypto";
import { errorResponse, AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { buildInvitationUrl, sendInvitationEmail } from "@/lib/email";
import { canAssignRole } from "@/modules/rbac/permissions";
import { isOrganizationOwnerEmployee, isActorPrivilegedForOwnerRecord } from "@/modules/employees/service";

export async function POST(
  request: Request,
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
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      roleKey?: string;
      resend?: boolean;
    };

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

    const email = (
      body.email ??
      employee.personalEmail ??
      employee.workEmail
    )?.trim().toLowerCase();

    if (!email) {
      throw new AppError("VALIDATION_ERROR", "An employee email is required.", 400);
    }

    const existing = await db.query.invitations.findFirst({
      where: and(
        eq(invitations.employeeId, employee.id),
        eq(invitations.status, "pending")
      ),
    });

    if (existing && !body.resend) {
      throw new AppError(
        "VALIDATION_ERROR",
        "An active invitation already exists.",
        409
      );
    }

    // Determine target role:
    // When resending, strictly preserve the existing authorized intendedRole.
    // When newly inviting, use body.roleKey or default to "EMPLOYEE".
    const targetRoleKey = (body.resend && existing?.intendedRole)
      ? existing.intendedRole
      : (body.roleKey?.trim() || "EMPLOYEE");

    const actorRoleKey = tenant.role?.key;
    if (!canAssignRole(actorRoleKey, targetRoleKey)) {
      throw new AppError(
        "FORBIDDEN",
        `You are not authorized to assign or invite users with role ${targetRoleKey}.`,
        403
      );
    }

    const role = await withTenantTransaction(tenant.organization.id, (tx) =>
      tx.query.roles.findFirst({
        where: and(
          eq(roles.organizationId, tenant.organization!.id),
          eq(roles.key, targetRoleKey)
        ),
      })
    );

    if (!role) {
      throw new AppError(
        "PROVISIONING_FAILED",
        `The role ${targetRoleKey} is not provisioned for this organization.`,
        500
      );
    }

    const token = createOpaqueToken();

    const invitation = existing
      ? (
          await db
            .update(invitations)
            .set({
              invitedEmail: email,
              intendedRole: role.key,
              tokenHash: hashToken(token),
              expiresAt: new Date(Date.now() + 7 * 86_400_000),
              updatedAt: new Date(),
            })
            .where(eq(invitations.id, existing.id))
            .returning()
        )[0]
      : (
          await db
            .insert(invitations)
            .values({
              organizationId: tenant.organization.id,
              employeeId: employee.id,
              invitationType: "employee",
              invitedEmail: email,
              intendedRole: role.key,
              tokenHash: hashToken(token),
              expiresAt: new Date(Date.now() + 7 * 86_400_000),
            })
            .returning()
        )[0];

    await db
      .update(employees)
      .set({ status: "invited", updatedAt: new Date() })
      .where(eq(employees.id, employee.id));

    await recordAudit({
      actorUserId: tenant.user.id,
      organizationId: tenant.organization.id,
      action: body.resend ? "employee_invitation_resent" : "employee_invited",
      resource: "employee",
      resourceId: employee.id,
      metadata: { intendedRole: role.key },
    });

    const delivery = await sendInvitationEmail({
      email,
      token,
      organizationName: tenant.organization.name,
    });

    let invitationUrl: string | undefined;
    try {
      invitationUrl = buildInvitationUrl(token);
    } catch {
      const origin = new URL(request.url).origin;
      if (origin) {
        invitationUrl = `${origin}/invitations/accept?token=${encodeURIComponent(token)}`;
      }
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        status: invitation.status,
        intendedRole: invitation.intendedRole,
        delivery,
      },
      invitationUrl,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
