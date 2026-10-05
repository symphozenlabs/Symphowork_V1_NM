import { describe, expect, it } from "vitest";
import { canTransitionSubscriptionStatus, calculateUsageStatus } from "./commercial";
import { planCodeSchema, planNameSchema, planInputSchema } from "@/modules/platform/validation";
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

  describe("plan code validation", () => {
    it("accepts valid uppercase alphanumeric and underscore codes", () => {
      expect(planCodeSchema.safeParse("FREE").success).toBe(true);
      expect(planCodeSchema.safeParse("STARTER").success).toBe(true);
      expect(planCodeSchema.safeParse("BUSINESS").success).toBe(true);
      expect(planCodeSchema.safeParse("STARTER_2027").success).toBe(true);
      expect(planCodeSchema.safeParse("ENTERPRISE_PLUS_V2").success).toBe(true);
    });

    it("rejects lowercase, spaces, symbols, and invalid length codes", () => {
      expect(planCodeSchema.safeParse("business").success).toBe(false);
      expect(planCodeSchema.safeParse("STARTER 2027").success).toBe(false);
      expect(planCodeSchema.safeParse("STARTER-2027").success).toBe(false);
      expect(planCodeSchema.safeParse("PRO!").success).toBe(false);
      expect(planCodeSchema.safeParse("A").success).toBe(false);
    });
  });

  describe("plan name validation", () => {
    it("accepts human-readable names with letters and punctuation", () => {
      expect(planNameSchema.safeParse("Starter Plan").success).toBe(true);
      expect(planNameSchema.safeParse("Enterprise Plus (Annual)").success).toBe(true);
      expect(planNameSchema.safeParse("Scale-Up & Growth").success).toBe(true);
      expect(planNameSchema.safeParse("Founder's Tier").success).toBe(true);
    });

    it("rejects numbers-only, symbols-only, or whitespace-only names", () => {
      expect(planNameSchema.safeParse("123456").success).toBe(false);
      expect(planNameSchema.safeParse("---").success).toBe(false);
      expect(planNameSchema.safeParse("   ").success).toBe(false);
      expect(planNameSchema.safeParse("A").success).toBe(false);
    });
  });

  describe("plan input schema", () => {
    it("validates full plan payload correctly", () => {
      const valid = planInputSchema.safeParse({
        code: "BUSINESS_GROWTH",
        name: "Business Growth Plan",
        description: "For scaling businesses",
        monthlyPriceCents: 150000,
        annualPriceCents: 1500000,
        currency: "INR",
        trialDays: 14,
        maxUsers: 100,
        maxStorageBytes: null,
        billingInterval: "monthly",
        active: true,
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("calculateUsageStatus", () => {
    it("handles unlimited plan (null limit)", () => {
      const result = calculateUsageStatus(50, null);
      expect(result.remaining).toBeNull();
      expect(result.overLimit).toBe(false);
      expect(result.nearLimit).toBe(false);
      expect(result.limitReached).toBe(false);
      expect(result.status).toBe("within_limit");
      expect(result.statusLabel).toBe("Within limit");
    });

    it("handles comfortable capacity under 80% threshold", () => {
      const result = calculateUsageStatus(5, 20);
      expect(result.remaining).toBe(15);
      expect(result.overLimit).toBe(false);
      expect(result.nearLimit).toBe(false);
      expect(result.limitReached).toBe(false);
      expect(result.status).toBe("within_limit");
      expect(result.statusLabel).toBe("Within limit");
    });

    it("identifies near limit when active >= 80% of capacity", () => {
      const result = calculateUsageStatus(16, 20); // 80% of 20 = 16
      expect(result.remaining).toBe(4);
      expect(result.overLimit).toBe(false);
      expect(result.nearLimit).toBe(true);
      expect(result.limitReached).toBe(false);
      expect(result.status).toBe("near_limit");
      expect(result.statusLabel).toBe("Near limit");
    });

    it("identifies limit reached when active === capacity", () => {
      const result = calculateUsageStatus(20, 20);
      expect(result.remaining).toBe(0);
      expect(result.overLimit).toBe(false);
      expect(result.nearLimit).toBe(false);
      expect(result.limitReached).toBe(true);
      expect(result.status).toBe("limit_reached");
      expect(result.statusLabel).toBe("Limit reached");
    });

    it("identifies over limit and computes negative remaining (not clamped to 0)", () => {
      // 16 active out of 15 allowed should be -1 remaining and over limit
      const result = calculateUsageStatus(16, 15);
      expect(result.remaining).toBe(-1);
      expect(result.overLimit).toBe(true);
      expect(result.nearLimit).toBe(false);
      expect(result.limitReached).toBe(false);
      expect(result.status).toBe("over_limit");
      expect(result.statusLabel).toBe("Over limit");
    });

    it("handles significant over capacity", () => {
      const result = calculateUsageStatus(25, 10);
      expect(result.remaining).toBe(-15);
      expect(result.overLimit).toBe(true);
      expect(result.status).toBe("over_limit");
    });
  });
});


