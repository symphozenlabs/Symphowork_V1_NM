import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadApiData } = vi.hoisted(() => ({ loadApiData: vi.fn() }));
vi.mock("$lib/server/load-api-data", () => ({ loadApiData }));

import { load } from "./+page.server";

describe("unified subscriptions page loader", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads subscription and active-employee data from the unified endpoint", async () => {
    const result = { rows: [], total: 0, page: 1, pageSize: 10, pageCount: 1, availablePlans: [] };
    loadApiData.mockResolvedValueOnce(result);
    const request = new Request("https://example.test/platform/subscriptions");
    const loaded = await load({
      request,
      url: new URL("https://example.test/platform/subscriptions?q=Acme&status=trialing&plan=GROWTH&billing=annual&page=2"),
      parent: async () => ({}),
    } as never);

    expect(loadApiData).toHaveBeenCalledWith(request, "/api/platform/subscriptions-usage?query=Acme&page=2&pageSize=10&status=trialing&plan=GROWTH&billing=annual");
    expect(loaded).toMatchObject({ result, query: "Acme", status: "trialing", plan: "GROWTH", billing: "annual" });
  });
});
