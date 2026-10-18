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
  user: { id: string };
  membership: { roleId: string; status: string; organizationId: string } | null;
  permissions: string[];
} = {
  organization: { id: "org-1" },
  role: { key: "ORGANIZATION_OWNER" },
  user: { id: "user-1" },
  membership: { roleId: "role-owner", status: "active", organizationId: "org-1" },
  permissions: ["ats.view"],
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

vi.mock("@/components/ats/ats-dashboard", () => ({
  AtsDashboard: () => React.createElement("div", { "data-testid": "ats-dashboard" }),
}));

vi.mock("@/components/ats/ats-interview-panel", () => ({
  AtsInterviewPanel: () => React.createElement("div", { "data-testid": "ats-interview-panel" }),
}));

import RecruitmentPage from "./page";

describe("RecruitmentPage Route Protection and Access Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "ORGANIZATION_OWNER" },
      user: { id: "user-1" },
      membership: { roleId: "role-owner", status: "active", organizationId: "org-1" },
      permissions: ["ats.view"],
    };
    mockCanResult = true;
  });

  it("redirects unauthenticated users to /login", async () => {
    mockUser = null;
    await expect(RecruitmentPage()).rejects.toThrow("NEXT_REDIRECT: /login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects unauthorized users (e.g. HR_ADMIN lacking ats.view) to /app", async () => {
    mockCanResult = false;
    await expect(RecruitmentPage()).rejects.toThrow("NEXT_REDIRECT: /app");
    expect(mockRedirect).toHaveBeenCalledWith("/app");
  });

  it("renders recruitment dashboard and interview panel for authorized roles", async () => {
    mockCanResult = true;
    const result = await RecruitmentPage();
    expect(result).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
