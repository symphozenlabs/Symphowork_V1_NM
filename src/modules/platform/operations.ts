import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { withPlatformTransaction } from "@/db/client";
import { auditLogs, employees, invitations, organizations, provisioningJobs, subscriptions, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { authorizePlatform, authorizePlatformTargetOrganization, hasPlatformPermission, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { runProvisioning } from "@/modules/platform/provisioning";
import { organizationStatusSchema, platformRoleSchema } from "@/modules/platform/validation";
import { z } from "zod";
import { buildInvitationUrl, sendInvitationEmail } from "@/lib/email";
import { createOpaqueToken, hashToken } from "@/lib/crypto";

const allowedTransitions: Record<string, string[]> = {
  pending: ["active", "rejected"],
  active: ["suspended", "archived"],
  suspended: ["active", "archived"],
  rejected: [],
  archived: [],
};
export function canTransitionOrganizationStatus(current: string, next: string) { return allowedTransitions[current]?.includes(next) ?? false; }

export async function listPlatformOrganizations(input: { page?: number; pageSize?: number; query?: string; status?: string }) {
  await authorizePlatform(PLATFORM_PERMISSIONS.organizationView);
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  const filters = [];
  if (input.query) filters.push(or(ilike(organizations.name, `%${input.query}%`), ilike(organizations.slug, `%${input.query}%`)));
  if (input.status) filters.push(eq(organizations.status, input.status as typeof organizations.status.enumValues[number]));
  const where = filters.length ? and(...filters) : undefined;
  const { rows, total } = await withPlatformTransaction(async (tx) => {
    const rows = await tx.select().from(organizations).where(where).orderBy(desc(organizations.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
    const [{ total }] = await tx.select({ total: count() }).from(organizations).where(where);
    return { rows, total };
  });
  return { rows, page, pageSize, total, pageCount: Math.ceil(total / pageSize) };
}

export async function getPlatformOrganization(organizationId: string) {
  const { user, organization } = await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.organizationView, action: "organization_inspect" });
  const [job, subscription, invitation, [{ employeeCount }], [{ activeEmployeeCount }], activity] = await withPlatformTransaction(async (tx) => Promise.all([
    tx.query.provisioningJobs.findFirst({ where: eq(provisioningJobs.organizationId, organizationId) }),
    tx.query.subscriptions.findFirst({ where: eq(subscriptions.organizationId, organizationId) }),
    tx.query.invitations.findFirst({ where: and(eq(invitations.organizationId, organizationId), eq(invitations.invitationType, "organization_admin")) }),
    tx.select({ employeeCount: count() }).from(employees).where(eq(employees.organizationId, organizationId)),
    tx.select({ activeEmployeeCount: count() }).from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.status, "active"))),
    tx.select().from(auditLogs).where(eq(auditLogs.organizationId, organizationId)).orderBy(desc(auditLogs.createdAt)).limit(12),
  ]));
  await recordAudit({ actorUserId: user.id, organizationId, action: "platform_organization_inspection", resource: "organization", resourceId: organizationId, platform: true });
  return { organization, job, invitation, subscription, employeeCount, activeEmployeeCount, activity };
}

async function issueOrganizationAdminInvitation(organizationId: string, action: string, requireUnexpired: boolean) {
  const { organization } = await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.provisioningManage, action });
  const result = await withPlatformTransaction(async (tx) => {
    const invitation = await tx.query.invitations.findFirst({ where: and(eq(invitations.organizationId, organizationId), eq(invitations.invitationType, "organization_admin"), eq(invitations.intendedRole, "ORGANIZATION_OWNER"), eq(invitations.status, "pending")) });
    if (!invitation) throw new AppError("PROVISIONING_FAILED", "No pending organization admin invitation is available.", 409);
    if (requireUnexpired && invitation.expiresAt <= new Date()) throw new AppError("INVITATION_EXPIRED", "Invitation expired. Resend the invitation to generate a new link.", 410);
    const token = createOpaqueToken();
    const [updated] = await tx.update(invitations).set({ tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 7 * 86_400_000), updatedAt: new Date() }).where(eq(invitations.id, invitation.id)).returning();
    return { invitation: updated, token };
  });
  return { organization, ...result };
}

