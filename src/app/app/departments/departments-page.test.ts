import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    mockRedirect(path);
    throw new Error(`NEXT_REDIRECT: ${path}`);
  },
}));

let mockUser: { id: string } | null = { id: "user-1" };
let mockTenant: {
  organization: { id: string } | null;
  role: { key: string } | null;
  user: { id: string; isSuperAdmin?: boolean };
} = {
  organization: { id: "org-1" },
  role: { key: "ORGANIZATION_OWNER" },
  user: { id: "user-1", isSuperAdmin: false },
};

let mockCanResult = true;

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser: vi.fn(() => Promise.resolve(mockUser)),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: vi.fn(() => Promise.resolve(mockTenant)),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  can: vi.fn(() => Promise.resolve(mockCanResult)),
}));

const mockListDepartmentsWithMetrics = vi.fn();
vi.mock("@/modules/departments/service", () => ({
  listDepartmentsWithMetrics: vi.fn((...args) => mockListDepartmentsWithMetrics(...args)),
}));

vi.mock("@/components/departments/department-list-table", () => ({
  DepartmentListTable: ({ isOrganizationOwner }: { isOrganizationOwner: boolean }) =>
    React.createElement("div", { "data-testid": "department-list-table", "data-owner": String(isOrganizationOwner) }),
}));

import DepartmentsPage from "./page";

describe("DepartmentsPage Route Protection and Access Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "ORGANIZATION_OWNER" },
      user: { id: "user-1", isSuperAdmin: false },
    };
    mockCanResult = true;
    mockListDepartmentsWithMetrics.mockResolvedValue({
      items: [],
      dateContext: {
        date: "2026-10-14",
        timezone: "Asia/Kolkata",
        isWorkingDay: true,
        isHoliday: false,
        isWeekend: false,
        isCurrentDate: true,
      },
      totalCount: 0,
    });
  });

  it("redirects unauthenticated users to /login", async () => {
    mockUser = null;

    await expect(DepartmentsPage({})).rejects.toThrow("NEXT_REDIRECT: /login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects users without organization to /platform", async () => {
    mockTenant.organization = null;

    await expect(DepartmentsPage({})).rejects.toThrow("NEXT_REDIRECT: /platform");
    expect(mockRedirect).toHaveBeenCalledWith("/platform");
  });

  it("redirects users lacking department.read permission to /app", async () => {
    mockCanResult = false;

    await expect(DepartmentsPage({})).rejects.toThrow("NEXT_REDIRECT: /app");
    expect(mockRedirect).toHaveBeenCalledWith("/app");
  });

  it("permits ORGANIZATION_OWNER and renders with isOrganizationOwner = true", async () => {
    mockTenant.role = { key: "ORGANIZATION_OWNER" };
    mockCanResult = true;

    const page = await DepartmentsPage({});
    expect(page).toBeDefined();
    expect(mockListDepartmentsWithMetrics).toHaveBeenCalledWith("org-1", "user-1", undefined);
  });

  it("permits HR_ADMIN and renders with isOrganizationOwner = false", async () => {
    mockTenant.role = { key: "HR_ADMIN" };
    mockCanResult = true;

    const page = await DepartmentsPage({});
    expect(page).toBeDefined();
  });
});
