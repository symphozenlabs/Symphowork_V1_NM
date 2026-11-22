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
      { label: "Subscriptions", href: "/platform/subscriptions", iconKey: "subscriptions" },
      { label: "Usage", href: "/platform/usage", iconKey: "usage" },
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