export async function resendOrganizationInvitation(organizationId: string, actorUserId: string) {
  const result = await issueOrganizationAdminInvitation(organizationId, "organization_invitation_resend", false);
  const delivery = await sendInvitationEmail({ email: result.organization.contactEmail ?? "", token: result.token, organizationName: result.organization.name });
  await recordAudit({ actorUserId, organizationId, action: "organization_invitation_resent", resource: "invitation", resourceId: result.invitation.id, platform: true });
  return { invitation: { id: result.invitation.id, status: result.invitation.status, delivery } };
}

export async function createOrganizationInvitationLink(organizationId: string, actorUserId: string) {
  if (!process.env.APP_URL?.trim()) throw new AppError("PROVISIONING_FAILED", "The public application URL is not configured.", 503);
  const result = await issueOrganizationAdminInvitation(organizationId, "organization_invitation_link_copy", true);
  let invitationUrl: string;
  try {
    invitationUrl = buildInvitationUrl(result.token);
  } catch {
    throw new AppError("PROVISIONING_FAILED", "The public application URL is not configured.", 503);
  }
  await recordAudit({ actorUserId, organizationId, action: "organization_invitation_link_copied", resource: "invitation", resourceId: result.invitation.id, platform: true });
  return { invitationUrl };
}

export async function changeOrganizationStatus(organizationId: string, nextStatus: string, actorUserId: string) {
  const { organization } = await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.organizationSuspend, action: "organization_status_update" });
  const status = organizationStatusSchema.parse(nextStatus);
  if (!canTransitionOrganizationStatus(organization.status, status)) throw new AppError("INVALID_STATUS_TRANSITION", `Organization status cannot change from ${organization.status} to ${status}.`, 409);
  const [updated] = await withPlatformTransaction((tx) => tx.update(organizations).set({ status, updatedAt: new Date() }).where(and(eq(organizations.id, organizationId), eq(organizations.status, organization.status))).returning());
  if (!updated) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);
  await recordAudit({ actorUserId, organizationId, action: "organization_status_changed", resource: "organization", resourceId: organizationId, metadata: { from: organization.status, to: status }, platform: true });
  return updated;
}

export async function listProvisioningJobs() {
  await authorizePlatform(PLATFORM_PERMISSIONS.provisioningView);
  return withPlatformTransaction((tx) => tx.select({ job: provisioningJobs, organization: { id: organizations.id, name: organizations.name, slug: organizations.slug, contactEmail: organizations.contactEmail } }).from(provisioningJobs).innerJoin(organizations, eq(provisioningJobs.organizationId, organizations.id)).orderBy(desc(provisioningJobs.createdAt)));
}

