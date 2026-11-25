import { describe, expect, it } from "vitest";
import { load } from "./+layout.server";

describe("platform layout server guard for PLATFORM_SUPPORT and PLATFORM_ADMIN", () => {
  function makeEvent(pathname: string, role: string) {
    return {
      url: new URL(`https://example.test${pathname}`),
      locals: {
        context: Promise.resolve({
          user: {
            id: "user-test",
            email: "support@symphowork.test",
            fullName: "Support Specialist",
            platformRole: role,
          },
        }),
      },
    } as Parameters<typeof load>[0];
  }

  it("allows PLATFORM_SUPPORT on authorized console pages", async () => {
    const allowed = [
      "/platform",
      "/platform/organizations",
      "/platform/plans",
      "/platform/subscriptions",
      "/platform/support",
      "/platform/health",
    ];

    for (const path of allowed) {
      const res = (await load(makeEvent(path, "PLATFORM_SUPPORT"))) as { context: unknown };
      expect(res.context).toBeDefined();
    }
  });

  it("denies PLATFORM_SUPPORT on restricted console pages with HTTP 403", async () => {
    const restricted = [
      "/platform/provisioning",
      "/platform/features",
      "/platform/configuration",
      "/platform/users",
      "/platform/audit",
      "/platform/analytics",
      "/platform/organizations/new",
    ];

    for (const path of restricted) {
      await expect(load(makeEvent(path, "PLATFORM_SUPPORT"))).rejects.toMatchObject({
        status: 403,
      });
    }
  });

  it("retains PLATFORM_ADMIN access to operational management pages", async () => {
    const adminAllowed = [
      "/platform",
      "/platform/organizations",
      "/platform/organizations/new",
      "/platform/provisioning",
      "/platform/features",
      "/platform/configuration",
      "/platform/users",
      "/platform/support",
      "/platform/health",
      "/platform/plans",
      "/platform/subscriptions",
      "/platform/analytics",
    ];

    for (const path of adminAllowed) {
      const res = (await load(makeEvent(path, "PLATFORM_ADMIN"))) as { context: unknown };
      expect(res.context).toBeDefined();
    }
  });
});
