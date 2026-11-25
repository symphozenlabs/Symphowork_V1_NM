import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  withTenantTransaction: vi.fn(),
  getOrEnsureEmployeeForUser: vi.fn(),
}));
vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext: mocks.resolveTenantContext }));
vi.mock("@/db/client", () => ({ withTenantTransaction: mocks.withTenantTransaction }));
vi.mock("@/modules/employees/service", () => ({
  getOrEnsureEmployeeForUser: mocks.getOrEnsureEmployeeForUser,
}));

describe("GET /api/app/me/employee", () => {
  beforeEach(() => vi.resetAllMocks());

  it("reads each owner profile using the transaction for the authenticated organization", async () => {
    for (const id of ["a", "b"]) {
      const organizationId = `org-${id}`;
      const userId = `owner-${id}`;
      const tx = { organizationId };
      const employee = { id: `employee-${id}`, organizationId, userId };
      mocks.resolveTenantContext.mockResolvedValue({ organization: { id: organizationId }, user: { id: userId } });
      mocks.withTenantTransaction.mockImplementation(async (_id, run) => run(tx));
      mocks.getOrEnsureEmployeeForUser.mockResolvedValue(employee);

      const response = await GET();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, employee });
      expect(mocks.withTenantTransaction).not.toHaveBeenCalled();
      expect(mocks.getOrEnsureEmployeeForUser).toHaveBeenLastCalledWith(organizationId, userId);
    }
  });

  it("denies an authenticated account without a tenant and never opens a tenant transaction", async () => {
    mocks.resolveTenantContext.mockResolvedValue({ organization: null, user: { id: "fixture" } });
    expect((await GET()).status).toBe(403);
    expect(mocks.withTenantTransaction).not.toHaveBeenCalled();
  });

  it("requires a valid session before looking up an employee", async () => {
    mocks.resolveTenantContext.mockRejectedValue(new AppError("UNAUTHORIZED", "Please sign in.", 401));
    expect((await GET()).status).toBe(401);
    expect(mocks.getOrEnsureEmployeeForUser).not.toHaveBeenCalled();
  });
});
