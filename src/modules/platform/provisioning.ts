import { and, eq } from "drizzle-orm";
import { withPlatformTransaction } from "@/db/client";
import { auditLogs, invitations, organizations, permissions, plans, provisioningJobs, rolePermissions, roles, subscriptions } from "@/db/schema";
import { createOpaqueToken, hashToken } from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { ALL_PERMISSION_KEYS, ROLE_PERMISSIONS, SYSTEM_ROLES } from "@/modules/rbac/permissions";
import type { OrganizationInput } from "@/modules/platform/validation";

export async function createOrganization(input: OrganizationInput, actorUserId: string) {
  const result = await withPlatformTransaction(async (tx) => {
    const slug = input.slug.trim().toLowerCase();
    const existing = await tx.query.organizations.findFirst({ where: eq(organizations.slug, slug) });
    if (existing) throw new AppError("ORG_ALREADY_EXISTS", "An organization with this slug already exists.", 409);

    const ownerEmail = (input.ownerEmail?.trim() || input.contactEmail?.trim())?.toLowerCase();
    if (!ownerEmail) {
      throw new AppError("VALIDATION_ERROR", "Organization owner email is required.", 400);
    }

    // Official contact email falls back to ownerEmail if left blank
    const contactEmail = (input.contactEmail?.trim() || ownerEmail).toLowerCase();

    // Verify selected plan if provided
    let planId = input.planId?.trim() ? input.planId : undefined;
    if (planId) {
      const selectedPlan = await tx.query.plans.findFirst({
        where: and(eq(plans.id, planId), eq(plans.active, true)),
      });
      if (!selectedPlan) {
        throw new AppError("VALIDATION_ERROR", "Selected plan does not exist or is inactive.", 400);
      }
    } else {
      // Default to active FREE plan if available
      const freePlan = await tx.query.plans.findFirst({
        where: and(eq(plans.code, "FREE"), eq(plans.active, true)),
      });
      if (freePlan) {
        planId = freePlan.id;
      }
    }

    const [organization] = await tx
      .insert(organizations)
      .values({
        name: input.name.trim(),
        legalName: input.legalName?.trim() || input.name.trim(),
        slug,
        website: input.website?.trim() || null,
        contactEmail,
        contactPhone: input.contactPhone?.trim() || null,
        addressLine1: input.addressLine1?.trim() || null,
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        country: input.country?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        timezone: input.timezone.trim(),
        currency: input.currency.trim().toUpperCase(),
        dateFormat: input.dateFormat?.trim() || "dd/MM/yyyy",
        status: "pending",
      })
      .returning();

    // Insert pending subscription if plan is resolved
    if (planId) {
      await tx.insert(subscriptions).values({
        organizationId: organization.id,
        planId,
        status: "pending",
        billingCycle: input.billingCycle ?? "monthly",
      });
    }

    // Pre-insert pending owner invitation
    const initialInvitationToken = createOpaqueToken();
    await tx.insert(invitations).values({
      organizationId: organization.id,
      invitedEmail: ownerEmail,
      intendedRole: "ORGANIZATION_OWNER",
      tokenHash: hashToken(initialInvitationToken),
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
      status: "pending",
    });

    const [job] = await tx.insert(provisioningJobs).values({ organizationId: organization.id }).returning();
    await tx.insert(auditLogs).values({
      actorUserId,
      action: "organization_creation",
      resource: "organization",
      resourceId: organization.id,
      metadata: JSON.stringify({
        ownerEmail,
        ownerFullName: input.ownerFullName?.trim() || null,
        planId,
        billingCycle: input.billingCycle ?? "monthly",
      }),
    });
    return { organization, job };
  });
  return result;
}

export async function approveOrganization(organizationId: string, actorUserId: string) {
  const [organization] = await withPlatformTransaction((tx) => tx.update(organizations).set({ status: "active", updatedAt: new Date() }).where(and(eq(organizations.id, organizationId), eq(organizations.status, "pending"))).returning());
  if (!organization) throw new AppError("ORG_NOT_FOUND", "Pending organization was not found.", 404);
  await recordAudit({ actorUserId, action: "organization_approval", resource: "organization", resourceId: organizationId, platform: true });
  return organization;
}

