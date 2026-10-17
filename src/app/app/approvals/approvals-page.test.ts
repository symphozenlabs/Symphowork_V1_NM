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

let mockCanAnyResult = false;

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser: vi.fn(() => Promise.resolve(mockUser)),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: vi.fn(() => Promise.resolve(mockTenant)),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  canAny: vi.fn(() => Promise.resolve(mockCanAnyResult)),
}));

vi.mock("@/components/approvals/approval-inbox", () => ({
  ApprovalInbox: () => React.createElement("div", { "data-testid": "approval-inbox" }),
}));

import ApprovalsPage from "./page";

describe("ApprovalsPage route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-test", platformRole: "NONE" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "EMPLOYEE" },
      user: { id: "user-test" },
    };
    mockCanAnyResult = false;
  });

  it("redirects unauthenticated users to /login", async () => {
    mockUser = null;
    await expect(ApprovalsPage()).rejects.toThrow("NEXT_REDIRECT: /login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects users without organization to /platform", async () => {
    mockTenant.organization = null;
    await expect(ApprovalsPage()).rejects.toThrow("NEXT_REDIRECT: /platform");
    expect(mockRedirect).toHaveBeenCalledWith("/platform");
  });

  it("redirects unauthorized EMPLOYEE lacking approval permissions to /app", async () => {
    mockCanAnyResult = false;
    await expect(ApprovalsPage()).rejects.toThrow("NEXT_REDIRECT: /app");
    expect(mockRedirect).toHaveBeenCalledWith("/app");
  });

  it("renders approvals inbox when user has approval permissions", async () => {
    mockCanAnyResult = true;
    const page = await ApprovalsPage();
    expect(page).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
