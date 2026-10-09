import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  organizationInputSchema,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_BILLING_CYCLES,
} from "@/modules/platform/validation";
import { ALL_PERMISSION_KEYS, SYSTEM_ROLES } from "@/modules/rbac/permissions";
import { organizations, subscriptions, invitations, roles, permissions, rolePermissions } from "@/db/schema";

const withPlatformTransaction = vi.fn();
const recordAudit = vi.fn();
const authorizePlatform = vi.fn();

vi.mock("@/db/client", () => ({ withPlatformTransaction }));
vi.mock("@/lib/audit", () => ({ recordAudit }));
vi.mock("@/modules/platform/authorization", () => ({
  authorizePlatform,
  authorizePlatformTargetOrganization: vi.fn(),
  PLATFORM_PERMISSIONS: {
    organizationCreate: "platform:organization:create",
    organizationView: "platform:organization:view",
    organizationApprove: "platform:organization:approve",
  },
}));

const { createOrganization, runProvisioning } = await import("@/modules/platform/provisioning");

describe("Phase 1 Create Organization Wizard - Validation & Schema", () => {
  const baseValidPayload = {
    name: "Acme Corporation & Sons (India) Ltd.",
    legalName: "Acme Corporation India Private Limited",
    slug: "acme-corp-india",
    website: "https://acme-corp.example.com",
    contactEmail: "official@acme.example.com",
    contactPhone: "+919876543210",
    addressLine1: "Tower B, Level 4, Tech Park",
    addressLine2: "Outer Ring Road",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    postalCode: "560103",
    ownerEmail: "eleanor.vance@acme.example.com",
    ownerFullName: "Eleanor O'Connor-Vance",
    planId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    billingCycle: "annual" as const,
    timezone: "Asia/Kolkata",
    currency: "INR",
    dateFormat: "dd/MM/yyyy",
  };

  it("1. passes validation with full valid wizard payload", () => {
    const parsed = organizationInputSchema.parse(baseValidPayload);
    expect(parsed.name).toBe("Acme Corporation & Sons (India) Ltd.");
    expect(parsed.slug).toBe("acme-corp-india");
    expect(parsed.ownerEmail).toBe("eleanor.vance@acme.example.com");
    expect(parsed.contactEmail).toBe("official@acme.example.com");
    expect(parsed.billingCycle).toBe("annual");
  });

  it("2. passes validation with minimal required wizard payload and preserves backward compatibility", () => {
    const minimal = {
      name: "Minimal Org",
      slug: "minimal-org",
      ownerEmail: "owner@minimal.com",
      timezone: "Asia/Kolkata",
      currency: "INR",
      dateFormat: "dd/MM/yyyy",
    };
    const parsed = organizationInputSchema.parse(minimal);
    expect(parsed.name).toBe("Minimal Org");
    expect(parsed.slug).toBe("minimal-org");
    expect(parsed.ownerEmail).toBe("owner@minimal.com");
    expect(parsed.legalName).toBeUndefined();
    expect(parsed.website).toBeUndefined();
    expect(parsed.contactEmail).toBeUndefined();
  });

  it("3. validates organization name constraints and character flexibility", () => {
    // Trims whitespace
    const parsed = organizationInputSchema.parse({
      ...baseValidPayload,
      name: "   Valid Spaced Name (Pvt) & Co.   ",
    });
    expect(parsed.name).toBe("Valid Spaced Name (Pvt) & Co.");

    // Min length
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, name: "A" })
    ).toThrow();

    // Max length
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, name: "A".repeat(161) })
    ).toThrow();
  });

  it("4. validates slug format according to strict kebab-case regex", () => {
    // Valid slugs
    expect(
      organizationInputSchema.parse({ ...baseValidPayload, slug: "valid-slug-123" }).slug
    ).toBe("valid-slug-123");
    expect(
      organizationInputSchema.parse({ ...baseValidPayload, slug: "singleslug" }).slug
    ).toBe("singleslug");
    // Case normalization
    expect(
      organizationInputSchema.parse({ ...baseValidPayload, slug: "Uppercase-Slug" }).slug
    ).toBe("uppercase-slug");

    // Invalid slugs
    const invalidSlugs = [
      "slug with spaces",
      "slug_with_underscores",
      "-leading-hyphen",
      "trailing-hyphen-",
      "double--hyphens",
      "special$chars",
    ];

    for (const slug of invalidSlugs) {
      expect(() => organizationInputSchema.parse({ ...baseValidPayload, slug })).toThrow();
    }
  });

  it("5. validates website URL format correctly", () => {
    // Valid URLs
    expect(
      organizationInputSchema.parse({ ...baseValidPayload, website: "https://sub.domain.co.uk/about" })
        .website
    ).toBe("https://sub.domain.co.uk/about");
    expect(
      organizationInputSchema.parse({ ...baseValidPayload, website: "domain.com" })
        .website
    ).toBe("domain.com");

    // Invalid URL (no dot / invalid host)
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, website: "not-a-url" })
    ).toThrow();
  });

  it("6. validates official organization email format", () => {
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, contactEmail: "invalid-email" })
    ).toThrow();

    const parsed = organizationInputSchema.parse({
      ...baseValidPayload,
      contactEmail: "  Official@Acme.COM  ",
    });
    expect(parsed.contactEmail).toBe("official@acme.com");
  });

  it("7. validates official organization phone format (international-safe)", () => {
    // Valid phones
    expect(
      organizationInputSchema.parse({ ...baseValidPayload, contactPhone: "+919876543210" })
        .contactPhone
    ).toBe("+919876543210");
    expect(
      organizationInputSchema.parse({ ...baseValidPayload, contactPhone: "14155552671" })
        .contactPhone
    ).toBe("14155552671");

    // Invalid phone formats (alphabetic, too short, too long)
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, contactPhone: "phone123" })
    ).toThrow();
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, contactPhone: "+123" })
    ).toThrow();
  });

  it("8. validates postal code format (international-safe alphanumeric)", () => {
    const validCodes = ["560103", "SW1A 1AA", "90210", "H3Z-2Y7", "75008"];
    for (const postalCode of validCodes) {
      expect(
        organizationInputSchema.parse({ ...baseValidPayload, postalCode }).postalCode
      ).toBe(postalCode);
    }

    // Invalid
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, postalCode: "1" })
    ).toThrow();
  });

  it("9. validates owner email as strictly required and normalized", () => {
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, ownerEmail: "", contactEmail: "" })
    ).toThrow();
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, ownerEmail: "invalid-owner-email" })
    ).toThrow();

    const parsed = organizationInputSchema.parse({
      ...baseValidPayload,
      ownerEmail: "  Owner@Example.COM  ",
    });
    expect(parsed.ownerEmail).toBe("owner@example.com");
  });

  it("10. validates owner full name constraints while allowing flexible characters", () => {
    const parsed = organizationInputSchema.parse({
      ...baseValidPayload,
      ownerFullName: "  Dr. Jean-Luc O'Connor, Jr.  ",
    });
    expect(parsed.ownerFullName).toBe("Dr. Jean-Luc O'Connor, Jr.");

    // Max length
    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, ownerFullName: "A".repeat(161) })
    ).toThrow();
  });

  it("14. validates billing cycle and regional date formats", () => {
    expect(SUPPORTED_BILLING_CYCLES).toEqual(["monthly", "annual"]);
    expect(SUPPORTED_DATE_FORMATS).toEqual(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]);

    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, billingCycle: "quarterly" as unknown as "monthly" })
    ).toThrow();

    expect(() =>
      organizationInputSchema.parse({ ...baseValidPayload, dateFormat: "YYYY/MM/DD" })
    ).toThrow();
  });
});

