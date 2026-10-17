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

let mockUser: { id: string } | null = { id: "user-hr-admin" };
let mockTenant: { organization: { id: string } | null; role: { key: string } | null } = {
  organization: { id: "org-1" },
  role: { key: "HR_ADMIN" },
};
let mockEmployeeRecord: Record<string, unknown> | null = null;

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser: vi.fn(() => Promise.resolve(mockUser)),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: vi.fn(() => Promise.resolve(mockTenant)),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  can: vi.fn(() => Promise.resolve(true)),
}));

const mockIsOrganizationOwnerEmployee = vi.fn();
vi.mock("@/modules/employees/service", () => ({
  isOrganizationOwnerEmployee: vi.fn().mockImplementation((orgId: string, empId: string) => {
    return mockIsOrganizationOwnerEmployee(orgId, empId);
  }),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(mockEmployeeRecord ? [mockEmployeeRecord] : []),
      }),
    }),
  },
}));

import EmployeeDetailsPage from "./page";

describe("EmployeeDetailsPage route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOrganizationOwnerEmployee.mockResolvedValue(false);
    mockUser = { id: "user-hr-admin" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "HR_ADMIN" },
    };
  });

  it("redirects HR Admin away from their own employee management/onboarding profile to /app/employees", async () => {
    mockEmployeeRecord = {
      id: "emp-self",
      organizationId: "org-1",
      userId: "user-hr-admin", // Matches logged-in HR Admin
      displayName: "Arjun Kumar",
      status: "onboarding",
    };

    await expect(
      EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-self" }) })
    ).rejects.toThrow("NEXT_REDIRECT: /app/employees");

    expect(mockRedirect).toHaveBeenCalledWith("/app/employees");
  }, 15000);

  it("does not redirect HR Admin when viewing another employee record", async () => {
    mockEmployeeRecord = {
      id: "emp-other",
      organizationId: "org-1",
      userId: "user-other", // Another user
      displayName: "Other Employee",
      status: "active",
      firstName: "Other",
      lastName: "Employee",
    };

    const result = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-other" }) });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  }, 15000);

  it("preserves self employee page access for ORGANIZATION_OWNER", async () => {
    mockUser = { id: "user-owner" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "ORGANIZATION_OWNER" },
    };
    mockEmployeeRecord = {
      id: "emp-owner",
      organizationId: "org-1",
      userId: "user-owner", // Matches owner
      displayName: "Naresh S",
      status: "active",
      firstName: "Naresh",
      lastName: "S",
    };

    const result = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-owner" }) });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  }, 15000);

  it("redirects unauthorized roles lacking employee.read permission to /app", async () => {
    const { can } = await import("@/modules/tenancy/authorization");
    vi.mocked(can).mockResolvedValueOnce(false); // can('employee.read') returns false

    await expect(
      EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-any" }) })
    ).rejects.toThrow("NEXT_REDIRECT: /app");

    expect(mockRedirect).toHaveBeenCalledWith("/app");
  }, 15000);

  it("renders protected view-only Organization Owner view when HR Admin views owner details", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockIsOrganizationOwnerEmployee.mockResolvedValueOnce(true);

    mockUser = { id: "user-hr-admin" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "HR_ADMIN" },
    };
    mockEmployeeRecord = {
      id: "emp-owner",
      organizationId: "org-1",
      userId: "user-owner",
      displayName: "Naresh Technologies Owner",
      status: "active",
      firstName: "Naresh",
      lastName: "Owner",
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-owner" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Protected Organization Owner");
    expect(html).toContain("Organization Owner Record Protected");
    expect(html).toContain("Onboarding, account status, and role configurations for the Organization Owner cannot be modified by other tenant roles.");
  }, 15000);
});

