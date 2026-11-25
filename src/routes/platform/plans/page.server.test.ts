import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadApiData } = vi.hoisted(() => ({ loadApiData: vi.fn() }));
vi.mock("$lib/server/load-api-data", () => ({ loadApiData }));

import { load } from "./+page.server";

describe("plans page server loader permissions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("evaluates canEditPlan and canEditFeatures to false for PLATFORM_SUPPORT", async () => {
    loadApiData.mockImplementation(async (_, path: string) => {
      if (path === "/api/platform/plans") {
        return {
          plans: [
            {
              id: "plan-1",
              code: "STARTER",
              name: "Starter Tier",
              description: "Basic features",
              monthlyPriceCents: 2900,
              annualPriceCents: 29000,
              currency: "INR",
              trialDays: 14,
              maxUsers: 10,
              maxStorageBytes: 1000000,
              billingInterval: "monthly",
              active: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        };
      }
      return { features: [] };
    });

    const request = new Request("https://example.test/platform/plans");
    const loaded = (await load({
      request,
      parent: async () => ({}),
      locals: {
        context: Promise.resolve({
          user: {
            id: "user-support",
            email: "support@symphowork.test",
            platformRole: "PLATFORM_SUPPORT",
          },
        }),
      },
    } as never)) as { canEditPlan: boolean; canEditFeatures: boolean; initialPlans: Array<{ name: string }> };

    expect(loaded.canEditPlan).toBe(false);
    expect(loaded.canEditFeatures).toBe(false);
    expect(loaded.initialPlans).toHaveLength(1);
    expect(loaded.initialPlans[0].name).toBe("Starter Tier");
  });

  it("evaluates canEditPlan and canEditFeatures to true for PLATFORM_ADMIN and PLATFORM_BILLING", async () => {
    loadApiData.mockImplementation(async (_, path: string) => {
      if (path === "/api/platform/plans") return { plans: [] };
      return { features: [] };
    });

    const request = new Request("https://example.test/platform/plans");

    const adminLoaded = (await load({
      request,
      parent: async () => ({}),
      locals: {
        context: Promise.resolve({
          user: {
            id: "user-admin",
            email: "admin@symphowork.test",
            platformRole: "PLATFORM_ADMIN",
          },
        }),
      },
    } as never)) as { canEditPlan: boolean; canEditFeatures: boolean };

    expect(adminLoaded.canEditPlan).toBe(true);
    expect(adminLoaded.canEditFeatures).toBe(true);

    const billingLoaded = (await load({
      request,
      parent: async () => ({}),
      locals: {
        context: Promise.resolve({
          user: {
            id: "user-billing",
            email: "billing@symphowork.test",
            platformRole: "PLATFORM_BILLING",
          },
        }),
      },
    } as never)) as { canEditPlan: boolean; canEditFeatures: boolean };

    expect(billingLoaded.canEditPlan).toBe(true);
    expect(billingLoaded.canEditFeatures).toBe(true);
  });
});
