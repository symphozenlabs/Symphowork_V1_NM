import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  withPlatformTransaction: vi.fn(),
}));

vi.mock("@/modules/identity/auth", () => ({ requireSession: mocks.requireSession }));
vi.mock("@/db/client", () => ({ withPlatformTransaction: mocks.withPlatformTransaction }));

import { GET } from "./route";

const platformRoles = ["PLATFORM_OWNER", "PRODUCT_OWNER", "PLATFORM_ADMIN", "PLATFORM_SUPPORT", "PLATFORM_BILLING"];
const organizationRoles = ["ORGANIZATION_OWNER", "HR_ADMIN", "HR_EXECUTIVE", "FINANCE_ADMIN", "MANAGER", "TEAM_LEAD", "PROJECT_MANAGER", "RECRUITER", "EMPLOYEE"];

describe("platform audit API access and response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for all 12 roles outside PLATFORM_OWNER and PRODUCT_OWNER", async () => {
    for (const role of [...platformRoles.slice(2), ...organizationRoles]) {
      mocks.requireSession.mockResolvedValueOnce({ id: "actor", platformRole: role });
      const response = await GET(new Request("https://example.test/api/platform/audit"));
      expect(response.status, role).toBe(403);
    }
    expect(mocks.withPlatformTransaction).not.toHaveBeenCalled();
  });

  it("preserves unauthenticated session behavior", async () => {
    mocks.requireSession.mockRejectedValueOnce(new AppError("UNAUTHORIZED", "Please sign in.", 401));
    const response = await GET(new Request("https://example.test/api/platform/audit"));
    expect(response.status).toBe(401);
  });

  it("returns a narrow platform event projection for both allowed roles", async () => {
    const row = {
      audit: { id: "event-1", action: "platform_role_changed", resource: "user", createdAt: new Date("2026-11-25T00:00:00Z") },
      actor: { name: "Platform Operator" },
    };
    mocks.withPlatformTransaction.mockImplementation(async (run: (tx: unknown) => Promise<unknown>) => {
      const rowsQuery = {
        innerJoin: () => rowsQuery,
        where: () => rowsQuery,
        orderBy: () => rowsQuery,
        limit: () => rowsQuery,
        offset: async () => [row],
      };
      const countQuery = { innerJoin: () => countQuery, where: async () => [{ total: 1 }] };
      const tx = {
        select: (selection: Record<string, unknown>) => ({
          from: () => "total" in selection ? countQuery : rowsQuery,
        }),
      };
      return run(tx);
    });

    for (const role of ["PLATFORM_OWNER", "PRODUCT_OWNER"]) {
      mocks.requireSession.mockResolvedValueOnce({ id: "actor", platformRole: role });
      const response = await GET(new Request("https://example.test/api/platform/audit?page=1&pageSize=25"));
      expect(response.status, role).toBe(200);
      const body = await response.json();
      expect(body.events).toEqual([{ ...row, audit: { ...row.audit, createdAt: row.audit.createdAt.toISOString() } }]);
      expect(JSON.stringify(body)).not.toContain("metadata");
      expect(JSON.stringify(body)).not.toContain("email");
      expect(JSON.stringify(body)).not.toContain("organization");
    }
  });

  it("handles an empty filtered result as one safe empty page", async () => {
    mocks.requireSession.mockResolvedValueOnce({ id: "actor", platformRole: "PLATFORM_OWNER" });
    mocks.withPlatformTransaction.mockImplementationOnce(async (run: (tx: unknown) => Promise<unknown>) => {
      const rowsQuery = {
        innerJoin: () => rowsQuery,
        where: () => rowsQuery,
        orderBy: () => rowsQuery,
        limit: () => rowsQuery,
        offset: async () => [],
      };
      const countQuery = { innerJoin: () => countQuery, where: async () => [{ total: 0 }] };
      return run({ select: (selection: Record<string, unknown>) => ({ from: () => "total" in selection ? countQuery : rowsQuery }) });
    });

    const response = await GET(new Request("https://example.test/api/platform/audit?page=900&pageSize=100&query=missing"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.events).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.page).toBe(900);
    expect(body.pageSize).toBe(100);
    expect(body.pageCount).toBe(1);
  });
});
