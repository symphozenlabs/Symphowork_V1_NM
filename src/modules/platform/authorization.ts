import { AppError } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const PLATFORM_PERMISSIONS = { organizationView: "platform.organization.view", organizationCreate: "platform.organization.create", organizationEdit: "platform.organization.edit", organizationSuspend: "platform.organization.suspend", provisioningView: "platform.provisioning.view", provisioningManage: "platform.provisioning.manage", planView: "platform.plan.view", planManage: "platform.plan.manage", subscriptionView: "platform.subscription.view", subscriptionManage: "platform.subscription.manage", billingView: "platform.billing.view", billingManage: "platform.billing.manage", entitlementView: "platform.entitlement.view", entitlementManage: "platform.entitlement.manage", usageView: "platform.usage.view", analyticsView: "platform.analytics.view", userView: "platform.user.view", userManage: "platform.user.manage", supportView: "platform.support.view", supportManage: "platform.support.manage", featureView: "platform.feature.view", featureManage: "platform.feature.manage", systemHealthView: "platform.system_health.view", auditView: "platform.audit.view", configurationView: "platform.configuration.view", configurationManage: "platform.configuration.manage" } as const;
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[keyof typeof PLATFORM_PERMISSIONS];
const all = new Set(Object.values(PLATFORM_PERMISSIONS));
const rolePermissions: Record<string, Set<string>> = { PLATFORM_OWNER: all, PRODUCT_OWNER: all, PLATFORM_ADMIN: new Set([...all].filter((permission) => !permission.includes("billing"))), PLATFORM_SUPPORT: new Set([PLATFORM_PERMISSIONS.organizationView, PLATFORM_PERMISSIONS.provisioningView, PLATFORM_PERMISSIONS.supportView, PLATFORM_PERMISSIONS.systemHealthView, PLATFORM_PERMISSIONS.auditView, PLATFORM_PERMISSIONS.planView, PLATFORM_PERMISSIONS.subscriptionView, PLATFORM_PERMISSIONS.entitlementView, PLATFORM_PERMISSIONS.usageView, PLATFORM_PERMISSIONS.billingView]), PLATFORM_BILLING: new Set([PLATFORM_PERMISSIONS.organizationView, PLATFORM_PERMISSIONS.planView, PLATFORM_PERMISSIONS.planManage, PLATFORM_PERMISSIONS.subscriptionView, PLATFORM_PERMISSIONS.subscriptionManage, PLATFORM_PERMISSIONS.billingView, PLATFORM_PERMISSIONS.billingManage, PLATFORM_PERMISSIONS.entitlementView, PLATFORM_PERMISSIONS.entitlementManage, PLATFORM_PERMISSIONS.usageView]) };
export function hasPlatformPermission(role: string, permission: PlatformPermission) { return rolePermissions[role]?.has(permission) ?? false; }
export async function authorizePlatform(permission: PlatformPermission) { const user = await requireSession(); if (user.platformRole === "NONE" || !hasPlatformPermission(user.platformRole, permission)) throw new AppError("FORBIDDEN", "Platform permission is required.", 403); return user; }
export async function authorizePlatformTargetOrganization(input: { organizationId: string; permission: PlatformPermission; action: string }) {
  const user = await authorizePlatform(input.permission);
  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, input.organizationId) });
  if (!organization) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);
  return { user, organization, action: input.action };
}
export function platformRoleLabel(role: string) { return role.replaceAll("_", " "); }
