import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  authorize: vi.fn(),
  tenantApiRead: vi.fn(),
}));

vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext: mocks.resolveTenantContext }));
vi.mock("@/modules/tenancy/authorization", () => ({ authorize: mocks.authorize }));
vi.mock("@/lib/server/tenant-api-read", () => ({ tenantApiRead: mocks.tenantApiRead }));
vi.mock("@/lib/server/tenant-api-write", () => ({ tenantApiWrite: vi.fn() }));
vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("@/modules/employees/service", () => ({
  isOrganizationOwnerEmployee: vi.fn(),
  isActorPrivilegedForOwnerRecord: vi.fn(),
}));

import { GET } from "./route";
import { onboarding, onboardingChecklistItems } from "@/db/schema";

describe("employee onboarding checklist API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveTenantContext.mockResolvedValue({
      organization: { id: "tenant-b" },
      user: { id: "owner-user" },
      membership: { status: "active", organizationId: "tenant-b" },
    });
    mocks.authorize.mockResolvedValue(undefined);
  });

  it("reads checklist records inside the verified tenant context", async () => {
    const record = { id: "onboarding-1", employeeId: "employee-1", organizationId: "tenant-b" };
    const items = [{ id: "item-1", onboardingId: "onboarding-1", title: "Complete profile" }];
    const tx = {
      select: vi.fn(() => ({
        from: (table: unknown) => ({
          where: vi.fn(async () => table === onboarding ? [record] : items),
        }),
      })),
    };
    mocks.tenantApiRead.mockImplementation(async (_tenant, read) => read(tx));

    const response = await GET(new Request("http://localhost/api/app/employees/employee-1/onboarding"), {
      params: { employeeId: "employee-1" },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, onboarding: record, items });
    expect(mocks.tenantApiRead).toHaveBeenCalledOnce();
    expect(tx.select).toHaveBeenCalledTimes(2);
    expect(onboardingChecklistItems).toBeDefined();
  });
});
