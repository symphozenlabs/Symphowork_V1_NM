import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_PERMISSION_KEYS, ROLE_PERMISSIONS, SYSTEM_ROLES } from "@/modules/rbac/permissions";
import { permissions, rolePermissions, roles, subscriptions } from "@/db/schema";

const withPlatformTransaction = vi.fn();
const recordAudit = vi.fn();

vi.mock("@/db/client", () => ({ withPlatformTransaction }));
vi.mock("@/lib/audit", () => ({ recordAudit }));

const { runProvisioning } = await import("@/modules/platform/provisioning");

const organizationId = "11111111-1111-1111-1111-111111111111";
const jobId = "22222222-2222-2222-2222-222222222222";
const primaryAdminEmail = "primary.admin@example.com";

function createProvisioningFixture() {
  const initialJob = {
    id: jobId,
    organizationId,
    status: "pending",
    currentStep: "created",
    attempts: 0,
    startedAt: null,
    completedAt: null,
  };

  const insertedTables: Array<{ table: unknown; values: unknown }> = [];
  const updatedTables: Array<{ table: unknown; values: unknown }> = [];

  const createdRoles = SYSTEM_ROLES.filter((r) => r !== "PLATFORM_OWNER").map((key, index) => ({
    id: `role-id-${index}`,
    organizationId,
    key,
    name: key.replaceAll("_", " "),
    isSystem: true,
  }));

  const createdPermissions = ALL_PERMISSION_KEYS.map((key, index) => ({
    id: `perm-id-${index}`,
    key,
  }));

  const tx = {
    query: {
      provisioningJobs: {
        findFirst: vi.fn().mockResolvedValue(initialJob),
      },
      plans: {
        findFirst: vi.fn().mockResolvedValue({ id: "plan-free-id", code: "FREE", name: "Free" }),
      },
      invitations: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
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
              ? [{ id: "mock-role-id", organizationId, key: "MOCK", name: "Mock", isSystem: true }]
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

  withPlatformTransaction.mockImplementation(async (callback: (transaction: typeof tx) => Promise<unknown>) => {
    return callback(tx);
  });

  return { initialJob, tx, insertedTables, updatedTables, createdRoles, createdPermissions };
}

describe("provisioning performance and role_permissions bulk insertion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bulk inserts permissions and role_permissions in single database calls instead of sequential loops", async () => {
    const fixture = createProvisioningFixture();

    const result = await runProvisioning(organizationId, primaryAdminEmail);

    expect(result.job).toBeDefined();

    // Verify rolePermissions was inserted in bulk
    const rolePermissionInsert = fixture.insertedTables.find((entry) => entry.table === rolePermissions);
    expect(rolePermissionInsert).toBeDefined();

    // Values must be an array of all mapped role permissions, NOT individual single inserts
    const values = rolePermissionInsert!.values as Array<{ roleId: string; permissionId: string }>;
    expect(Array.isArray(values)).toBe(true);

    // Calculate total expected permissions across all non-platform system roles
    const expectedTotal = Object.entries(ROLE_PERMISSIONS).reduce((acc, [, perms]) => acc + perms.length, 0);
    expect(values.length).toBe(expectedTotal);
    expect(values.length).toBeGreaterThan(300);

    // Verify each system role is represented
    const insertedRoleIds = new Set(values.map((v) => v.roleId));
    expect(insertedRoleIds.size).toBe(SYSTEM_ROLES.filter((r) => r !== "PLATFORM_OWNER").length);

    // Verify permissions table was also bulk inserted
    const permInsert = fixture.insertedTables.find((entry) => entry.table === permissions);
    expect(permInsert).toBeDefined();
    expect(Array.isArray(permInsert!.values)).toBe(true);
    expect((permInsert!.values as unknown[]).length).toBe(ALL_PERMISSION_KEYS.length);

    // Verify subscription was created with FREE plan
    const subInsert = fixture.insertedTables.find((entry) => entry.table === subscriptions);
    expect(subInsert).toBeDefined();
    expect(subInsert!.values).toMatchObject({
      organizationId,
      planId: "plan-free-id",
      status: "active",
    });

    // Verify audit log recorded
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId,
        action: "provisioning_completed",
      })
    );
  });
});