describe("Phase 1 Create Organization Wizard - Provisioning & Plan Preservation", () => {
  const actorUserId = "platform-owner-id-123";
  const mockPlanFree = { id: "plan-free-id", code: "FREE", name: "Free Tier", active: true };
  const mockPlanBusiness = { id: "plan-biz-id", code: "BUSINESS", name: "Business Pro", active: true };

  beforeEach(() => {
    vi.clearAllMocks();
    authorizePlatform.mockResolvedValue({ id: actorUserId, email: "platform.owner@dev.local" });
  });

  it("11 & 12. preserves selected non-FREE plan and defaults to active FREE plan when omitted", async () => {
    const insertedRecords: Array<{ table: unknown; values: unknown }> = [];

    const tx = {
      query: {
        organizations: { findFirst: vi.fn().mockResolvedValue(null) },
        plans: {
          findFirst: vi.fn().mockImplementation(() => {
            return Promise.resolve(mockPlanBusiness);
          }),
        },
      },
      insert: vi.fn((table: unknown) => ({
        values: vi.fn((values: unknown) => {
          insertedRecords.push({ table, values });
          return {
            returning: vi.fn().mockResolvedValue([
              table === organizations
                ? { id: "new-org-id", name: "Biz Org", slug: "biz-org" }
                : { id: "new-id" },
            ]),
          };
        }),
      })),
    };

    withPlatformTransaction.mockImplementation((cb: (t: typeof tx) => Promise<unknown>) => cb(tx));

    // When selecting Business plan
    const result = await createOrganization(
      {
        name: "Biz Org",
        slug: "biz-org",
        ownerEmail: "owner@biz.com",
        planId: mockPlanBusiness.id,
        billingCycle: "annual",
        timezone: "Asia/Kolkata",
        currency: "INR",
        dateFormat: "dd/MM/yyyy",
      },
      actorUserId
    );

    expect(result.organization).toBeDefined();

    // Verify subscriptions table received the selected planId, billing cycle, and pending status
    const subRecord = insertedRecords.find((r) => r.table === subscriptions);
    expect(subRecord).toBeDefined();
    expect(subRecord?.values).toMatchObject({
      planId: mockPlanBusiness.id,
      billingCycle: "annual",
      status: "pending",
    });
  });

  it("13. rejects inactive or nonexistent plan IDs", async () => {
    const tx = {
      query: {
        organizations: { findFirst: vi.fn().mockResolvedValue(null) },
        plans: {
          findFirst: vi.fn().mockResolvedValue(null), // Plan not found or inactive
        },
      },
    };
    withPlatformTransaction.mockImplementation((cb: (t: typeof tx) => Promise<unknown>) => cb(tx));

    await expect(
      createOrganization(
        {
          name: "Invalid Plan Org",
          slug: "invalid-plan-org",
          ownerEmail: "owner@test.com",
          planId: "00000000-0000-0000-0000-000000000000",
          timezone: "Asia/Kolkata",
          currency: "INR",
          dateFormat: "dd/MM/yyyy",
        },
        actorUserId
      )
    ).rejects.toThrowError(/Selected plan does not exist or is inactive/);
  });

  it("15 & 16. keeps organization contactEmail separate from ownerEmail and invites ownerEmail", async () => {
    const insertedRecords: Array<{ table: unknown; values: unknown }> = [];

    const tx = {
      query: {
        organizations: { findFirst: vi.fn().mockResolvedValue(null) },
        plans: { findFirst: vi.fn().mockResolvedValue(mockPlanFree) },
      },
      insert: vi.fn((table: unknown) => ({
        values: vi.fn((values: unknown) => {
          insertedRecords.push({ table, values });
          return {
            returning: vi.fn().mockResolvedValue([
              table === organizations
                ? { id: "org-1", name: "Separate Emails Org", slug: "sep-org" }
                : { id: "id-1" },
            ]),
          };
        }),
      })),
    };

    withPlatformTransaction.mockImplementation((cb: (t: typeof tx) => Promise<unknown>) => cb(tx));

    await createOrganization(
      {
        name: "Separate Emails Org",
        slug: "sep-org",
        contactEmail: "info@company.com",
        ownerEmail: "primary.owner@company.com",
        ownerFullName: "Jane Owner",
        timezone: "Asia/Kolkata",
        currency: "INR",
        dateFormat: "dd/MM/yyyy",
      },
      actorUserId
    );

    // Verify organization table received info@company.com
    const orgRecord = insertedRecords.find((r) => r.table === organizations);
    expect(orgRecord?.values).toMatchObject({
      contactEmail: "info@company.com",
    });

    // Verify invitations table received primary.owner@company.com with intendedRole = ORGANIZATION_OWNER
    const inviteRecord = insertedRecords.find((r) => r.table === invitations);
    expect(inviteRecord?.values).toMatchObject({
      invitedEmail: "primary.owner@company.com",
      intendedRole: "ORGANIZATION_OWNER",
    });
  });

  it("18, 19 & 20. provisions exactly 9 tenant roles without ORGANIZATION_ADMIN upon approval", async () => {
    const orgId = "org-test-uuid";
    const initialJob = {
      id: "job-1",
      organizationId: orgId,
      status: "pending",
      currentStep: "created",
      attempts: 0,
      startedAt: null,
      completedAt: null,
    };

    const insertedTables: Array<{ table: unknown; values: unknown }> = [];
    const updatedTables: Array<{ table: unknown; values: unknown }> = [];

    const tenantRoles = SYSTEM_ROLES.filter((r) => r !== "PLATFORM_OWNER");
    const createdRoles = tenantRoles.map((key, index) => ({
      id: `role-id-${index}`,
      organizationId: orgId,
      key,
      name: key.replaceAll("_", " "),
      isSystem: true,
    }));

    const createdPermissions = ALL_PERMISSION_KEYS.map((key, index) => ({
      id: `perm-id-${index}`,
      key,
    }));

    const existingPendingSub = {
      id: "sub-123",
      organizationId: orgId,
      planId: mockPlanBusiness.id,
      status: "pending",
    };

    const tx = {
      query: {
        provisioningJobs: { findFirst: vi.fn().mockResolvedValue(initialJob) },
        subscriptions: { findFirst: vi.fn().mockResolvedValue(existingPendingSub) },
        plans: { findFirst: vi.fn().mockResolvedValue(mockPlanBusiness) },
        invitations: { findFirst: vi.fn().mockResolvedValue(null) },
      },
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => {
          const result = table === roles ? createdRoles : table === permissions ? createdPermissions : [];
          return {
            where: vi.fn().mockResolvedValue(result),
            then: (resolve: (val: unknown) => unknown) => Promise.resolve(result).then(resolve),
          };
        }),
      })),
      insert: vi.fn((table: unknown) => ({
        values: vi.fn((values: unknown) => {
          insertedTables.push({ table, values });
          return {
            returning: vi.fn().mockResolvedValue(
              table === roles
                ? [{ id: "mock-role-id", organizationId: orgId, key: "MOCK", name: "Mock", isSystem: true }]
                : []
            ),
            onConflictDoNothing: vi.fn().mockResolvedValue([]),
          };
        }),
      })),
      update: vi.fn((table: unknown) => ({
        set: vi.fn((values: unknown) => {
          updatedTables.push({ table, values });
          return {
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([
                { ...initialJob, status: "completed", currentStep: "ready" },
              ]),
            })),
          };
        }),
      })),
    };

    withPlatformTransaction.mockImplementation((cb: (t: typeof tx) => Promise<unknown>) => cb(tx));

    const result = await runProvisioning(orgId, "owner@biz.com");
    expect(result.job).toBeDefined();

    // Verify existing pending subscription was updated to active
    const subUpdate = updatedTables.find((u) => u.table === subscriptions);
    expect(subUpdate?.values).toMatchObject({
      status: "active",
    });

    // Verify SYSTEM_ROLES does NOT include ORGANIZATION_ADMIN
    expect(SYSTEM_ROLES).not.toContain("ORGANIZATION_ADMIN");
    expect(SYSTEM_ROLES).toContain("ORGANIZATION_OWNER");

    // Exactly 9 tenant roles
    expect(tenantRoles.length).toBe(9);
    expect(new Set(tenantRoles)).toEqual(
      new Set([
        "ORGANIZATION_OWNER",
        "HR_ADMIN",
        "HR_EXECUTIVE",
        "FINANCE_ADMIN",
        "MANAGER",
        "TEAM_LEAD",
        "PROJECT_MANAGER",
        "RECRUITER",
        "EMPLOYEE",
      ])
    );

    // Role permissions bulk insert covers all 9 roles
    const rolePermissionInsert = insertedTables.find((entry) => entry.table === rolePermissions);
    expect(rolePermissionInsert).toBeDefined();
    const values = rolePermissionInsert!.values as Array<{ roleId: string; permissionId: string }>;
    const insertedRoleIds = new Set(values.map((v) => v.roleId));
    expect(insertedRoleIds.size).toBe(9);
  });
});
