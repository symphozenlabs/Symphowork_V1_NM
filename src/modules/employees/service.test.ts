import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, onboarding, organizations, users, memberships, roles, departments, designations, shifts, employmentTypes } from "@/db/schema";

const { recordAudit, recordAuditInTransaction } = vi.hoisted(() => ({
  recordAudit: vi.fn(),
  recordAuditInTransaction: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  recordAudit,
  recordAuditInTransaction,
}));

import { getOrEnsureEmployeeForUser, getEmployeeDetails } from "@/modules/employees/service";

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

describe("getEmployeeDetails", () => {
  const organizationId = "org-1";
  const employeeId = "emp-1";

  it("returns enriched employee details with all relational fields and system role", async () => {
    const mockEmp = {
      id: employeeId,
      organizationId,
      userId: "user-1",
      employeeId: "EMP0001",
      displayName: "Jane Doe",
      firstName: "Jane",
      lastName: "Doe",
      status: "active",
      departmentId: "dept-1",
      designationId: "desig-1",
      shiftId: "shift-1",
      employmentTypeId: "type-1",
      reportingManagerId: "mgr-1",
      joiningDate: "2026-01-15",
      workEmail: "jane@company.com",
    };

    const mockDept = { id: "dept-1", organizationId, name: "Human Resources", code: "HR", status: "active" };
    const mockDesig = { id: "desig-1", organizationId, name: "HR Manager", code: "HR-MGR", level: 2, status: "active" };
    const mockShift = { id: "shift-1", organizationId, name: "Day Shift", code: "DAY", startTime: "09:00:00", endTime: "18:00:00", breakMinutes: 60, graceMinutes: 15, overnight: false, status: "active" };
    const mockType = { id: "type-1", organizationId, name: "Full-time", code: "FT", status: "active" };
    const mockMgr = { id: "mgr-1", organizationId, displayName: "Boss Person", employeeId: "EMP0000", workEmail: "boss@company.com" };

    let employeeQueryCount = 0;
    const executor = {
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === employees) {
              employeeQueryCount++;
              if (employeeQueryCount === 1) return Promise.resolve([mockEmp]);
              return Promise.resolve([mockMgr]);
            }
            if (table === departments) return Promise.resolve([mockDept]);
            if (table === designations) return Promise.resolve([mockDesig]);
            if (table === shifts) return Promise.resolve([mockShift]);
            if (table === employmentTypes) return Promise.resolve([mockType]);
            return Promise.resolve([]);
          }),
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { userId: "user-1", roleKey: "HR_ADMIN", roleName: "HR Admin" },
            ]),
          }),
        })),
      })),
    };

    const details = await getEmployeeDetails(organizationId, employeeId, executor as never);

    expect(details).not.toBeNull();
    expect(details?.department?.name).toBe("Human Resources");
    expect(details?.department?.code).toBe("HR");
    expect(details?.designation?.name).toBe("HR Manager");
    expect(details?.designation?.level).toBe(2);
    expect(details?.shift?.name).toBe("Day Shift");
    expect(details?.shift?.startTime).toBe("09:00:00");
    expect(details?.shift?.endTime).toBe("18:00:00");
    expect(details?.shift?.breakMinutes).toBe(60);
    expect(details?.shift?.graceMinutes).toBe(15);
    expect(details?.shift?.overnight).toBe(false);
    expect(details?.employmentType?.name).toBe("Full-time");
    expect(details?.reportingManager?.displayName).toBe("Boss Person");
    expect(details?.roleKey).toBe("HR_ADMIN");
    expect(details?.roleTitle).toBe("HR Admin");
  });

  it("handles unassigned / null relations gracefully", async () => {
    const mockEmpSparse = {
      id: "emp-sparse",
      organizationId,
      userId: null,
      employeeId: "EMP0002",
      displayName: "New Hire",
      status: "invited",
      departmentId: null,
      designationId: null,
      shiftId: null,
      employmentTypeId: null,
      reportingManagerId: null,
    };

    const executor = {
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === employees) return Promise.resolve([mockEmpSparse]);
            return Promise.resolve([]);
          }),
        })),
      })),
    };

    const details = await getEmployeeDetails(organizationId, "emp-sparse", executor as never);

    expect(details).not.toBeNull();
    expect(details?.department).toBeNull();
    expect(details?.designation).toBeNull();
    expect(details?.shift).toBeNull();
    expect(details?.employmentType).toBeNull();
    expect(details?.reportingManager).toBeNull();
  });

  it("returns null when employee does not exist in target organization (tenant isolation)", async () => {
    const executor = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
    };

    const details = await getEmployeeDetails("other-org", "emp-missing", executor as never);
    expect(details).toBeNull();
  });
});
