export const PLATFORM_PERMISSIONS = { organizationView: "platform.organization.view", organizationCreate: "platform.organization.create", organizationEdit: "platform.organization.edit", organizationSuspend: "platform.organization.suspend", provisioningView: "platform.provisioning.view", provisioningManage: "platform.provisioning.manage", planView: "platform.plan.view", planManage: "platform.plan.manage", subscriptionView: "platform.subscription.view", subscriptionManage: "platform.subscription.manage", billingView: "platform.billing.view", billingManage: "platform.billing.manage", entitlementView: "platform.entitlement.view", entitlementManage: "platform.entitlement.manage", usageView: "platform.usage.view", analyticsView: "platform.analytics.view", userView: "platform.user.view", userManage: "platform.user.manage", supportView: "platform.support.view", supportManage: "platform.support.manage", featureView: "platform.feature.view", featureManage: "platform.feature.manage", systemHealthView: "platform.system_health.view", auditView: "platform.audit.view", configurationView: "platform.configuration.view", configurationManage: "platform.configuration.manage" } as const;
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[keyof typeof PLATFORM_PERMISSIONS];
const all = new Set(Object.values(PLATFORM_PERMISSIONS));
const rolePermissions: Record<string, Set<string>> = { PLATFORM_OWNER: all, PRODUCT_OWNER: all, PLATFORM_ADMIN: new Set([...all].filter((permission) => !permission.includes("billing"))), PLATFORM_SUPPORT: new Set([PLATFORM_PERMISSIONS.organizationView, PLATFORM_PERMISSIONS.provisioningView, PLATFORM_PERMISSIONS.supportView, PLATFORM_PERMISSIONS.systemHealthView, PLATFORM_PERMISSIONS.auditView, PLATFORM_PERMISSIONS.planView, PLATFORM_PERMISSIONS.subscriptionView, PLATFORM_PERMISSIONS.entitlementView, PLATFORM_PERMISSIONS.usageView, PLATFORM_PERMISSIONS.billingView]), PLATFORM_BILLING: new Set([PLATFORM_PERMISSIONS.organizationView, PLATFORM_PERMISSIONS.planView, PLATFORM_PERMISSIONS.planManage, PLATFORM_PERMISSIONS.subscriptionView, PLATFORM_PERMISSIONS.subscriptionManage, PLATFORM_PERMISSIONS.billingView, PLATFORM_PERMISSIONS.billingManage, PLATFORM_PERMISSIONS.entitlementView, PLATFORM_PERMISSIONS.entitlementManage, PLATFORM_PERMISSIONS.usageView]) };
export function hasPlatformPermission(role: string, permission: PlatformPermission) { return rolePermissions[role]?.has(permission) ?? false; }

export function platformRoleLabel(role: string) { return role.replaceAll("_", " "); }

export const PLATFORM_ROLE_CONSOLE_TITLES: Record<string, string> = {
  PLATFORM_OWNER: "Platform Owner Console",
  PRODUCT_OWNER: "Product Owner Console",
  PLATFORM_ADMIN: "Platform Admin Console",
  PLATFORM_SUPPORT: "Platform Support Console",
  PLATFORM_BILLING: "Platform Billing Console",
};

export function platformConsoleTitle(role?: string | null): string {
  if (!role) return "Platform Console";
  return PLATFORM_ROLE_CONSOLE_TITLES[role] ?? "Platform Console";
}
