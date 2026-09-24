import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, invitations, organizations, permissions, plans, provisioningJobs, rolePermissions, roles, subscriptions } from "@/db/schema";
import { createOpaqueToken, hashToken } from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { ALL_PERMISSION_KEYS, ROLE_PERMISSIONS, SYSTEM_ROLES } from "@/modules/rbac/permissions";
import type { OrganizationInput } from "@/modules/platform/validation";

export async function createOrganization(input: OrganizationInput, actorUserId: string) {
  const existing = await db.query.organizations.findFirst({ where: eq(organizations.slug, input.slug) });
  if (existing) throw new AppError("ORG_ALREADY_EXISTS", "An organization with this slug already exists.", 409);
  const result = await db.transaction(async (tx) => {
    const [organization] = await tx.insert(organizations).values({ ...input, status: "pending" }).returning();
    const [job] = await tx.insert(provisioningJobs).values({ organizationId: organization.id }).returning();
    await tx.insert(auditLogs).values({ actorUserId, action: "organization_creation", resource: "organization", resourceId: organization.id });
    return { organization, job };
  });
  return result;
}

export async function approveOrganization(organizationId: string, actorUserId: string) {
  const [organization] = await db.update(organizations).set({ status: "active", updatedAt: new Date() }).where(and(eq(organizations.id, organizationId), eq(organizations.status, "pending"))).returning();
  if (!organization) throw new AppError("ORG_NOT_FOUND", "Pending organization was not found.", 404);
  await recordAudit({ actorUserId, action: "organization_approval", resource: "organization", resourceId: organizationId });
  return organization;
}

export async function runProvisioning(organizationId: string, primaryAdminEmail: string, actorUserId?: string) {
  return db.transaction(async (tx) => {
    let invitationToken: string | undefined;
    const job = await tx.query.provisioningJobs.findFirst({ where: eq(provisioningJobs.organizationId, organizationId) });
    if (!job) throw new AppError("PROVISIONING_FAILED", "Provisioning job was not found.", 404);
    if (job.status === "completed") return { job, invitationToken: undefined };
    await tx.update(provisioningJobs).set({ status: "running", currentStep: "roles", attempts: job.attempts + 1, startedAt: job.startedAt ?? new Date(), updatedAt: new Date() }).where(eq(provisioningJobs.id, job.id));
    const roleRows = await tx.select().from(roles).where(eq(roles.organizationId, organizationId));
    const roleByKey = new Map(roleRows.map((role) => [role.key, role]));
    for (const key of SYSTEM_ROLES.filter((candidate) => candidate !== "PLATFORM_OWNER")) {
      if (!roleByKey.has(key)) { const [role] = await tx.insert(roles).values({ organizationId, key, name: key.replaceAll("_", " "), isSystem: true }).returning(); roleByKey.set(key, role); }
    }
    for (const key of ALL_PERMISSION_KEYS) await tx.insert(permissions).values({ key }).onConflictDoNothing();
    const permissionRows = await tx.select().from(permissions);
    const permissionByKey = new Map(permissionRows.map((permission) => [permission.key, permission]));
    for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) { const role = roleByKey.get(roleKey); if (!role) continue; for (const permissionKey of permissionKeys) { const permission = permissionByKey.get(permissionKey); if (permission) await tx.insert(rolePermissions).values({ roleId: role.id, permissionId: permission.id }).onConflictDoNothing(); } }
    await tx.update(provisioningJobs).set({ currentStep: "subscription", updatedAt: new Date() }).where(eq(provisioningJobs.id, job.id));
    let plan = await tx.query.plans.findFirst({ where: eq(plans.code, "FREE") });
    if (!plan) { [plan] = await tx.insert(plans).values({ code: "FREE", name: "Free", description: "Foundation plan" }).returning(); }
    await tx.insert(subscriptions).values({ organizationId, planId: plan.id, status: "active", startsAt: new Date() }).onConflictDoNothing();
    await tx.update(provisioningJobs).set({ currentStep: "primary_admin_invitation", updatedAt: new Date() }).where(eq(provisioningJobs.id, job.id));
    const ownerRole = roleByKey.get("ORGANIZATION_OWNER");
    if (!ownerRole) throw new AppError("PROVISIONING_FAILED", "Owner role could not be initialized.", 500);
    const existingInvitation = await tx.query.invitations.findFirst({ where: and(eq(invitations.organizationId, organizationId), eq(invitations.invitedEmail, primaryAdminEmail.toLowerCase()), eq(invitations.status, "pending")) });
    if (!existingInvitation) { invitationToken = createOpaqueToken(); await tx.insert(invitations).values({ organizationId, invitedEmail: primaryAdminEmail.toLowerCase(), intendedRole: ownerRole.key, tokenHash: hashToken(invitationToken), expiresAt: new Date(Date.now() + 7 * 86_400_000) }); }
    const [completed] = await tx.update(provisioningJobs).set({ status: "completed", currentStep: "ready", completedAt: new Date(), updatedAt: new Date() }).where(eq(provisioningJobs.id, job.id)).returning();
    await recordAudit({ actorUserId, organizationId, action: "provisioning_completed", resource: "provisioning_job", resourceId: job.id });
    return { job: completed, invitationToken };
  });
}
