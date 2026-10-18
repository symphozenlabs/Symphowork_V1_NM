import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, memberships, roles } from "@/db/schema";
import { AppError } from "@/lib/errors";

const authorize = vi.fn();
const resolveTenantContext = vi.fn();
const recordAudit = vi.fn();

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize,
  can: vi.fn(() => Promise.resolve(true)),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext,
}));

vi.mock("@/lib/audit", () => ({
  recordAudit,
}));

const organizationId = "org-test-1";
const ownerEmployeeId = "emp-owner-001";
const regularEmployeeId = "emp-reg-002";
const hrAdminUserId = "user-hr-admin";
const hrExecutiveUserId = "user-hr-exec";
const ownerUserId = "user-org-owner";
const platformOwnerUserId = "user-platform-owner";

let mockEmployeeToReturn: Record<string, unknown> | null = null;
let mockUsers: Record<string, { id: string; platformRole: string }> = {
  [ownerUserId]: { id: ownerUserId, platformRole: "NONE" },
  [hrAdminUserId]: { id: hrAdminUserId, platformRole: "NONE" },
  [hrExecutiveUserId]: { id: hrExecutiveUserId, platformRole: "NONE" },
  [platformOwnerUserId]: { id: platformOwnerUserId, platformRole: "PLATFORM_OWNER" },
};

function findValueInSql(obj: unknown, target: string, seen = new Set<unknown>()): boolean {
  if (!obj) return false;
  if (typeof obj === "string") return obj === target;
  if (typeof obj !== "object") return false;
  if (seen.has(obj)) return false;
  seen.add(obj);

  if ("value" in obj && (obj as { value?: unknown }).value === target) return true;
  if (Array.isArray(obj)) {
    return obj.some((item) => findValueInSql(item, target, seen));
  }
  for (const key of Object.keys(obj)) {
    if (key === "table" || key === "encoder") continue;
    if (findValueInSql((obj as Record<string, unknown>)[key], target, seen)) return true;
  }
  return false;
}

vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        innerJoin: () => ({
          where: (cond: unknown) => ({
            limit: () => {
              if (table === memberships) {
                if (findValueInSql(cond, ownerUserId)) {
                  return Promise.resolve([{ id: "mem-owner" }]);
                }
                return Promise.resolve([]);
              }
              return Promise.resolve([]);
            },
          }),
        }),
        where: () => {
          if (table === employees) {
            return Promise.resolve(mockEmployeeToReturn ? [mockEmployeeToReturn] : []);
          }
          if (table === roles) {
            return Promise.resolve([{ id: "role-target", key: "RECRUITER" }]);
          }
          return Promise.resolve([]);
        },
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve(mockEmployeeToReturn ? [mockEmployeeToReturn] : []),
        }),
      }),
    }),
    insert: () => ({
      values: () => Promise.resolve([]),
    }),
    query: {
      users: {
        findFirst: vi.fn(({ where }: { where?: unknown }) => {
          if (findValueInSql(where, platformOwnerUserId)) {
            return Promise.resolve(mockUsers[platformOwnerUserId]);
          }
          if (findValueInSql(where, ownerUserId)) {
            return Promise.resolve(mockUsers[ownerUserId]);
          }
          if (findValueInSql(where, hrAdminUserId)) {
            return Promise.resolve(mockUsers[hrAdminUserId]);
          }
          return Promise.resolve(null);
        }),
      },
      memberships: {
        findFirst: vi.fn(({ where }: { where?: unknown }) => {
          if (findValueInSql(where, ownerUserId)) {
            return Promise.resolve({
              id: "mem-owner",
              userId: ownerUserId,
              organizationId,
              roleId: "role-owner",
              status: "active",
            });
          }
          if (findValueInSql(where, hrAdminUserId)) {
            return Promise.resolve({
              id: "mem-hr",
              userId: hrAdminUserId,
              organizationId,
              roleId: "role-hradmin",
              status: "active",
            });
          }
          if (findValueInSql(where, hrExecutiveUserId)) {
            return Promise.resolve({
              id: "mem-hrexec",
              userId: hrExecutiveUserId,
              organizationId,
              roleId: "role-hrexec",
              status: "active",
            });
          }
          return Promise.resolve(null);
        }),
      },
      roles: {
        findFirst: vi.fn(({ where }: { where?: unknown }) => {
          if (findValueInSql(where, "role-owner")) {
            return Promise.resolve({
              id: "role-owner",
              key: "ORGANIZATION_OWNER",
              name: "Organization Owner",
            });
          }
          if (findValueInSql(where, "role-hradmin")) {
            return Promise.resolve({
              id: "role-hradmin",
              key: "HR_ADMIN",
              name: "HR Administrator",
            });
          }
          if (findValueInSql(where, "role-hrexec")) {
            return Promise.resolve({
              id: "role-hrexec",
              key: "HR_EXECUTIVE",
              name: "HR Executive",
            });
          }
          return Promise.resolve(null);
        }),
      },
      invitations: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
    },
  },
  withTenantTransaction: vi.fn((_orgId, fn) =>
    fn({
      query: {
        roles: {
          findFirst: vi.fn(() =>
            Promise.resolve({
              id: "role-owner",
              key: "ORGANIZATION_OWNER",
              name: "Organization Owner",
            })
          ),
        },
      },
    })
  ),
}));

