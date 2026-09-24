import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { invitations, memberships, roles, users } from "@/db/schema";
import { hashPassword, hashToken } from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { normalizeEmail, validatePassword } from "@/modules/identity/auth";

export async function acceptInvitation(input: { token: string; fullName: string; password: string }) {
  if (!validatePassword(input.password)) throw new AppError("VALIDATION_ERROR", "Password must be 12 characters with upper, lower, and numeric characters.", 400);
  const invitation = await db.query.invitations.findFirst({ where: and(eq(invitations.tokenHash, hashToken(input.token)), eq(invitations.status, "pending"), gt(invitations.expiresAt, new Date())) });
  if (!invitation) throw new AppError("INVITATION_INVALID", "This invitation is invalid or expired.", 400);
  const result = await db.transaction(async (tx) => {
    let user = await tx.query.users.findFirst({ where: eq(users.email, normalizeEmail(invitation.invitedEmail)) });
    if (user) {
      const existingMembership = await tx.query.memberships.findFirst({ where: eq(memberships.userId, user.id) });
      if (existingMembership && existingMembership.organizationId !== invitation.organizationId) throw new AppError("USER_ALREADY_IN_ORGANIZATION", "This user already belongs to another organization.", 409);
      if (existingMembership) throw new AppError("MEMBERSHIP_ALREADY_EXISTS", "This user is already a member of the organization.", 409);
    } else {
      [user] = await tx.insert(users).values({ email: normalizeEmail(invitation.invitedEmail), fullName: input.fullName.trim(), passwordHash: await hashPassword(input.password), emailVerifiedAt: new Date() }).returning();
    }
    const role = await tx.query.roles.findFirst({ where: and(eq(roles.organizationId, invitation.organizationId), eq(roles.key, invitation.intendedRole)) });
    if (!role) throw new AppError("PROVISIONING_FAILED", "The invitation role is no longer available.", 500);
    const [membership] = await tx.insert(memberships).values({ userId: user.id, organizationId: invitation.organizationId, roleId: role.id, status: "active" }).returning();
    await tx.update(invitations).set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() }).where(eq(invitations.id, invitation.id));
    return { user, membership };
  });
  await recordAudit({ actorUserId: result.user.id, organizationId: result.membership.organizationId, action: "invitation_accepted", resource: "invitation", resourceId: invitation.id });
  return result;
}
