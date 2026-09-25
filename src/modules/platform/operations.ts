import { and, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLogs, employees, organizations, provisioningJobs, subscriptions, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { authorizePlatform, authorizePlatformTargetOrganization, hasPlatformPermission, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { runProvisioning } from "@/modules/platform/provisioning";
import { organizationStatusSchema, platformRoleSchema } from "@/modules/platform/validation";

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
  const rows = await db.select().from(organizations).where(where).orderBy(desc(organizations.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  const [{ total }] = await db.select({ total: count() }).from(organizations).where(where);
  return { rows, page, pageSize, total, pageCount: Math.ceil(total / pageSize) };
}

export async function getPlatformOrganization(organizationId: string) {
  const { user, organization } = await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.organizationView, action: "organization_inspect" });
  const [job, subscription, [{ employeeCount }], [{ activeEmployeeCount }], activity] = await Promise.all([
    db.query.provisioningJobs.findFirst({ where: eq(provisioningJobs.organizationId, organizationId) }),
    db.query.subscriptions.findFirst({ where: eq(subscriptions.organizationId, organizationId) }),
    db.select({ employeeCount: count() }).from(employees).where(eq(employees.organizationId, organizationId)),
    db.select({ activeEmployeeCount: count() }).from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.status, "active"))),
    db.select().from(auditLogs).where(eq(auditLogs.organizationId, organizationId)).orderBy(desc(auditLogs.createdAt)).limit(12),
  ]);
  await recordAudit({ actorUserId: user.id, organizationId, action: "platform_organization_inspection", resource: "organization", resourceId: organizationId });
  return { organization, job, subscription, employeeCount, activeEmployeeCount, activity };
}

export async function changeOrganizationStatus(organizationId: string, nextStatus: string, actorUserId: string) {
  const { organization } = await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.organizationSuspend, action: "organization_status_update" });
  const status = organizationStatusSchema.parse(nextStatus);
  if (!canTransitionOrganizationStatus(organization.status, status)) throw new AppError("INVALID_STATUS_TRANSITION", `Organization status cannot change from ${organization.status} to ${status}.`, 409);
  const [updated] = await db.update(organizations).set({ status, updatedAt: new Date() }).where(and(eq(organizations.id, organizationId), eq(organizations.status, organization.status))).returning();
  if (!updated) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);
  await recordAudit({ actorUserId, organizationId, action: "organization_status_changed", resource: "organization", resourceId: organizationId, metadata: { from: organization.status, to: status } });
  return updated;
}

export async function listProvisioningJobs() {
  await authorizePlatform(PLATFORM_PERMISSIONS.provisioningView);
  return db.select({ job: provisioningJobs, organization: { id: organizations.id, name: organizations.name, slug: organizations.slug } }).from(provisioningJobs).innerJoin(organizations, eq(provisioningJobs.organizationId, organizations.id)).orderBy(desc(provisioningJobs.createdAt));
}

export async function retryProvisioning(organizationId: string, actorUserId: string) {
  await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.provisioningManage, action: "provisioning_retry" });
  const job = await db.query.provisioningJobs.findFirst({ where: eq(provisioningJobs.organizationId, organizationId) });
  if (!job) throw new AppError("PROVISIONING_FAILED", "Provisioning job was not found.", 404);
  if (job.status === "completed") throw new AppError("PROVISIONING_FAILED", "Completed provisioning jobs cannot be retried.", 409);
  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId) });
  if (!organization?.contactEmail) throw new AppError("PROVISIONING_FAILED", "A primary administrator email is required to retry provisioning.", 400);
  const result = await runProvisioning(organizationId, organization.contactEmail, actorUserId);
  await recordAudit({ actorUserId, organizationId, action: "provisioning_retried", resource: "provisioning_job", resourceId: job.id });
  return result;
}

export async function listPlatformUsers() {
  await authorizePlatform(PLATFORM_PERMISSIONS.userView);
  return db.select({ id: users.id, email: users.email, fullName: users.fullName, status: users.status, platformRole: users.platformRole, createdAt: users.createdAt }).from(users).where(ne(users.platformRole, "NONE")).orderBy(desc(users.createdAt));
}

export async function changePlatformRole(targetUserId: string, nextRole: string, actorUserId: string) {
  const actor = await authorizePlatform(PLATFORM_PERMISSIONS.userManage);
  const role = platformRoleSchema.parse(nextRole);
  if (!hasPlatformPermission(actor.platformRole, PLATFORM_PERMISSIONS.userManage)) throw new AppError("FORBIDDEN", "Platform user management permission is required.", 403);
  const target = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });
  if (!target) throw new AppError("NOT_FOUND", "Platform user was not found.", 404);
  const authority = ["PLATFORM_OWNER", "PRODUCT_OWNER"];
  if (!authority.includes(actor.platformRole) && (authority.includes(role) || authority.includes(target.platformRole))) throw new AppError("FORBIDDEN", "This role change exceeds your platform authority.", 403);
  if (authority.includes(target.platformRole) && !authority.includes(role)) {
    const [{ owners }] = await db.select({ owners: count() }).from(users).where(or(eq(users.platformRole, "PLATFORM_OWNER"), eq(users.platformRole, "PRODUCT_OWNER")));
    if (owners <= 1) throw new AppError("LAST_PLATFORM_OWNER", "The last high-authority platform user cannot be removed.", 409);
  }
  const [updated] = await db.update(users).set({ platformRole: role, updatedAt: new Date() }).where(eq(users.id, targetUserId)).returning();
  await recordAudit({ actorUserId, action: "platform_role_changed", resource: "user", resourceId: targetUserId, metadata: { from: target.platformRole, to: role } });
  return updated;
}

export async function listPlatformAudit() {
  await authorizePlatform(PLATFORM_PERMISSIONS.auditView);
  return db.select({ audit: auditLogs, actor: { id: users.id, name: users.fullName, email: users.email } }).from(auditLogs).leftJoin(users, eq(auditLogs.actorUserId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(200);
}
