import { and, eq, gt, sql } from "drizzle-orm";
import { withInvitationTokenTransaction, type DbTransaction } from "@/db/client";
import { employees, invitations, memberships, onboarding, organizations, roles, users } from "@/db/schema";
import { hashPassword, hashToken, verifyPassword } from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import { recordAuditInTransaction } from "@/lib/audit";
import { normalizeEmail, validatePassword } from "@/modules/identity/auth";

type SessionIdentity = { id: string; email: string };

async function findInvitation(transaction: DbTransaction, tokenHash: string) {
  return transaction.query.invitations.findFirst({ where: eq(invitations.tokenHash, tokenHash) });
}

async function withInvitationContext<T>(token: string, callback: (transaction: DbTransaction) => Promise<T>) {
  const tokenHash = hashToken(token);
  return withInvitationTokenTransaction(tokenHash, (transaction) => callback(transaction));
}

function validateInvitation(invitation: Awaited<ReturnType<typeof findInvitation>>) {
  if (!invitation) throw new AppError("INVITATION_INVALID", "This invitation is invalid.", 400);
  if (invitation.status === "accepted") throw new AppError("INVITATION_ALREADY_ACCEPTED", "This invitation has already been accepted.", 409);
  if (invitation.status === "revoked") throw new AppError("INVITATION_REVOKED", "This invitation has been revoked.", 410);
  if (invitation.status !== "pending" || invitation.expiresAt <= new Date()) throw new AppError("INVITATION_EXPIRED", "This invitation has expired.", 410);
  return invitation;
}

export async function getInvitationPreview(token: string) {
  return withInvitationContext(token, async (transaction) => {
    const invitation = validateInvitation(await findInvitation(transaction, hashToken(token)));
    const organization = await transaction.query.organizations.findFirst({ where: eq(organizations.id, invitation.organizationId) });
    if (!organization) throw new AppError("INVITATION_INVALID", "This invitation is no longer available.", 400);
    return { organization: { name: organization.name, slug: organization.slug }, invitedEmail: invitation.invitedEmail, expiresAt: invitation.expiresAt };
  });
}

export async function acceptInvitation(input: { token: string; fullName?: string; password?: string; currentUser?: SessionIdentity | null }) {
  return withInvitationContext(input.token, async (tx) => {
    const invitation = validateInvitation(await findInvitation(tx, hashToken(input.token)));
    await tx.execute(sql`select set_config('app.current_organization_id', ${invitation.organizationId}, true)`);
    let user = await tx.query.users.findFirst({ where: eq(users.email, normalizeEmail(invitation.invitedEmail)) });
    if (input.currentUser && (!user || user.id !== input.currentUser.id || normalizeEmail(input.currentUser.email) !== normalizeEmail(invitation.invitedEmail))) throw new AppError("INVITATION_EMAIL_MISMATCH", "This invitation belongs to a different email address.", 403);
    if (user) {
      const existingMembership = await tx.query.memberships.findFirst({ where: eq(memberships.userId, user.id) });
      if (existingMembership && existingMembership.organizationId !== invitation.organizationId) throw new AppError("USER_ALREADY_IN_ORGANIZATION", "This user already belongs to another organization.", 409);
      if (existingMembership) throw new AppError("MEMBERSHIP_ALREADY_EXISTS", "This user is already a member of the organization.", 409);
      if (!input.currentUser) {
        if (!input.password || !(await verifyPassword(input.password, user.passwordHash))) throw new AppError("AUTH_INVALID_CREDENTIALS", "The password is incorrect.", 401);
      }
    } else {
      if (input.currentUser) throw new AppError("INVITATION_EMAIL_MISMATCH", "This invitation belongs to a different email address.", 403);
      if (!input.fullName?.trim() || !input.password || !validatePassword(input.password)) throw new AppError("VALIDATION_ERROR", "A name and a strong password are required.", 400);
      [user] = await tx.insert(users).values({ email: normalizeEmail(invitation.invitedEmail), fullName: input.fullName.trim(), passwordHash: await hashPassword(input.password), emailVerifiedAt: new Date() }).returning();
    }
    const role = await tx.query.roles.findFirst({ where: and(eq(roles.organizationId, invitation.organizationId), eq(roles.key, invitation.intendedRole)) });
    if (!role) throw new AppError("PROVISIONING_FAILED", "The invitation role is no longer available.", 500);
    const [membership] = await tx.insert(memberships).values({ userId: user.id, organizationId: invitation.organizationId, roleId: role.id, status: "active" }).returning();
    if (invitation.employeeId) { await tx.update(employees).set({ userId: user.id, status: "onboarding", updatedAt: new Date() }).where(eq(employees.id, invitation.employeeId)); await tx.update(onboarding).set({ status: "in_progress", startedAt: new Date(), updatedAt: new Date() }).where(eq(onboarding.employeeId, invitation.employeeId)); }
    const [consumedInvitation] = await tx.update(invitations).set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() }).where(and(eq(invitations.id, invitation.id), eq(invitations.status, "pending"), gt(invitations.expiresAt, new Date()))).returning();
    if (!consumedInvitation) {
      const currentInvitation = await tx.query.invitations.findFirst({ where: eq(invitations.id, invitation.id) });
      if (currentInvitation?.status === "accepted") throw new AppError("INVITATION_ALREADY_ACCEPTED", "This invitation has already been accepted.", 409);
      if (currentInvitation?.status === "revoked") throw new AppError("INVITATION_REVOKED", "This invitation has been revoked.", 410);
      throw new AppError("INVITATION_EXPIRED", "This invitation has expired.", 410);
    }
    await recordAuditInTransaction(tx, { actorUserId: user.id, organizationId: invitation.organizationId, action: "invitation_accepted", resource: "invitation", resourceId: invitation.id });
    return { user, membership };
  });
}
