import { describe, expect, it } from "vitest";
import { load } from "./+page.server";

describe("legacy platform usage route", () => {
  it("permanently redirects to subscriptions and preserves search and filter bookmarks", () => {
    try {
      load({ url: new URL("https://example.test/platform/usage?q=Acme&status=over_limit&plan=GROWTH") } as never);
      throw new Error("Expected the route to redirect");
    } catch (error) {
      expect(error).toMatchObject({ status: 308, location: "/platform/subscriptions?q=Acme&status=over_limit&plan=GROWTH" });
    }
  });
});
