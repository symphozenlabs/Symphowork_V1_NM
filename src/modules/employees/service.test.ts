import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, onboarding, organizations, users, memberships, roles } from "@/db/schema";

const { recordAudit, recordAuditInTransaction } = vi.hoisted(() => ({
  recordAudit: vi.fn(),
  recordAuditInTransaction: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  recordAudit,
  recordAuditInTransaction,
}));

import { getOrEnsureEmployeeForUser } from "@/modules/employees/service";

describe("getOrEnsureEmployeeForUser", () => {
  const organizationId = "org-0001";
  const userId = "user-0001";
  const roleId = "role-0001";

  const mockUser = {
    id: userId,
    email: "admin@example.com",
    fullName: "Jane Doe",
  } as typeof users.$inferSelect;

  const mockMembership = {
    id: "mem-0001",
    userId,
    organizationId,
    roleId,
    status: "active",
  } as typeof memberships.$inferSelect;

  const mockExistingEmployee = {
    id: "emp-existing",
    organizationId,
    userId,
    employeeId: "EMP0001",
    displayName: "Jane Doe",
    status: "active",
  } as typeof employees.$inferSelect;

  function createMockExecutor(options: {
    existingEmployee?: typeof employees.$inferSelect | null;
    unlinkedEmployee?: typeof employees.$inferSelect | null;
    roleKey?: string;
  } = {}) {
    const insertedRecords: { table: unknown; values: unknown }[] = [];
    const updatedRecords: { table: unknown; set: unknown }[] = [];

    const executor = {
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === employees) {
              if (options.existingEmployee) return Promise.resolve([options.existingEmployee]);
              if (options.unlinkedEmployee) return Promise.resolve([options.unlinkedEmployee]);
              return Promise.resolve([]);
            }
            if (table === roles) {
              return Promise.resolve([{ id: roleId, key: options.roleKey || "ORGANIZATION_OWNER" }]);
            }
            if (table === memberships) {
              return Promise.resolve([mockMembership]);
            }
            if (table === users) {
              return Promise.resolve([mockUser]);
            }
            return Promise.resolve([]);
          }),
        })),
      })),
      query: {
        users: { findFirst: vi.fn().mockResolvedValue(mockUser) },
        memberships: { findFirst: vi.fn().mockResolvedValue(mockMembership) },
        roles: { findFirst: vi.fn().mockResolvedValue({ id: roleId, key: options.roleKey || "ORGANIZATION_OWNER" }) },
      },
      update: vi.fn((table: unknown) => ({
        set: vi.fn((setData: unknown) => {
          updatedRecords.push({ table, set: setData });
          return {
            where: vi.fn(() => ({
              returning: vi.fn().mockImplementation(() => {
                if (table === organizations) {
                  return Promise.resolve([{ prefix: "EMP", next: 2, padding: 4 }]);
                }
                if (table === employees) {
                  return Promise.resolve([{ ...options.unlinkedEmployee, userId, status: "active" }]);
                }
                return Promise.resolve([]);
              }),
            })),
          };
        }),
      })),
      insert: vi.fn((table: unknown) => ({
        values: vi.fn((valuesData: unknown) => {
          insertedRecords.push({ table, values: valuesData });
          return {
            returning: vi.fn().mockImplementation(() => {
              if (table === employees) {
                return Promise.resolve([{
                  id: "emp-new-001",
                  organizationId,
                  userId,
                  employeeId: "EMP0001",
                  firstName: "Jane",
                  lastName: "Doe",
                  displayName: "Jane Doe",
                  workEmail: "admin@example.com",
                  status: "active",
                }]);
              }
              if (table === onboarding) {
                return Promise.resolve([{ id: "onboard-001", organizationId, employeeId: "emp-new-001", status: "completed" }]);
              }
              return Promise.resolve([]);
            }),
          };
        }),
      })),
    };

    return { executor, insertedRecords, updatedRecords };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing employee immediately when already linked", async () => {
    const { executor, insertedRecords } = createMockExecutor({ existingEmployee: mockExistingEmployee });
    const employee = await getOrEnsureEmployeeForUser(organizationId, userId, executor as never);

    expect(employee).toEqual(mockExistingEmployee);
    expect(insertedRecords).toHaveLength(0);
  });

  it("links an unlinked employee record by matching email", async () => {
    const unlinked = {
      id: "emp-unlinked",
      organizationId,
      userId: null,
      workEmail: "admin@example.com",
      displayName: "Jane Doe",
      status: "invited",
    } as unknown as typeof employees.$inferSelect;

    let selectCount = 0;
    const { executor, updatedRecords } = createMockExecutor();
    executor.select = vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === employees) {
            selectCount++;
            if (selectCount === 1) return Promise.resolve([]);
            return Promise.resolve([unlinked]);
          }
          if (table === memberships) return Promise.resolve([mockMembership]);
          if (table === users) return Promise.resolve([mockUser]);
          return Promise.resolve([]);
        }),
      })),
    }));

    const employee = await getOrEnsureEmployeeForUser(organizationId, userId, executor as never, {
      user: mockUser,
      membership: mockMembership,
    });

    expect(employee.userId).toBe(userId);
    expect(employee.status).toBe("active");
    expect(updatedRecords.some((r) => r.table === employees)).toBe(true);
  });

  it("auto-provisions employee profile, onboarding, and history for ORGANIZATION_OWNER", async () => {
    const { executor, insertedRecords, updatedRecords } = createMockExecutor({ roleKey: "ORGANIZATION_OWNER" });

    const employee = await getOrEnsureEmployeeForUser(organizationId, userId, executor as never, {
      user: mockUser,
      roleKey: "ORGANIZATION_OWNER",
      membership: mockMembership,
    });

    expect(employee.employeeId).toBe("EMP0001");
    expect(employee.userId).toBe(userId);
    expect(updatedRecords.some((r) => r.table === organizations)).toBe(true);
    expect(insertedRecords.some((r) => r.table === employees)).toBe(true);
    expect(insertedRecords.some((r) => r.table === onboarding)).toBe(true);
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "employee_profile_auto_provisioned",
      resource: "employee",
      organizationId,
    }));
  });

  it("does not auto-provision employee profile for non-owner roles such as ORGANIZATION_ADMIN", async () => {
    const { executor } = createMockExecutor({ roleKey: "ORGANIZATION_ADMIN" });

    await expect(
      getOrEnsureEmployeeForUser(organizationId, userId, executor as never, {
        user: mockUser,
        roleKey: "ORGANIZATION_ADMIN",
        membership: mockMembership,
      })
    ).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("throws 404 NOT_FOUND when a regular EMPLOYEE is not linked", async () => {
    const { executor } = createMockExecutor({ roleKey: "EMPLOYEE" });

    await expect(
      getOrEnsureEmployeeForUser(organizationId, userId, executor as never, {
        user: mockUser,
        roleKey: "EMPLOYEE",
        membership: mockMembership,
      })
    ).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("throws 403 FORBIDDEN when user has no active membership", async () => {
    const { executor } = createMockExecutor();
    executor.select = vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === employees) return Promise.resolve([]);
          if (table === users) return Promise.resolve([mockUser]);
          if (table === memberships) return Promise.resolve([]);
          return Promise.resolve([]);
        }),
      })),
    }));
    executor.query.memberships.findFirst.mockResolvedValue(null);

    await expect(
      getOrEnsureEmployeeForUser(organizationId, userId, executor as never, {
        user: mockUser,
      })
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });
});
