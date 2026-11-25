import type {NavGroupDef} from './navigation';
export const platformNavGroups: NavGroupDef[] = [
  {
    items: [
      { label: "Overview", href: "/platform", iconKey: "overview" },
    ],
  },
  {
    title: "Tenants & Plans",
    items: [
      { label: "Organizations", href: "/platform/organizations", iconKey: "organizations" },
      { label: "Provisioning", href: "/platform/provisioning", iconKey: "provisioning" },
      { label: "Plans", href: "/platform/plans", iconKey: "plans" },
      { label: "Subscriptions & Usage", href: "/platform/subscriptions", iconKey: "subscriptions" },
    ],
  },
  {
    title: "Operations & Governance",
    items: [
      { label: "Analytics", href: "/platform/analytics", iconKey: "analytics" },
      { label: "Features", href: "/platform/features", iconKey: "features" },
      { label: "Support", href: "/platform/support", iconKey: "support" },
      { label: "Health", href: "/platform/health", iconKey: "health" },
      { label: "Configuration", href: "/platform/configuration", iconKey: "configuration" },
      { label: "Platform users", href: "/platform/users", iconKey: "users" },
      { label: "Audit", href: "/platform/audit", iconKey: "audit" },
    ],
  },
];

export const allPlatformItems = platformNavGroups.flatMap((group) =>
  group.items.map(({ label, href }) => ({ label, href }))
);

export const PLATFORM_BILLING_ALLOWED_PATHS = new Set([
  "/platform",
  "/platform/organizations",
  "/platform/plans",
  "/platform/subscriptions",
  "/platform/analytics",
]);

export function platformNavigationForRole(role: string) {
  if (role === "PLATFORM_OWNER" || role === "PRODUCT_OWNER") return platformNavGroups;
  if (role === "PLATFORM_BILLING") {
    return platformNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => PLATFORM_BILLING_ALLOWED_PATHS.has(item.href)),
      }))
      .filter((group) => group.items.length > 0);
  }
  return platformNavGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.href !== "/platform/audit") }))
    .filter((group) => group.items.length > 0);
}

export function platformItemsForRole(role: string) {
  return platformNavigationForRole(role).flatMap((group) =>
    group.items.map(({ label, href }) => ({ label, href }))
  );
}

