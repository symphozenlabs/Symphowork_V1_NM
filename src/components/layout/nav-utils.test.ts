import { describe, expect, it } from "vitest";
import { isRouteActive } from "./nav-utils";

describe("isRouteActive utility", () => {
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
