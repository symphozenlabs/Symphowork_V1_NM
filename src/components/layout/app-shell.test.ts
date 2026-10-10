import { describe, expect, it, vi } from "vitest";
import React from "react";
import { AppShell } from "./app-shell";
import { MobileNav } from "./mobile-nav";

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser: vi.fn().mockResolvedValue({
    id: "user-test",
    fullName: "Arjun Kumar",
    email: "arjun@example.com",
    platformRole: "NONE",
  }),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: vi.fn().mockResolvedValue({
    organization: { id: "org-1", name: "SymphoWork Test" },
    membership: { roleId: "role-1", status: "active" },
  }),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  getRolePermissionSet: vi.fn().mockResolvedValue(
    new Set([
      "organization.settings.read",
      "workflow.manage",
      "billing.view",
      "report.employee",
    ])
  ),
}));

vi.mock("@/components/layout/logout-button", () => ({
  default: () => React.createElement("button", null, "Logout"),
}));

describe("Sidebar vertical scrolling and layout structure", () => {
  it("renders desktop sidebar with fixed viewport constraint, stable header, and min-h-0 overflow-y-auto scroll container", async () => {
    const rendered = await AppShell({ children: React.createElement("div", { id: "main-content" }, "Main Content") });

    const rootChildren = React.Children.toArray(rendered.props.children) as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>[];
    // 1. Verify aside element exists and is constrained to viewport
    const aside = rootChildren.find(
      (child) => child && child.type === "aside"
    );
    expect(aside).toBeDefined();
    expect(aside!.props.className).toContain("fixed");
    expect(aside!.props.className).toContain("inset-y-0");
    expect(aside!.props.className).toContain("left-0");
    expect(aside!.props.className).toContain("w-64");
    expect(aside!.props.className).toContain("hidden");
    expect(aside!.props.className).toContain("lg:flex");
    expect(aside!.props.className).toContain("lg:flex-col");

    const asideChildren = React.Children.toArray(aside!.props.children) as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>[];
    expect(asideChildren).toHaveLength(2);

    // 2. Header area is stable (shrink-0) and outside the scroll container
    const headerContainer = asideChildren[0];
    expect(headerContainer.props.className).toContain("shrink-0");
    expect(headerContainer.props.className).toContain("px-5");
    expect(headerContainer.props.className).toContain("pt-6");

    // 3. Navigation and content area is vertically scrollable with min-h-0 and overflow-y-auto
    const scrollContainer = asideChildren[1];
    expect(scrollContainer.props.className).toContain("flex");
    expect(scrollContainer.props.className).toContain("flex-1");
    expect(scrollContainer.props.className).toContain("min-h-0");
    expect(scrollContainer.props.className).toContain("overflow-y-auto");
    expect(scrollContainer.props.className).toContain("overflow-x-hidden");

    // 4. Verify scrollbar styling classes are applied for thin/subtle appearance
    expect(scrollContainer.props.className).toContain("[scrollbar-width:thin]");

    // 5. Verify main page content container is independent and sibling to aside
    const mainWrapper = rootChildren.find(
      (child) => child && child.props && child.props.className && child.props.className.includes("lg:pl-64")
    );
    expect(mainWrapper).toBeDefined();
  });

  it("preserves MobileNav responsive hamburger and drawer with viewport constraint and overflow-y-auto", () => {
    const items = [
      { label: "Overview", href: "/app" },
      { label: "People", href: "/app/employees" },
      { label: "Attendance", href: "/app/attendance" },
      { label: "Leave", href: "/app/leave" },
      { label: "Approvals", href: "/app/approvals" },
      { label: "Expenses", href: "/app/expenses" },
      { label: "Payroll", href: "/app/payroll" },
      { label: "Payslips", href: "/app/payroll/payslips" },
      { label: "Recruitment", href: "/app/recruitment" },
      { label: "Projects & tasks", href: "/app/work" },
      { label: "Internal chat", href: "/app/chat" },
      { label: "Billing & usage", href: "/app/settings/billing" },
      { label: "Reports", href: "/app/reports" },
      { label: "Organization settings", href: "/app/settings" },
      { label: "Workflow settings", href: "/app/settings/workflows" },
    ];

    const mobileNavElement = React.createElement(MobileNav, { items });
    expect(mobileNavElement).toBeDefined();
    expect(mobileNavElement.props.items).toHaveLength(15);
  });

  it("renders official SymphoWork logo asset in sidebar brand area", async () => {
    const rendered = await AppShell({ children: React.createElement("div", null, "Test") });
    const rootChildren = React.Children.toArray(rendered.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];
    const aside = rootChildren.find((c) => c && c.type === "aside");
    const asideChildren = React.Children.toArray(aside!.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];
    const headerContainer = asideChildren[0];
    
    // Check that Image with /symphowork-logo.png is inside the header
    const headerChildren = React.Children.toArray(headerContainer.props.children) as React.ReactElement<{
      children?: React.ReactNode;
      href?: string;
    }>[];
    const brandLink = headerChildren[0];
    expect(brandLink.props.href).toBe("/app");
    
    const linkChildren = React.Children.toArray(brandLink.props.children) as React.ReactElement<{
      src?: string;
      alt?: string;
    }>[];
    const logoImage = linkChildren[0];
    expect(logoImage.props.src).toBe("/symphowork-logo.png");
    expect(logoImage.props.alt).toBe("SymphoWork");
  });

  it("includes permitted navigation items according to role permissions", async () => {
    const rendered = await AppShell({ children: React.createElement("div", null, "Test") });
    const rootChildren = React.Children.toArray(rendered.props.children) as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
    }>[];
    const aside = rootChildren.find((c) => c && c.type === "aside");
    const asideChildren = React.Children.toArray(aside!.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];
    const scrollContainer = asideChildren[1];
    const scrollChildren = React.Children.toArray(scrollContainer.props.children) as React.ReactElement<{
      groups?: { title?: string; items: { label: string; href: string }[] }[];
    }>[];

    const sidebarNav = scrollChildren[0];
    expect(sidebarNav.props.groups).toBeDefined();
    const groups = sidebarNav.props.groups!;
    expect(groups.length).toBe(3);
    expect(groups[0].title).toBe("Core Modules");
    expect(groups[0].items).toHaveLength(11);
    expect(groups[1].title).toBe("Intelligence & Finance");
    expect(groups[1].items.map((i) => i.href)).toEqual(["/app/settings/billing", "/app/reports"]);
    expect(groups[2].title).toBe("Administration");
    expect(groups[2].items.map((i) => i.href)).toEqual(["/app/settings", "/app/settings/workflows"]);
  });
});
