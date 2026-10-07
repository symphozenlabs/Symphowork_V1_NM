import { describe, expect, it } from "vitest";
import { hasPlatformPermission, PLATFORM_PERMISSIONS, platformConsoleTitle } from "./authorization";
describe("platform authorization boundary", () => {
  it("does not treat organization roles as platform roles", () => {
    expect(hasPlatformPermission("ORGANIZATION_OWNER", PLATFORM_PERMISSIONS.organizationView)).toBe(false);
    expect(hasPlatformPermission("EMPLOYEE", PLATFORM_PERMISSIONS.organizationView)).toBe(false);
  });
  it("limits platform role capabilities", () => {
    expect(hasPlatformPermission("PRODUCT_OWNER", PLATFORM_PERMISSIONS.billingManage)).toBe(true);
    expect(hasPlatformPermission("PLATFORM_SUPPORT", PLATFORM_PERMISSIONS.billingManage)).toBe(false);
    expect(hasPlatformPermission("PLATFORM_BILLING", PLATFORM_PERMISSIONS.billingManage)).toBe(true);
  });
  it("maps all 5 platform roles to their respective console titles", () => {
    expect(platformConsoleTitle("PLATFORM_OWNER")).toBe("Platform Owner Console");
    expect(platformConsoleTitle("PRODUCT_OWNER")).toBe("Product Owner Console");
    expect(platformConsoleTitle("PLATFORM_ADMIN")).toBe("Platform Admin Console");
    expect(platformConsoleTitle("PLATFORM_SUPPORT")).toBe("Platform Support Console");
    expect(platformConsoleTitle("PLATFORM_BILLING")).toBe("Platform Billing Console");
  });
  it("falls back to Platform Console for missing or unknown roles", () => {
    expect(platformConsoleTitle("NONE")).toBe("Platform Console");
    expect(platformConsoleTitle(undefined)).toBe("Platform Console");
    expect(platformConsoleTitle(null)).toBe("Platform Console");
    expect(platformConsoleTitle("")).toBe("Platform Console");
    expect(platformConsoleTitle("UNKNOWN_ROLE")).toBe("Platform Console");
  });
});
