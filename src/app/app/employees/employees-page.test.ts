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

let mockUser: { id: string; platformRole?: string } | null = { id: "user-test", platformRole: "NONE" };
let mockTenant: {
  organization: { id: string; name?: string } | null;
  role?: { key: string } | null;
  user?: { id: string };
} = {
  organization: { id: "org-1" },
  role: { key: "EMPLOYEE" },
  user: { id: "user-test" },
};

let mockCanResult = false;

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser: vi.fn(() => Promise.resolve(mockUser)),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: vi.fn(() => Promise.resolve(mockTenant)),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  can: vi.fn(() => Promise.resolve(mockCanResult)),
}));

const mockListEmployees = vi.fn();
vi.mock("@/modules/employees/service", () => ({
  listEmployees: vi.fn((...args) => mockListEmployees(...args)),
}));

vi.mock("@/components/employees/workforce-directory-table", () => ({
  WorkforceDirectoryTable: () => React.createElement("div", { "data-testid": "workforce-directory-table" }),
}));

import EmployeesPage from "./page";

describe("EmployeesPage (People Directory) route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-test", platformRole: "NONE" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "EMPLOYEE" },
      user: { id: "user-test" },
    };
    mockCanResult = false;
    mockListEmployees.mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 25,
    });
  });

  it("redirects unauthenticated users to /login", async () => {
    mockUser = null;
    await expect(EmployeesPage({})).rejects.toThrow("NEXT_REDIRECT: /login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects users without organization to /platform", async () => {
    mockTenant.organization = null;
    await expect(EmployeesPage({})).rejects.toThrow("NEXT_REDIRECT: /platform");
    expect(mockRedirect).toHaveBeenCalledWith("/platform");
  });

  it("redirects unauthorized EMPLOYEE lacking employee.read permission to /app/directory", async () => {
    mockCanResult = false;
    await expect(EmployeesPage({})).rejects.toThrow("NEXT_REDIRECT: /app/directory");
    expect(mockRedirect).toHaveBeenCalledWith("/app/directory");
    expect(mockListEmployees).not.toHaveBeenCalled();
  });

  it("allows authorized users with employee.read to view workforce directory", async () => {
    mockCanResult = true;
    const page = await EmployeesPage({});
    expect(page).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockListEmployees).toHaveBeenCalledWith("org-1", expect.objectContaining({ page: 1, pageSize: 25 }));
  });
});
