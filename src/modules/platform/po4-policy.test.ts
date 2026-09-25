import { describe, expect, it } from "vitest";
import { evaluateFeatureFlag } from "./features";
import { providerStatus } from "./health";

describe("platform operations policies", () => {
  it("keeps feature flags separate from organization permission context", () => {
    expect(evaluateFeatureFlag({ enabled: true }, { platform: true })).toBe(true);
    expect(evaluateFeatureFlag({ enabled: true }, { platform: false })).toBe(false);
    expect(evaluateFeatureFlag({ enabled: false }, { platform: true })).toBe(false);
    expect(evaluateFeatureFlag(null, { platform: true })).toBe(false);
  });
  it("does not report an unconfigured provider as healthy", () => {
    expect(providerStatus()).toBe("not_configured");
    expect(providerStatus("configured-provider")).toBe("healthy");
  });
});
