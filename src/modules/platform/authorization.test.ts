import { beforeEach, describe, expect, it, vi } from "vitest";
const { requireSession } = vi.hoisted(() => ({ requireSession: vi.fn() }));
vi.mock("@/modules/identity/auth", () => ({ requireSession }));
import { hasPlatformPermission, authorizePlatform, PLATFORM_PERMISSIONS, platformConsoleTitle } from "./authorization";
describe("platform authorization boundary", () => {
  it("does not treat organization roles as platform roles", () => {
    expect(hasPlatformPermission("ORGANIZATION_OWNER", PLATFORM_PERMISSIONS.organizationView)).toBe(false);
    expect(hasPlatformPermission("EMPLOYEE", PLATFORM_PERMISSIONS.organizationView)).toBe(false);
  });
  it("authorizes the audit permission only for PLATFORM_OWNER and PRODUCT_OWNER", async () => {
    const allowed = ["PLATFORM_OWNER", "PRODUCT_OWNER"];
    const denied = ["PLATFORM_ADMIN", "PLATFORM_SUPPORT", "PLATFORM_BILLING", "ORGANIZATION_OWNER", "HR_ADMIN", "HR_EXECUTIVE", "FINANCE_ADMIN", "MANAGER", "TEAM_LEAD", "PROJECT_MANAGER", "RECRUITER", "EMPLOYEE"];
    for (const role of allowed) {
      requireSession.mockResolvedValueOnce({ id: "actor", platformRole: role });
      await expect(authorizePlatform(PLATFORM_PERMISSIONS.auditView)).resolves.toMatchObject({ platformRole: role });
    }
    for (const role of denied) {
      requireSession.mockResolvedValueOnce({ id: "actor", platformRole: role });
      await expect(authorizePlatform(PLATFORM_PERMISSIONS.auditView)).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    }
  });
  it("limits platform role capabilities", () => {
    expect(hasPlatformPermission("PRODUCT_OWNER", PLATFORM_PERMISSIONS.billingManage)).toBe(true);
    expect(hasPlatformPermission("PLATFORM_SUPPORT", PLATFORM_PERMISSIONS.billingManage)).toBe(false);
    expect(hasPlatformPermission("PLATFORM_BILLING", PLATFORM_PERMISSIONS.billingManage)).toBe(true);
    expect(hasPlatformPermission("PLATFORM_BILLING", PLATFORM_PERMISSIONS.analyticsView)).toBe(true);
    expect(hasPlatformPermission("PLATFORM_BILLING", PLATFORM_PERMISSIONS.provisioningView)).toBe(false);
  });
  it("authorizes analyticsView for PLATFORM_BILLING while denying provisioningView", async () => {
    requireSession.mockResolvedValueOnce({ id: "actor", platformRole: "PLATFORM_BILLING" });
    await expect(authorizePlatform(PLATFORM_PERMISSIONS.analyticsView)).resolves.toMatchObject({ platformRole: "PLATFORM_BILLING" });

    requireSession.mockResolvedValueOnce({ id: "actor", platformRole: "PLATFORM_BILLING" });
    await expect(authorizePlatform(PLATFORM_PERMISSIONS.provisioningView)).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
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
