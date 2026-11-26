import { beforeEach, describe, expect, it, vi } from "vitest";

const supportMocks = vi.hoisted(() => ({
  listPlatformSupportSubmissions: vi.fn(),
  getPlatformSupportSubmission: vi.fn(),
  listPlatformSupportAnnouncements: vi.fn(),
  getPlatformSupportStats: vi.fn(),
}));

vi.mock("@/modules/platform/support-communication", () => supportMocks);

const { loadApiData } = vi.hoisted(() => ({ loadApiData: vi.fn() }));
vi.mock("$lib/server/load-api-data", () => ({ loadApiData }));

import { load as supportLoad } from "./+page.server";
import { load as communicationLoad } from "./communication/+page.server";
import { load as troubleshootingLoad } from "./troubleshooting/+page.server";

describe("Support Console route consolidation & authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supportMocks.getPlatformSupportStats.mockResolvedValue({
      total: 10,
      awaiting: 3,
      replied: 7,
    });
    supportMocks.listPlatformSupportSubmissions.mockResolvedValue({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      pageCount: 1,
    });
    supportMocks.listPlatformSupportAnnouncements.mockResolvedValue([]);
    supportMocks.getPlatformSupportSubmission.mockResolvedValue(null);
  });

  function makeEvent(pathname: string, role: string, search = "") {
    const url = new URL(`https://example.test${pathname}${search}`);
    return {
      url,
      request: new Request(url.toString()),
      parent: async () => ({
        context: {
          user: {
            id: "user-test",
            email: "support@example.test",
            fullName: "Support User",
            platformRole: role,
          },
        },
      }),
      depends: vi.fn(),
    } as any;
  }

  describe("Canonical /platform/support route", () => {
    it.each(["PLATFORM_SUPPORT", "PLATFORM_OWNER", "PRODUCT_OWNER"])(
      "allows authorized role %s",
      async (role) => {
        const event = makeEvent("/platform/support", role);
        const data = (await supportLoad(event)) as any;
        expect(data).toMatchObject({
          tab: "inbox",
          q: "",
          queryType: "",
          organization: "",
          status: "",
          stats: { total: 10, awaiting: 3, replied: 7 },
        });
        expect(supportMocks.listPlatformSupportSubmissions).toHaveBeenCalled();
        expect(supportMocks.getPlatformSupportStats).toHaveBeenCalled();
      }
    );

    it("redirects PLATFORM_ADMIN to troubleshooting console (307)", async () => {
      const event = makeEvent("/platform/support", "PLATFORM_ADMIN");
      await expect(supportLoad(event)).rejects.toMatchObject({
        status: 307,
        location: "/platform/support/troubleshooting",
      });
    });

    it("denies PLATFORM_BILLING with HTTP 403", async () => {
      const event = makeEvent("/platform/support", "PLATFORM_BILLING");
      await expect(supportLoad(event)).rejects.toMatchObject({
        status: 403,
      });
    });

    it("passes search and filter parameters to submission listing", async () => {
      const event = makeEvent(
        "/platform/support",
        "PLATFORM_SUPPORT",
        "?q=billing&type=subscription_billing&organization=Acme&status=awaiting&page=2"
      );
      const data = (await supportLoad(event)) as any;
      expect(data.q).toBe("billing");
      expect(data.queryType).toBe("subscription_billing");
      expect(data.organization).toBe("Acme");
      expect(data.status).toBe("awaiting");
      expect(supportMocks.listPlatformSupportSubmissions).toHaveBeenCalledWith({
        query: "billing",
        page: 2,
        queryType: "subscription_billing",
        organization: "Acme",
        status: "awaiting",
        includeHistory: false,
      });
    });

    it("loads announcements on tab=announcements without querying submissions", async () => {
      supportMocks.listPlatformSupportAnnouncements.mockResolvedValue([
        { id: "ann-1", title: "Notice", recipientCount: 5 },
      ]);
      const event = makeEvent("/platform/support", "PLATFORM_SUPPORT", "?tab=announcements");
      const data = (await supportLoad(event)) as any;
      expect(data.tab).toBe("announcements");
      expect(data.inbox).toBeNull();
      expect(data.announcements).toHaveLength(1);
      expect(supportMocks.listPlatformSupportSubmissions).not.toHaveBeenCalled();
    });

    it("includes submission history replies on tab=history", async () => {
      const event = makeEvent("/platform/support", "PLATFORM_SUPPORT", "?tab=history");
      const data = (await supportLoad(event)) as any;
      expect(data.tab).toBe("history");
      expect(supportMocks.listPlatformSupportSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({ includeHistory: true })
      );
      expect(supportMocks.listPlatformSupportAnnouncements).toHaveBeenCalled();
    });

    it("rejects malformed submission UUID with HTTP 404", async () => {
      const event = makeEvent("/platform/support", "PLATFORM_SUPPORT", "?submission=not-a-uuid");
      await expect(supportLoad(event)).rejects.toMatchObject({
        status: 404,
      });
    });

    it("rejects non-existent submission with HTTP 404", async () => {
      const validUuid = "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d";
      supportMocks.getPlatformSupportSubmission.mockResolvedValue(null);
      const event = makeEvent("/platform/support", "PLATFORM_SUPPORT", `?submission=${validUuid}`);
      await expect(supportLoad(event)).rejects.toMatchObject({
        status: 404,
      });
    });

    it("surfaces HTTP 503 when support database migration is pending (code 42P01)", async () => {
      const dbError = new Error("relation support_submissions does not exist");
      (dbError as any).code = "42P01";
      supportMocks.listPlatformSupportSubmissions.mockRejectedValue(dbError);

      const event = makeEvent("/platform/support", "PLATFORM_SUPPORT");
      await expect(supportLoad(event)).rejects.toMatchObject({
        status: 503,
      });
    });
  });

  describe("Old /platform/support/communication redirect route", () => {
    it.each(["PLATFORM_SUPPORT", "PLATFORM_OWNER", "PRODUCT_OWNER"])(
      "permanently redirects %s to canonical /platform/support (308)",
      async (role) => {
        const event = makeEvent(
          "/platform/support/communication",
          role,
          "?q=issue&type=bug_technical"
        );
        await expect(communicationLoad(event)).rejects.toMatchObject({
          status: 308,
          location: "/platform/support?q=issue&type=bug_technical",
        });
      }
    );

    it.each(["PLATFORM_ADMIN", "PLATFORM_BILLING"])(
      "denies unauthorized role %s with HTTP 403",
      async (role) => {
        const event = makeEvent("/platform/support/communication", role);
        await expect(communicationLoad(event)).rejects.toMatchObject({
          status: 403,
        });
      }
    );
  });

  describe("Preserved /platform/support/troubleshooting route", () => {
    it.each(["PLATFORM_SUPPORT", "PLATFORM_ADMIN", "PLATFORM_OWNER", "PRODUCT_OWNER"])(
      "allows operational support view for %s",
      async (role) => {
        loadApiData.mockResolvedValue({
          organizations: [{ id: "org-1", name: "Org 1" }],
          total: 1,
          page: 1,
          pageSize: 10,
          pageCount: 1,
        });
        const event = makeEvent("/platform/support/troubleshooting", role);
        const data = (await troubleshootingLoad(event)) as any;
        expect(data.result.organizations).toHaveLength(1);
        expect(data.communication).toBe(
          ["PLATFORM_SUPPORT", "PLATFORM_OWNER", "PRODUCT_OWNER"].includes(role)
        );
      }
    );

    it("denies PLATFORM_BILLING with HTTP 403", async () => {
      const event = makeEvent("/platform/support/troubleshooting", "PLATFORM_BILLING");
      await expect(troubleshootingLoad(event)).rejects.toMatchObject({
        status: 403,
      });
    });
  });
});
