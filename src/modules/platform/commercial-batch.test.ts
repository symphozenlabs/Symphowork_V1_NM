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
    entitlementView: "platform.entitlement.view",
  },
  authorizePlatform,
}));

const { getBatchPlanFeatures } = await import("./commercial");

describe("getBatchPlanFeatures batching optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles empty plan list with zero database transactions and zero queries", async () => {
    const result = await getBatchPlanFeatures([]);

    expect(result).toEqual({});
    expect(withPlatformTransaction).not.toHaveBeenCalled();
    expect(authorizePlatform).not.toHaveBeenCalled();
  });

  it("batches features retrieval for multiple plans in a single platform transaction", async () => {
    const mockFeatures = [
      { id: "feat-1", planId: "plan-a", featureKey: "api_access", enabled: true, limitValue: 1000 },
      { id: "feat-2", planId: "plan-a", featureKey: "sso", enabled: true, limitValue: null },
      { id: "feat-3", planId: "plan-b", featureKey: "api_access", enabled: false, limitValue: 0 },
    ];

    withPlatformTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockFeatures),
            }),
          }),
        }),
      };
      return callback(mockTx);
    });

    const result = await getBatchPlanFeatures(["plan-a", "plan-b"]);

    expect(authorizePlatform).toHaveBeenCalledWith("platform.entitlement.view");
    expect(withPlatformTransaction).toHaveBeenCalledTimes(1);

    expect(result["plan-a"]).toHaveLength(2);
    expect(result["plan-a"]?.[0]?.featureKey).toBe("api_access");
    expect(result["plan-a"]?.[1]?.featureKey).toBe("sso");

    expect(result["plan-b"]).toHaveLength(1);
    expect(result["plan-b"]?.[0]?.featureKey).toBe("api_access");
  });

  it("preserves empty feature arrays for plans without any features", async () => {
    const mockFeatures = [
      { id: "feat-1", planId: "plan-active", featureKey: "support", enabled: true, limitValue: null },
    ];

    withPlatformTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockFeatures),
            }),
          }),
        }),
      };
      return callback(mockTx);
    });

    const result = await getBatchPlanFeatures(["plan-active", "plan-empty"]);

    expect(withPlatformTransaction).toHaveBeenCalledTimes(1);
    expect(result["plan-active"]).toHaveLength(1);
    expect(result["plan-empty"]).toEqual([]);
  });

  it("deduplicates plan IDs in input query safely", async () => {
    withPlatformTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      return callback(mockTx);
    });

    const result = await getBatchPlanFeatures(["plan-dup", "plan-dup", "plan-dup"]);

    expect(withPlatformTransaction).toHaveBeenCalledTimes(1);
    expect(Object.keys(result)).toEqual(["plan-dup"]);
    expect(result["plan-dup"]).toEqual([]);
  });
});
