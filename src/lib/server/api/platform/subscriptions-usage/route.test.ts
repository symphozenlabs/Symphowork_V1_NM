import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPlatformSubscriptionsUsage } = vi.hoisted(() => ({ listPlatformSubscriptionsUsage: vi.fn() }));
vi.mock("@/modules/platform/commercial", () => ({ listPlatformSubscriptionsUsage }));

import { GET } from "./route";

describe("subscriptions and usage API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads one combined page and forwards the shared search and filter state", async () => {
    listPlatformSubscriptionsUsage.mockResolvedValueOnce({ rows: [{ organization: { id: "org-1" }, activeEmployees: 18, subscription: { billingCycle: "annual" } }], total: 1, page: 1, pageSize: 10, pageCount: 1, availablePlans: [] });
    const response = await GET(new Request("https://example.test/api/platform/subscriptions-usage?q=Acme&status=over_limit&plan=GROWTH&billing=annual&page=2&pageSize=25"));

    expect(response.status).toBe(200);
    expect(listPlatformSubscriptionsUsage).toHaveBeenCalledWith({ query: "Acme", status: "over_limit", plan: "GROWTH", billing: "annual", page: 2, pageSize: 25 });
    expect((await response.json()).rows).toHaveLength(1);
  });

  it("ignores unsupported status filters instead of returning an accidental empty result", async () => {
    listPlatformSubscriptionsUsage.mockResolvedValueOnce({ rows: [], total: 0, page: 1, pageSize: 10, pageCount: 1, availablePlans: [] });
    await GET(new Request("https://example.test/api/platform/subscriptions-usage?status=organization_id"));
    expect(listPlatformSubscriptionsUsage).toHaveBeenCalledWith(expect.objectContaining({ status: "all" }));
  });
});