describe("Organization Owner Employee Protection — Regression Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockEmployeeToReturn = {
      id: ownerEmployeeId,
      organizationId,
      userId: ownerUserId,
      firstName: "Owner",
      lastName: "User",
      displayName: "Owner User",
      status: "active",
    };

    mockUsers = {
      [ownerUserId]: { id: ownerUserId, platformRole: "NONE" },
      [hrAdminUserId]: { id: hrAdminUserId, platformRole: "NONE" },
      [platformOwnerUserId]: { id: platformOwnerUserId, platformRole: "PLATFORM_OWNER" },
    };

    resolveTenantContext.mockResolvedValue({
      organization: { id: organizationId, name: "Test Org" },
      user: { id: hrAdminUserId, platformRole: "NONE" },
      role: { key: "HR_ADMIN" },
    });
  });

  describe("isOrganizationOwnerEmployee and isActorPrivilegedForOwnerRecord helpers", () => {
    it("correctly identifies Organization Owner employee record linked to owner membership", async () => {
      const { isOrganizationOwnerEmployee } = await import("@/modules/employees/service");
      const isOwner = await isOrganizationOwnerEmployee(organizationId, ownerEmployeeId);
      expect(isOwner).toBe(true);
    }, 15000);

    it("identifies actor privilege correctly for owner vs platform admin vs HR admin", async () => {
      const { isActorPrivilegedForOwnerRecord } = await import("@/modules/employees/service");

      // Platform owner is privileged
      const isPlatformPrivileged = await isActorPrivilegedForOwnerRecord(organizationId, platformOwnerUserId);
      expect(isPlatformPrivileged).toBe(true);

      // Organization owner is privileged
      const isOwnerPrivileged = await isActorPrivilegedForOwnerRecord(organizationId, ownerUserId);
      expect(isOwnerPrivileged).toBe(true);

      // HR Admin is NOT privileged to mutate owner record
      const isHrPrivileged = await isActorPrivilegedForOwnerRecord(organizationId, hrAdminUserId);
      expect(isHrPrivileged).toBe(false);
    }, 15000);
  });

  describe("updateEmployee service method", () => {
    it("rejects non-owner tenant role attempting to update Organization Owner employee record with 403 Forbidden", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      await expect(
        updateEmployee(organizationId, hrAdminUserId, ownerEmployeeId, { firstName: "Tampered" })
      ).rejects.toThrow(
        new AppError(
          "FORBIDDEN",
          "The Organization Owner employee record is protected from modification by other tenant roles.",
          403
        )
      );
    });

    it("allows Organization Owner to update their own employee record", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      const result = await updateEmployee(organizationId, ownerUserId, ownerEmployeeId, {
        firstName: "Owner Updated",
      });

      expect(result).toBeDefined();
    });

    it("allows Platform Owner to update the Organization Owner employee record", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      const result = await updateEmployee(organizationId, platformOwnerUserId, ownerEmployeeId, {
        firstName: "Admin Updated",
      });

      expect(result).toBeDefined();
    });

    it("allows HR Admin to update another non-owner employee record normally", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      mockEmployeeToReturn = {
        id: regularEmployeeId,
        organizationId,
        userId: "user-reg",
        firstName: "Regular",
        lastName: "Worker",
        displayName: "Regular Worker",
        status: "active",
      };

      const result = await updateEmployee(organizationId, hrAdminUserId, regularEmployeeId, {
        firstName: "Regular Updated",
      });

      expect(result).toBeDefined();
    });

    it("allows Organization Owner to update employee records across all roles (HR Admin, Recruiter, PM, Employee)", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      mockEmployeeToReturn = {
        id: regularEmployeeId,
        organizationId,
        userId: "user-reg",
        firstName: "Regular",
        lastName: "Worker",
        displayName: "Regular Worker",
        status: "active",
      };

      const result = await updateEmployee(organizationId, ownerUserId, regularEmployeeId, {
        firstName: "Owner Modified Worker",
        targetRole: "RECRUITER",
      });

      expect(result).toBeDefined();
    });

    it("rejects unauthorized actor attempting to assign roles beyond their permission level", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      mockEmployeeToReturn = {
        id: regularEmployeeId,
        organizationId,
        userId: "user-reg",
        firstName: "Regular",
        lastName: "Worker",
        displayName: "Regular Worker",
        status: "active",
      };

      await expect(
        updateEmployee(organizationId, hrExecutiveUserId, regularEmployeeId, {
          targetRole: "HR_ADMIN",
        })
      ).rejects.toThrow(
        new AppError(
          "FORBIDDEN",
          "You are not authorized to assign the HR_ADMIN role.",
          403
        )
      );
    });

    it("rejects attempt to change Organization Owner system role", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      await expect(
        updateEmployee(organizationId, ownerUserId, ownerEmployeeId, {
          targetRole: "EMPLOYEE",
        })
      ).rejects.toThrow(
        new AppError(
          "FORBIDDEN",
          "The Organization Owner role is protected and cannot be modified.",
          403
        )
      );
    });

    it("rejects attempt to assign ORGANIZATION_OWNER or PLATFORM_OWNER role via employee update", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      mockEmployeeToReturn = {
        id: regularEmployeeId,
        organizationId,
        userId: "user-reg",
        firstName: "Regular",
        lastName: "Worker",
        displayName: "Regular Worker",
        status: "active",
      };

      await expect(
        updateEmployee(organizationId, ownerUserId, regularEmployeeId, {
          targetRole: "ORGANIZATION_OWNER",
        })
      ).rejects.toThrow(
        new AppError(
          "FORBIDDEN",
          "Cannot assign protected owner roles through employee profile updates.",
          403
        )
      );
    });

    it("rejects team selection when target employee is assigned an HR role", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      mockEmployeeToReturn = {
        id: regularEmployeeId,
        organizationId,
        userId: "user-reg",
        firstName: "Regular",
        lastName: "Worker",
        displayName: "Regular Worker",
        status: "active",
      };

      await expect(
        updateEmployee(organizationId, ownerUserId, regularEmployeeId, {
          targetRole: "HR_ADMIN",
          teamId: "team-123",
        })
      ).rejects.toThrow(
        new AppError(
          "VALIDATION_ERROR",
          "Team selection is not permitted for HR roles.",
          400
        )
      );
    });

    it("rejects location selection when target employee is assigned an HR role", async () => {
      const { updateEmployee } = await import("@/modules/employees/service");

      mockEmployeeToReturn = {
        id: regularEmployeeId,
        organizationId,
        userId: "user-reg",
        firstName: "Regular",
        lastName: "Worker",
        displayName: "Regular Worker",
        status: "active",
      };

      await expect(
        updateEmployee(organizationId, ownerUserId, regularEmployeeId, {
          targetRole: "HR_ADMIN",
          locationId: "loc-123",
        })
      ).rejects.toThrow(
        new AppError(
          "VALIDATION_ERROR",
          "Location selection is not permitted for HR roles.",
          400
        )
      );
    });
  });

  describe("API routes mutation protection", () => {
    it("POST /api/app/employees/[employeeId]/invite rejects non-owner attempting to invite/resend for owner record", async () => {
      const { POST } = await import("@/app/api/app/employees/[employeeId]/invite/route");

      const req = new Request(`http://localhost/api/app/employees/${ownerEmployeeId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "owner@test.com" }),
      });

      const response = await POST(req, {
        params: Promise.resolve({ employeeId: ownerEmployeeId }),
      });

      const json = await response.json();
      expect(response.status).toBe(403);
      expect(json.error?.message).toContain("Organization Owner employee record is protected");
    });

    it("POST /api/app/employees/[employeeId]/invite/revoke rejects non-owner attempting to revoke owner invitation", async () => {
      const { POST } = await import("@/app/api/app/employees/[employeeId]/invite/revoke/route");

      const req = new Request(`http://localhost/api/app/employees/${ownerEmployeeId}/invite/revoke`, {
        method: "POST",
      });

      const response = await POST(req, {
        params: Promise.resolve({ employeeId: ownerEmployeeId }),
      });

      const json = await response.json();
      expect(response.status).toBe(403);
      expect(json.error?.message).toContain("Organization Owner employee record is protected");
    });

    it("PATCH /api/app/employees/[employeeId]/onboarding rejects non-owner attempting to alter owner checklist items", async () => {
      const { PATCH } = await import("@/app/api/app/employees/[employeeId]/onboarding/route");

      const req = new Request(`http://localhost/api/app/employees/${ownerEmployeeId}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: "item-1", status: "completed" }),
      });

      const response = await PATCH(req, {
        params: Promise.resolve({ employeeId: ownerEmployeeId }),
      });

      const json = await response.json();
      expect(response.status).toBe(403);
      expect(json.error?.message).toContain("Organization Owner onboarding records are protected");
    });

    it("POST /api/app/employees/[employeeId]/onboarding rejects non-owner attempting to complete owner onboarding", async () => {
      const { POST } = await import("@/app/api/app/employees/[employeeId]/onboarding/route");

      const req = new Request(`http://localhost/api/app/employees/${ownerEmployeeId}/onboarding`, {
        method: "POST",
      });

      const response = await POST(req, {
        params: Promise.resolve({ employeeId: ownerEmployeeId }),
      });

      const json = await response.json();
      expect(response.status).toBe(403);
      expect(json.error?.message).toContain("Organization Owner onboarding records are protected");
    });

    it("GET /api/app/employees/[employeeId] rejects unauthorized roles lacking employee.read permission with 403", async () => {
      const { GET } = await import("@/app/api/app/employees/[employeeId]/route");

      authorize.mockRejectedValueOnce(new AppError("FORBIDDEN", "You are not authorized to perform this action.", 403));

      const req = new Request(`http://localhost/api/app/employees/${ownerEmployeeId}`);
      const response = await GET(req, {
        params: Promise.resolve({ employeeId: ownerEmployeeId }),
      });

      const json = await response.json();
      expect(response.status).toBe(403);
      expect(json.error?.code).toBe("FORBIDDEN");
    });
  });
});
