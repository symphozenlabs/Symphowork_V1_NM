import { beforeEach, describe, expect, it, vi } from "vitest";

const { withPlatformTransaction, authorizePlatform } = vi.hoisted(() => ({
  withPlatformTransaction: vi.fn(),
  authorizePlatform: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  withPlatformTransaction,
}));

vi.mock("@/modules/platform/authorization", () => ({
  PLATFORM_PERMISSIONS: {
    organizationView: "platform.organization.view",
  },
  authorizePlatform,
}));

const { listPlatformOrganizations } = await import("./operations");

describe("listPlatformOrganizations query concurrency and semantics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authorizes platform permission and executes rows and count concurrently in withPlatformTransaction", async () => {
    const mockRows = [
      {
        id: "org-1",
        name: "Acme Corp",
        legalName: "Acme Corp LLC",
        slug: "acme-corp",
        status: "active",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        provisioningStatus: "completed",
      },
    ];

    withPlatformTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        select: vi.fn().mockImplementation((selectObj) => {
          if (selectObj?.total) {
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ total: 42 }]),
              }),
            };
          }
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue(mockRows),
                    }),
                  }),
                }),
              }),
            }),
          };
        }),
      };
      return callback(mockTx);
    });

    const result = await listPlatformOrganizations({ page: 2, pageSize: 10 });

    expect(authorizePlatform).toHaveBeenCalledWith("platform.organization.view");
    expect(withPlatformTransaction).toHaveBeenCalledTimes(1);
    expect(result.rows).toEqual(mockRows);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.total).toBe(42);
    expect(result.pageCount).toBe(5); // Math.ceil(42 / 10) = 5
  });

  it("handles empty results and calculates pageCount as 0", async () => {
    withPlatformTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        select: vi.fn().mockImplementation((selectObj) => {
          if (selectObj?.total) {
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ total: 0 }]),
              }),
            };
          }
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue([]),
                    }),
                  }),
                }),
              }),
            }),
          };
        }),
      };
      return callback(mockTx);
    });

    const result = await listPlatformOrganizations({});

    expect(result.rows).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20); // Default pageSize
    expect(result.total).toBe(0);
    expect(result.pageCount).toBe(0);
  });

  it("clamps invalid bounds safely", async () => {
    withPlatformTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        select: vi.fn().mockImplementation((selectObj) => {
          if (selectObj?.total) {
            return {
              from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ total: 10 }]),
              }),
            };
          }
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      offset: vi.fn().mockResolvedValue([]),
                    }),
                  }),
                }),
              }),
            }),
          };
        }),
      };
      return callback(mockTx);
    });

    const result = await listPlatformOrganizations({ page: -5, pageSize: 200 });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(100); // Clamped to max 100
  });
});