const provisioningContactSchema = z.string().trim().email();
export async function retryProvisioning(organizationId: string, actorUserId: string, requestedPrimaryAdminEmail?: string) {
  await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.provisioningManage, action: "provisioning_retry" });
  const job = await withPlatformTransaction((tx) => tx.query.provisioningJobs.findFirst({ where: eq(provisioningJobs.organizationId, organizationId) }));
  if (!job) throw new AppError("PROVISIONING_FAILED", "Provisioning job was not found.", 404);
  if (job.status === "completed") throw new AppError("PROVISIONING_FAILED", "Completed provisioning jobs cannot be retried.", 409);
  const [organization] = await withPlatformTransaction((tx) => tx.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1));
  const primaryAdminEmail = requestedPrimaryAdminEmail ? provisioningContactSchema.parse(requestedPrimaryAdminEmail).toLowerCase() : organization?.contactEmail?.toLowerCase();
  if (!primaryAdminEmail) throw new AppError("PROVISIONING_FAILED", "A primary administrator email is required to process this job.", 400);
  if (organization && organization.contactEmail !== primaryAdminEmail) await withPlatformTransaction((tx) => tx.update(organizations).set({ contactEmail: primaryAdminEmail, updatedAt: new Date() }).where(eq(organizations.id, organizationId)));
  let result;
  try {
    result = await runProvisioning(organizationId, primaryAdminEmail, actorUserId);
  } catch (error) {
    const message = error instanceof AppError ? error.message : "Provisioning could not be completed. Retry the job or contact support.";
    await withPlatformTransaction((tx) => tx.update(provisioningJobs).set({ status: "failed", currentStep: "failed", failureMessage: message.slice(0, 1000), updatedAt: new Date() }).where(eq(provisioningJobs.id, job.id)));
    await recordAudit({ actorUserId, organizationId, action: "provisioning_failed", resource: "provisioning_job", resourceId: job.id, metadata: { message }, platform: true });
    throw new AppError("PROVISIONING_FAILED", message, error instanceof AppError ? error.status : 500);
  }
  await recordAudit({ actorUserId, organizationId, action: "provisioning_retried", resource: "provisioning_job", resourceId: job.id, platform: true });
  const delivery = result.invitationToken ? await sendInvitationEmail({ email: primaryAdminEmail, token: result.invitationToken, organizationName: organization.name }) : "not_configured";
  return { job: result.job, invitation: { status: result.invitationToken ? "created" : "already_exists", delivery } };
}

export async function listPlatformUsers() {
  await authorizePlatform(PLATFORM_PERMISSIONS.userView);
  return withPlatformTransaction((tx) => tx.select({ id: users.id, email: users.email, fullName: users.fullName, status: users.status, platformRole: users.platformRole, createdAt: users.createdAt }).from(users).where(ne(users.platformRole, "NONE")).orderBy(desc(users.createdAt)));
}

export async function changePlatformRole(targetUserId: string, nextRole: string, actorUserId: string) {
  const actor = await authorizePlatform(PLATFORM_PERMISSIONS.userManage);
  const role = platformRoleSchema.parse(nextRole);
  if (!hasPlatformPermission(actor.platformRole, PLATFORM_PERMISSIONS.userManage)) throw new AppError("FORBIDDEN", "Platform user management permission is required.", 403);
  const [target] = await withPlatformTransaction((tx) => tx.select().from(users).where(eq(users.id, targetUserId)).limit(1));
  if (!target) throw new AppError("NOT_FOUND", "Platform user was not found.", 404);
  const authority = ["PLATFORM_OWNER", "PRODUCT_OWNER"];
  if (!authority.includes(actor.platformRole) && (authority.includes(role) || authority.includes(target.platformRole))) throw new AppError("FORBIDDEN", "This role change exceeds your platform authority.", 403);
  if (authority.includes(target.platformRole) && !authority.includes(role)) {
    const [{ owners }] = await withPlatformTransaction((tx) => tx.select({ owners: count() }).from(users).where(or(eq(users.platformRole, "PLATFORM_OWNER"), eq(users.platformRole, "PRODUCT_OWNER"))));
    if (owners <= 1) throw new AppError("LAST_PLATFORM_OWNER", "The last high-authority platform user cannot be removed.", 409);
  }
  const [updated] = await withPlatformTransaction((tx) => tx.update(users).set({ platformRole: role, updatedAt: new Date() }).where(eq(users.id, targetUserId)).returning());
  await recordAudit({ actorUserId, action: "platform_role_changed", resource: "user", resourceId: targetUserId, metadata: { from: target.platformRole, to: role }, platform: true });
  return updated;
}

export async function listPlatformAudit() {
  await authorizePlatform(PLATFORM_PERMISSIONS.auditView);
  return withPlatformTransaction((tx) => tx.select({ audit: auditLogs, actor: { id: users.id, name: users.fullName, email: users.email } }).from(auditLogs).leftJoin(users, eq(auditLogs.actorUserId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(200));
}