export async function runProvisioning(organizationId: string, primaryAdminEmail: string, actorUserId?: string) {
  const initialJob = await withPlatformTransaction((tx) =>
    tx.query.provisioningJobs.findFirst({ where: eq(provisioningJobs.organizationId, organizationId) })
  );
  if (!initialJob) throw new AppError("PROVISIONING_FAILED", "Provisioning job was not found.", 404);
  if (initialJob.status === "completed") return { job: initialJob, invitationToken: undefined };

  // Stage 1: Mark job running & set step to roles
  await withPlatformTransaction((tx) =>
    tx.update(provisioningJobs)
      .set({ status: "running", currentStep: "roles", attempts: initialJob.attempts + 1, startedAt: initialJob.startedAt ?? new Date(), updatedAt: new Date() })
      .where(eq(provisioningJobs.id, initialJob.id))
  );

  // Stage 2: Create roles
  const roleByKey = await withPlatformTransaction(async (tx) => {
    const roleRows = await tx.select().from(roles).where(eq(roles.organizationId, organizationId));
    const map = new Map(roleRows.map((role) => [role.key, role]));
    for (const key of SYSTEM_ROLES.filter((candidate) => candidate !== "PLATFORM_OWNER")) {
      if (!map.has(key)) {
        const [role] = await tx.insert(roles).values({ organizationId, key, name: key.replaceAll("_", " "), isSystem: true }).returning();
        map.set(key, role);
      }
    }
    return map;
  });

  // Stage 3: Mark step to permissions and seed permissions
  await withPlatformTransaction((tx) =>
    tx.update(provisioningJobs).set({ currentStep: "permissions", updatedAt: new Date() }).where(eq(provisioningJobs.id, initialJob.id))
  );

  await withPlatformTransaction(async (tx) => {
    if (ALL_PERMISSION_KEYS.length > 0) {
      await tx.insert(permissions).values(ALL_PERMISSION_KEYS.map((key) => ({ key }))).onConflictDoNothing();
    }
    const permissionRows = await tx.select().from(permissions);
    const permissionByKey = new Map(permissionRows.map((permission) => [permission.key, permission]));
    const rolePermissionValues: Array<{ roleId: string; permissionId: string }> = [];
    for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roleByKey.get(roleKey);
      if (!role) continue;
      for (const permissionKey of permissionKeys) {
        const permission = permissionByKey.get(permissionKey);
        if (permission) {
          rolePermissionValues.push({ roleId: role.id, permissionId: permission.id });
        }
      }
    }
    if (rolePermissionValues.length > 0) {
      await tx.insert(rolePermissions).values(rolePermissionValues).onConflictDoNothing();
    }
  });

  // Stage 4: Mark step to subscription and activate or create subscription
  await withPlatformTransaction((tx) =>
    tx.update(provisioningJobs).set({ currentStep: "subscription", updatedAt: new Date() }).where(eq(provisioningJobs.id, initialJob.id))
  );

  await withPlatformTransaction(async (tx) => {
    const existingSubscription = await tx.query.subscriptions?.findFirst({
      where: eq(subscriptions.organizationId, organizationId),
    });
    if (existingSubscription) {
      await tx
        .update(subscriptions)
        .set({ status: "active", startsAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptions.id, existingSubscription.id));
    } else {
      let plan = await tx.query.plans.findFirst({ where: eq(plans.code, "FREE") });
      if (!plan) {
        [plan] = await tx.insert(plans).values({ code: "FREE", name: "Free", description: "Foundation plan" }).returning();
      }
      await tx.insert(subscriptions).values({ organizationId, planId: plan.id, status: "active", startsAt: new Date() }).onConflictDoNothing();
    }
  });

  // Stage 5: Mark step to primary_admin_invitation and create/refresh invitation
  await withPlatformTransaction((tx) =>
    tx.update(provisioningJobs).set({ currentStep: "primary_admin_invitation", updatedAt: new Date() }).where(eq(provisioningJobs.id, initialJob.id))
  );

  let invitationToken: string | undefined;
  const completed = await withPlatformTransaction(async (tx) => {
    const ownerRole = roleByKey.get("ORGANIZATION_OWNER");
    if (!ownerRole) throw new AppError("PROVISIONING_FAILED", "Owner role could not be initialized.", 500);
    const existingInvitation = await tx.query.invitations.findFirst({
      where: and(eq(invitations.organizationId, organizationId), eq(invitations.invitedEmail, primaryAdminEmail.toLowerCase()), eq(invitations.status, "pending"))
    });
    invitationToken = createOpaqueToken();
    if (!existingInvitation) {
      await tx.insert(invitations).values({
        organizationId,
        invitedEmail: primaryAdminEmail.toLowerCase(),
        intendedRole: ownerRole.key,
        tokenHash: hashToken(invitationToken),
        expiresAt: new Date(Date.now() + 7 * 86_400_000)
      });
    } else {
      await tx
        .update(invitations)
        .set({
          tokenHash: hashToken(invitationToken),
          expiresAt: new Date(Date.now() + 7 * 86_400_000),
          updatedAt: new Date(),
        })
        .where(eq(invitations.id, existingInvitation.id));
    }
    const [comp] = await tx.update(provisioningJobs)
      .set({ status: "completed", currentStep: "ready", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(provisioningJobs.id, initialJob.id))
      .returning();
    return comp;
  });

  await recordAudit({ actorUserId, organizationId, action: "provisioning_completed", resource: "provisioning_job", resourceId: initialJob.id, platform: true });
  return { job: completed, invitationToken };
}
