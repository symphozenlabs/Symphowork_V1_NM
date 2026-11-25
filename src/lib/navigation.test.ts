import { describe, expect, it } from "vitest";
import { isRouteActive } from "$lib/navigation";
import { platformItemsForRole, platformNavGroups } from "$lib/components/layout/platform-navigation";

describe("isRouteActive utility", () => {
  it("uses one combined subscriptions and usage item that stays active on the canonical route", () => {
    const items = platformNavGroups.flatMap((group) => group.items);
    expect(items.filter((item) => item.href === "/platform/subscriptions")).toEqual([
      { label: "Subscriptions & Usage", href: "/platform/subscriptions", iconKey: "subscriptions" },
    ]);
    expect(items.some((item) => item.label === "Subscriptions" || item.label === "Usage")).toBe(false);
    const hrefs = items.map((item) => item.href);
    expect(isRouteActive("/platform/subscriptions", "/platform/subscriptions", hrefs)).toBe(true);
    expect(isRouteActive("/platform/usage", "/platform/subscriptions", hrefs)).toBe(false);
  });

  it("shows the audit navigation item only to platform and product owners", () => {
    const allowed = ["PLATFORM_OWNER", "PRODUCT_OWNER"];
    const denied = ["PLATFORM_ADMIN", "PLATFORM_SUPPORT", "PLATFORM_BILLING", "ORGANIZATION_OWNER", "HR_ADMIN", "HR_EXECUTIVE", "FINANCE_ADMIN", "MANAGER", "TEAM_LEAD", "PROJECT_MANAGER", "RECRUITER", "EMPLOYEE"];
    for (const role of allowed) expect(platformItemsForRole(role).some((item) => item.href === "/platform/audit")).toBe(true);
    for (const role of denied) expect(platformItemsForRole(role).some((item) => item.href === "/platform/audit")).toBe(false);
  });

  it("restricts navigation items exclusively for PLATFORM_BILLING", () => {
    const billingItems = platformItemsForRole("PLATFORM_BILLING");
    const billingHrefs = billingItems.map((item) => item.href);

    expect(billingHrefs).toEqual([
      "/platform",
      "/platform/organizations",
      "/platform/plans",
      "/platform/subscriptions",
      "/platform/analytics",
    ]);

    expect(billingHrefs).not.toContain("/platform/provisioning");
    expect(billingHrefs).not.toContain("/platform/support");
    expect(billingHrefs).not.toContain("/platform/health");
    expect(billingHrefs).not.toContain("/platform/configuration");
    expect(billingHrefs).not.toContain("/platform/users");
    expect(billingHrefs).not.toContain("/platform/audit");
    expect(billingHrefs).not.toContain("/platform/features");
  });

  it("preserves navigation for PLATFORM_ADMIN, PLATFORM_SUPPORT, PLATFORM_OWNER, PRODUCT_OWNER", () => {
    const ownerHrefs = platformItemsForRole("PLATFORM_OWNER").map((i) => i.href);
    expect(ownerHrefs).toContain("/platform/provisioning");
    expect(ownerHrefs).toContain("/platform/support");
    expect(ownerHrefs).toContain("/platform/audit");

    const supportHrefs = platformItemsForRole("PLATFORM_SUPPORT").map((i) => i.href);
    expect(supportHrefs).toContain("/platform/provisioning");
    expect(supportHrefs).toContain("/platform/support");
    expect(supportHrefs).toContain("/platform/health");
    expect(supportHrefs).not.toContain("/platform/audit");
  });

  const workspaceHrefs = [
    "/app",
    "/app/employees",
    "/app/attendance",
    "/app/leave",
    "/app/approvals",
    "/app/expenses",
    "/app/payroll",
    "/app/payroll/payslips",
    "/app/recruitment",
    "/app/work",
    "/app/chat",
    "/app/settings/billing",
    "/app/reports",
    "/app/settings",
    "/app/settings/workflows",
  ];

  it("handles empty or null currentPath safely", () => {
    expect(isRouteActive(null, "/app", workspaceHrefs)).toBe(false);
    expect(isRouteActive(undefined, "/app", workspaceHrefs)).toBe(false);
    expect(isRouteActive("", "/app", workspaceHrefs)).toBe(false);
  });

  it("matches root overview only on exact path", () => {
    expect(isRouteActive("/app", "/app", workspaceHrefs)).toBe(true);
    expect(isRouteActive("/app/employees", "/app", workspaceHrefs)).toBe(false);
    expect(isRouteActive("/app/settings", "/app", workspaceHrefs)).toBe(false);
  });

  it("matches top-level module routes on exact match", () => {
    expect(isRouteActive("/app/employees", "/app/employees", workspaceHrefs)).toBe(true);
    expect(isRouteActive("/app/attendance", "/app/attendance", workspaceHrefs)).toBe(true);
    expect(isRouteActive("/app/leave", "/app/leave", workspaceHrefs)).toBe(true);
  });

  it("matches nested dynamic subpaths to their parent module when no more specific item exists", () => {
    expect(isRouteActive("/app/employees/emp-101", "/app/employees", workspaceHrefs)).toBe(true);
    expect(isRouteActive("/app/employees/emp-101/edit", "/app/employees", workspaceHrefs)).toBe(true);
    expect(isRouteActive("/app/attendance/calendar", "/app/attendance", workspaceHrefs)).toBe(true);
  });

  it("disambiguates conflicting routes like payroll vs payslips", () => {
    // When on /app/payroll: only payroll is active
    expect(isRouteActive("/app/payroll", "/app/payroll", workspaceHrefs)).toBe(true);
    expect(isRouteActive("/app/payroll", "/app/payroll/payslips", workspaceHrefs)).toBe(false);

    // When on /app/payroll/payslips: only payslips is active, NOT payroll
    expect(isRouteActive("/app/payroll/payslips", "/app/payroll", workspaceHrefs)).toBe(false);
    expect(isRouteActive("/app/payroll/payslips", "/app/payroll/payslips", workspaceHrefs)).toBe(true);

    // When on a deep payslip subpath: only payslips is active
    expect(isRouteActive("/app/payroll/payslips/2026-03", "/app/payroll", workspaceHrefs)).toBe(false);
    expect(isRouteActive("/app/payroll/payslips/2026-03", "/app/payroll/payslips", workspaceHrefs)).toBe(true);
  });

  it("disambiguates nested settings routes like organization settings vs workflows and billing", () => {
    // When on /app/settings: only organization settings is active
    expect(isRouteActive("/app/settings", "/app/settings", workspaceHrefs)).toBe(true);
    expect(isRouteActive("/app/settings", "/app/settings/workflows", workspaceHrefs)).toBe(false);
    expect(isRouteActive("/app/settings", "/app/settings/billing", workspaceHrefs)).toBe(false);

    // When on /app/settings/workflows: only workflow settings is active, NOT organization settings
    expect(isRouteActive("/app/settings/workflows", "/app/settings", workspaceHrefs)).toBe(false);
    expect(isRouteActive("/app/settings/workflows", "/app/settings/workflows", workspaceHrefs)).toBe(true);

    // When on /app/settings/billing: only billing is active, NOT organization settings
    expect(isRouteActive("/app/settings/billing", "/app/settings", workspaceHrefs)).toBe(false);
    expect(isRouteActive("/app/settings/billing", "/app/settings/billing", workspaceHrefs)).toBe(true);

    // Deep subpath under settings without its own nav item falls back to settings
    expect(isRouteActive("/app/settings/profile", "/app/settings", workspaceHrefs)).toBe(true);
    expect(isRouteActive("/app/settings/profile", "/app/settings/workflows", workspaceHrefs)).toBe(false);
  });

  it("handles platform routes correctly", () => {
    const platformHrefs = [
      "/platform",
      "/platform/organizations",
      "/platform/plans",
      "/platform/users",
    ];

    expect(isRouteActive("/platform", "/platform", platformHrefs)).toBe(true);
    expect(isRouteActive("/platform/organizations", "/platform", platformHrefs)).toBe(false);
    expect(isRouteActive("/platform/organizations", "/platform/organizations", platformHrefs)).toBe(true);
    expect(isRouteActive("/platform/organizations/org-42", "/platform/organizations", platformHrefs)).toBe(true);
  });
});
