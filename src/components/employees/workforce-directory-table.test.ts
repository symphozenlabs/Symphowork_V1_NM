import { describe, expect, it, vi } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { WorkforceDirectoryTable, type DirectoryEmployee } from "./workforce-directory-table";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/app/employees",
  useSearchParams: () => new URLSearchParams(),
}));

describe("WorkforceDirectoryTable component", () => {
  const mockEmployees: DirectoryEmployee[] = [
    {
      id: "emp-1",
      organizationId: "org-1",
      userId: "user-1",
      employeeId: "EMP0001",
      firstName: "Naresh",
      lastName: "Kumar",
      displayName: "Naresh Kumar",
      workEmail: "contact@nareshtechnologies.example",
      personalEmail: null,
      status: "active",
      roleKey: "ORGANIZATION_OWNER",
      roleTitle: "Organization Owner",
      joiningDate: "2026-01-15",
    },
    {
      id: "emp-2",
      organizationId: "org-1",
      userId: "user-2",
      employeeId: "EMP0002",
      firstName: "Priya",
      lastName: "Sharma",
      displayName: "Priya Sharma",
      workEmail: "priya@example.com",
      personalEmail: null,
      status: "active",
      roleKey: "HR_ADMIN",
      roleTitle: "HR Admin",
      joiningDate: "2026-02-01",
    },
    {
      id: "emp-3",
      organizationId: "org-1",
      userId: null,
      employeeId: "EMP0003",
      firstName: "Rohan",
      lastName: "Verma",
      displayName: "Rohan Verma",
      workEmail: null,
      personalEmail: "rohan@example.com",
      status: "invited",
      roleKey: "EMPLOYEE",
      roleTitle: "Employee",
      joiningDate: null,
    },
  ];

  it("renders Role column header and authoritative role badges", () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 3,
        initialPage: 1,
        initialPageSize: 25,
        canInvite: true,
      })
    );

    // 1. Column header check
    expect(html).toContain("<th class=\"px-4 py-3\">Role</th>");

    // 2. Authoritative role badges
    expect(html).toContain("Organization Owner");
    expect(html).toContain("HR Admin");
    expect(html).toContain("Employee");

    // 3. Employee ID and details
    expect(html).toContain("EMP0001");
    expect(html).toContain("EMP0002");
    expect(html).toContain("EMP0003");
    expect(html).toContain("Naresh Kumar");
    expect(html).toContain("Priya Sharma");
    expect(html).toContain("Rohan Verma");
  });

  it("renders search input with clear placeholder and role search support", () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 3,
        initialPage: 1,
        initialPageSize: 25,
        canInvite: true,
      })
    );

    expect(html).toContain("Search people by name, email, employee ID, or role…");
    expect(html).toContain("aria-label=\"Search directory by name, email, employee ID, or role\"");
  });

  it("renders customized pagination showing range and page size selector", () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 42,
        initialPage: 1,
        initialPageSize: 10,
        canInvite: true,
      })
    );

    expect(html).toContain("Showing <strong class=\"font-semibold text-foreground\">1</strong> to <strong class=\"font-semibold text-foreground\">10</strong> of <strong class=\"font-semibold text-foreground\">42</strong> people");
    expect(html).toContain("aria-label=\"Workforce pagination\"");
    expect(html).toContain("10 per page");
    expect(html).toContain("25 per page");
    expect(html).toContain("50 per page");
  });

  it("renders neutral fallback badge when role is unavailable", () => {
    const legacyEmployees: DirectoryEmployee[] = [
      {
        id: "emp-legacy",
        organizationId: "org-1",
        userId: null,
        employeeId: "EMP9999",
        firstName: "Legacy",
        lastName: "Record",
        displayName: "Legacy Record",
        workEmail: "legacy@example.com",
        personalEmail: null,
        status: "active",
        roleKey: null,
        roleTitle: null,
        joiningDate: null,
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: legacyEmployees,
        initialTotal: 1,
        initialPage: 1,
        initialPageSize: 10,
        canInvite: false,
      })
    );

    expect(html).toContain("Unassigned");
    expect(html).toContain("bg-slate-50 text-slate-500 border-slate-200");
  });

  it("disables profile navigation on self row for HR Admin and renders tooltip and non-clickable styling", () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 3,
        initialPage: 1,
        initialPageSize: 25,
        canInvite: true,
        currentUserId: "user-2",
        currentUserRole: "HR_ADMIN",
      })
    );

    // Self row (emp-2 / Priya Sharma) MUST NOT be a Link / anchor
    expect(html).not.toContain('href="/app/employees/emp-2"');
    expect(html).toContain('title="This is your own profile."');
    expect(html).toContain("cursor-default");
    expect(html).toContain("Priya Sharma");
    expect(html).toContain("You");

    // Other employee row (emp-1 / Naresh Kumar) MUST remain an active Link
    expect(html).toContain('href="/app/employees/emp-1"');
    expect(html).toContain("Naresh Kumar");
  });

  it("preserves active profile navigation for ORGANIZATION_OWNER on their own row", () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 3,
        initialPage: 1,
        initialPageSize: 25,
        canInvite: true,
        currentUserId: "user-1",
        currentUserRole: "ORGANIZATION_OWNER",
      })
    );

    // Organization owner's row (emp-1 / user-1) remains fully navigable
    expect(html).toContain('href="/app/employees/emp-1"');
    expect(html).toContain("Naresh Kumar");
  });

  it("ensures keyboard navigation cannot trigger profile navigation on self row", () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 3,
        initialPage: 1,
        initialPageSize: 25,
        canInvite: true,
        currentUserId: "user-2",
        currentUserRole: "HR_ADMIN",
      })
    );

    // Self-row Priya Sharma is rendered inside a span, not an interactive link
    expect(html).toContain('<span class="block font-semibold text-foreground text-sm cursor-default" title="This is your own profile." aria-label="Priya Sharma (This is your own profile)">Priya Sharma<span class="ml-2 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">You</span></span>');
  });

  it("protects Organization Owner account invitation actions when viewed by HR Admin", () => {
    const html = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 3,
        initialPage: 1,
        initialPageSize: 25,
        canInvite: true,
        currentUserId: "user-2",
        currentUserRole: "HR_ADMIN",
      })
    );

    // Organization Owner row has "Protected" in invitation column
    expect(html).toContain('<span class="text-xs text-muted font-medium">Protected</span>');

    // Other employee row (emp-3) still has invitation action form/buttons
    expect(html).toContain("Resend invitation");
    expect(html).toContain("Revoke");
  });

  it("preserves invitation actions on owner record when viewed by Organization Owner or Platform Owner", () => {
    // 1. Organization Owner viewer
    const ownerHtml = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 3,
        initialPage: 1,
        initialPageSize: 25,
        canInvite: true,
        currentUserId: "user-1",
        currentUserRole: "ORGANIZATION_OWNER",
      })
    );
    expect(ownerHtml).not.toContain('<span class="text-xs text-muted font-medium">Protected</span>');

    // 2. Platform Owner viewer
    const platformHtml = renderToStaticMarkup(
      React.createElement(WorkforceDirectoryTable, {
        initialEmployees: mockEmployees,
        initialTotal: 3,
        initialPage: 1,
        initialPageSize: 25,
        canInvite: true,
        currentUserRole: null,
        isPlatformOwner: true,
      })
    );
    expect(platformHtml).not.toContain('<span class="text-xs text-muted font-medium">Protected</span>');
  });
});

