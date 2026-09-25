import { describe, expect, it } from "vitest";
import { canTransitionSubscriptionStatus } from "./commercial";
import { billingFeatureAvailable, limitAllows } from "@/modules/billing/policy";

describe("commercial policy", () => {
  it("preserves unlimited, zero, and finite entitlement semantics", () => {
    expect(limitAllows(null, 500)).toBe(true);
    expect(limitAllows(0, 0)).toBe(false);
    expect(limitAllows(10, 9)).toBe(true);
    expect(billingFeatureAvailable(false, null)).toBe(false);
  });
  it("allows only supported subscription transitions", () => {
    expect(canTransitionSubscriptionStatus("pending", "active")).toBe(true);
    expect(canTransitionSubscriptionStatus("active", "cancelled")).toBe(true);
    expect(canTransitionSubscriptionStatus("cancelled", "active")).toBe(true);
    expect(canTransitionSubscriptionStatus("expired", "active")).toBe(false);
  });
});
