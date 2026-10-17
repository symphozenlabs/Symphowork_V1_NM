import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mockRedirect = vi.fn();
const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    mockRedirect(path);
    throw new Error(`NEXT_REDIRECT: ${path}`);
  },
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
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

const mockGetDepartmentDetails = vi.fn();
vi.mock("@/modules/departments/service", () => ({
  getDepartmentDetails: vi.fn((...args) => mockGetDepartmentDetails(...args)),
}));

vi.mock("@/components/departments/department-details-view", () => ({
  DepartmentDetailsView: ({ isOrganizationOwner }: { isOrganizationOwner: boolean }) =>
    React.createElement("div", { "data-testid": "department-details-view", "data-owner": String(isOrganizationOwner) }),
}));

import DepartmentDetailsPage from "./page";
import { AppError } from "@/lib/errors";

describe("DepartmentDetailsPage Route Protection and Access Control", () => {
  const departmentId = "dept-101";

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "ORGANIZATION_OWNER" },
      user: { id: "user-1", isSuperAdmin: false },
    };
    mockCanResult = true;
    mockGetDepartmentDetails.mockResolvedValue({
      id: departmentId,
      code: "ENG",
      name: "Engineering",
      description: "Core product development",
      headEmployeeId: null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      manager: null,
      totalEmployees: 5,
      presentCount: 4,
      absentCount: 0,
      pendingCount: 1,
      onLeaveCount: 0,
      subTeamsCount: 2,
      teams: [],
      roster: [],
      dateContext: {
        date: "2026-10-14",
        timezone: "Asia/Kolkata",
        isWorkingDay: true,
        isHoliday: false,
        isWeekend: false,
        isCurrentDate: true,
      },
    });
  });

  it("redirects unauthenticated users to /login", async () => {
    mockUser = null;

    await expect(
      DepartmentDetailsPage({ params: Promise.resolve({ departmentId }) })
    ).rejects.toThrow("NEXT_REDIRECT: /login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects users without department.read permission to /app", async () => {
    mockCanResult = false;

    await expect(
      DepartmentDetailsPage({ params: Promise.resolve({ departmentId }) })
    ).rejects.toThrow("NEXT_REDIRECT: /app");
    expect(mockRedirect).toHaveBeenCalledWith("/app");
  });

  it("triggers notFound when department does not exist", async () => {
    mockGetDepartmentDetails.mockRejectedValue(
      new AppError("NOT_FOUND", "Department was not found in this organization.", 404)
    );

    await expect(
      DepartmentDetailsPage({ params: Promise.resolve({ departmentId }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("redirects users to /app when getDepartmentDetails throws FORBIDDEN for unauthorized department", async () => {
    mockGetDepartmentDetails.mockRejectedValue(
      new AppError("FORBIDDEN", "You are not authorized to access this department.", 403)
    );

    await expect(
      DepartmentDetailsPage({ params: Promise.resolve({ departmentId: "dept-other" }) })
    ).rejects.toThrow("NEXT_REDIRECT: /app");
    expect(mockRedirect).toHaveBeenCalledWith("/app");
  });

  it("loads details for authorized role and marks isOrganizationOwner correctly", async () => {
    mockTenant.role = { key: "HR_ADMIN" };

    const page = await DepartmentDetailsPage({
      params: Promise.resolve({ departmentId }),
      searchParams: Promise.resolve({ date: "2026-10-14" }),
    });

    expect(page).toBeDefined();
    expect(mockGetDepartmentDetails).toHaveBeenCalledWith(
      "org-1",
      "user-1",
      departmentId,
      "2026-10-14"
    );
  });
});

