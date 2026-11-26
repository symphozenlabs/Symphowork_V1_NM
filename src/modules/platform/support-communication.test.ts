import { describe, expect, it } from "vitest";
import {
  PLATFORM_COMMUNICATION_PERMISSIONS,
  hasPlatformPermission,
} from "./authorization";
import { hasPlatformPermission as pagePermission } from "@/lib/auth/platform";
import {
  SUPPORT_QUERY_TYPES,
  supportAnnouncementInputSchema,
  supportAudienceSchema,
  supportReplyInputSchema,
  supportSubmissionInputSchema,
} from "./support-communication";

describe("Support Communication permissions", () => {
  for (const role of [
    "PLATFORM_OWNER",
    "PRODUCT_OWNER",
    "PLATFORM_SUPPORT",
    "PLATFORM_ADMIN",
    "PLATFORM_BILLING",
    "NONE",
  ]) {
    it(role, () => {
      const allowed = [
        "PLATFORM_OWNER",
        "PRODUCT_OWNER",
        "PLATFORM_SUPPORT",
      ].includes(role);
      for (const permission of PLATFORM_COMMUNICATION_PERMISSIONS) {
        expect(hasPlatformPermission(role, permission)).toBe(allowed);
        expect(pagePermission(role, permission)).toBe(allowed);
      }
    });
  }
});

describe("Support Submission input validation", () => {
  it("discards client ownership and requires nonblank text", () => {
    const input = {
      subject: "Question",
      description: "Details",
      queryType: "other" as const,
    };
    expect(
      supportSubmissionInputSchema.parse({
        ...input,
        organizationId: "untrusted",
        submitterName: "untrusted",
      }),
    ).toEqual(input);
    expect(
      supportSubmissionInputSchema.safeParse({ ...input, subject: " " }).success,
    ).toBe(false);
    expect(
      supportSubmissionInputSchema.safeParse({ ...input, description: "" }).success,
    ).toBe(false);
  });

  it("accepts all defined query types and rejects invalid ones", () => {
    for (const queryType of SUPPORT_QUERY_TYPES) {
      expect(
        supportSubmissionInputSchema.safeParse({
          subject: "Valid",
          description: "Valid",
          queryType,
        }).success,
      ).toBe(true);
    }
    expect(
      supportSubmissionInputSchema.safeParse({
        subject: "Valid",
        description: "Valid",
        queryType: "invalid_type",
      }).success,
    ).toBe(false);
  });
});

describe("Support Reply input validation", () => {
  it("requires non-empty body and trims whitespace", () => {
    expect(
      supportReplyInputSchema.parse({ body: "  Hello from support  " }),
    ).toEqual({ body: "Hello from support" });
    expect(supportReplyInputSchema.safeParse({ body: "" }).success).toBe(false);
    expect(supportReplyInputSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("enforces 12,000 character maximum", () => {
    expect(
      supportReplyInputSchema.safeParse({ body: "a".repeat(12000) }).success,
    ).toBe(true);
    expect(
      supportReplyInputSchema.safeParse({ body: "a".repeat(12001) }).success,
    ).toBe(false);
  });
});

describe("Support Audience & Announcement validation", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  const userId = "22222222-2222-4222-8222-222222222222";

  it("accepts all four supported audience modes", () => {
    const modes = [
      { type: "all_organizations" },
      { type: "selected_organizations", organizationIds: [orgId] },
      { type: "organization_all_members", organizationId: orgId },
      {
        type: "organization_selected_members",
        organizationId: orgId,
        userIds: [userId],
      },
    ];

    for (const audience of modes) {
      expect(supportAudienceSchema.safeParse(audience).success).toBe(true);
      expect(
        supportAnnouncementInputSchema.safeParse({
          title: "Maintenance Notice",
          body: "Scheduled maintenance details.",
          audience,
        }).success,
      ).toBe(true);
    }
  });

  it("requires explicit targets and valid UUIDs for restricted audiences", () => {
    for (const audience of [
      { type: "selected_organizations", organizationIds: [] },
      { type: "selected_organizations", organizationIds: ["not-a-uuid"] },
      {
        type: "organization_selected_members",
        organizationId: orgId,
        userIds: [],
      },
      {
        type: "organization_selected_members",
        organizationId: orgId,
        userIds: ["not-a-uuid"],
      },
      { type: "organization_all_members", organizationId: "not-a-uuid" },
      { type: "unknown" },
    ]) {
      expect(supportAudienceSchema.safeParse(audience).success).toBe(false);
    }
  });

  it("enforces title and body constraints on announcements", () => {
    const audience = { type: "all_organizations" as const };
    expect(
      supportAnnouncementInputSchema.safeParse({
        title: "",
        body: "Valid body",
        audience,
      }).success,
    ).toBe(false);
    expect(
      supportAnnouncementInputSchema.safeParse({
        title: "a".repeat(181),
        body: "Valid body",
        audience,
      }).success,
    ).toBe(false);
    expect(
      supportAnnouncementInputSchema.safeParse({
        title: "Valid title",
        body: "a".repeat(12001),
        audience,
      }).success,
    ).toBe(false);
  });
});
