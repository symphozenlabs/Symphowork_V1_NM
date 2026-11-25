import { and, eq } from "drizzle-orm";
import { dev } from "$app/environment";
import { withTenantTransaction } from "@/db/client";
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
  context: { params: { employeeId: string } }
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

    const { employeeId } = context.params;
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      roleKey?: string;
      resend?: boolean;
    };

    const organizationId = tenant.organization.id;
    // Serialize issuance and resend for the same employee within its tenant.
    const { employee, email, invitation, token, role } = await withTenantTransaction(organizationId, async (tx) => {
      const [employee] = await tx
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.id, employeeId),
            eq(employees.organizationId, organizationId)
          )
        ).for("update");

      if (!employee) {
        throw new AppError("NOT_FOUND", "Employee was not found.", 404);
      }
      if (employee.status === "exited") {
        throw new AppError("FORBIDDEN", "An offboarded employee cannot be invited.", 403);
      }

      const isOwner = await isOrganizationOwnerEmployee(organizationId, employee.id, tx);
      if (isOwner) {
        const isPrivileged = await isActorPrivilegedForOwnerRecord(organizationId, tenant.user.id, tx);
        if (!isPrivileged) {
          throw new AppError(
            "FORBIDDEN",
            "The Organization Owner employee record is protected from modification by other tenant roles.",
            403
          );
        }
      }

      if (employee.userId) throw new AppError("MEMBERSHIP_ALREADY_EXISTS", "This employee already has an account.", 409);

      const email = (
        body.email ??
        employee.personalEmail ??
        employee.workEmail
      )?.trim().toLowerCase();

      if (!email) {
        throw new AppError("VALIDATION_ERROR", "An employee email is required.", 400);
      }

      const existing = await tx.query.invitations.findFirst({
        where: and(
          eq(invitations.organizationId, organizationId),
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

      const role = await tx.query.roles.findFirst({
        where: and(eq(roles.organizationId, organizationId), eq(roles.key, targetRoleKey)),
      });

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
            await tx
              .update(invitations)
              .set({
                invitedEmail: email,
                intendedRole: role.key,
                tokenHash: hashToken(token),
                expiresAt: new Date(Date.now() + 7 * 86_400_000),
                updatedAt: new Date(),
              })
              .where(and(eq(invitations.id, existing.id), eq(invitations.organizationId, organizationId), eq(invitations.status, "pending")))
              .returning()
          )[0]
        : (
            await tx
              .insert(invitations)
              .values({
                organizationId,
                employeeId: employee.id,
                invitationType: "employee",
                invitedEmail: email,
                intendedRole: role.key,
                tokenHash: hashToken(token),
                expiresAt: new Date(Date.now() + 7 * 86_400_000),
              })
              .returning()
          )[0];

      if (!invitation) {
        throw new AppError("VALIDATION_ERROR", "The invitation changed. Refresh before retrying.", 409);
      }

      await tx
        .update(employees)
        .set({ status: "invited", updatedAt: new Date() })
        .where(and(eq(employees.id, employee.id), eq(employees.organizationId, organizationId)));
      return { employee, email, invitation, token, role };
    });

    await recordAudit({
      actorUserId: tenant.user.id,
      organizationId: tenant.organization.id,
      action: body.resend ? "employee_invitation_resent" : "employee_invited",
      resource: "employee",
      resourceId: employee.id,
      metadata: { intendedRole: role.key },
    });

    const baseUrl = dev ? new URL(request.url).origin : undefined;
    let invitationUrl: string | undefined;
    try {
      invitationUrl = buildInvitationUrl(token, baseUrl);
    } catch {
      // A missing public origin must not produce a fake or externally routed link.
    }
    let delivery: Awaited<ReturnType<typeof sendInvitationEmail>> = "not_configured";
    if (invitationUrl) {
      try {
        delivery = await sendInvitationEmail({ email, token, organizationName: tenant.organization.name }, baseUrl);
      } catch {
        delivery = "failed";
      }
    }

    return Response.json({
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
