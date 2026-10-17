/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { departments, employees, memberships } from "@/db/schema";
import {
  DEFAULT_ELIGIBLE_MANAGER_ROLES,
  listEligibleManagers,
  validateManagerEmployee,
  createDepartment,
  updateDepartment,
} from "./service";
import { enrichEmployeesWithRoles, listEmployees } from "@/modules/employees/service";

// Hoist mocks
const { mockClient, authorize, resolveTenantContext, recordAudit, isActorPrivilegedForOwnerRecord } = vi.hoisted(() => {
  const mockClient: any = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  };
  mockClient.transaction.mockImplementation(async (callback: any) => callback(mockClient));
  return {
    mockClient,
    authorize: vi.fn(),
    resolveTenantContext: vi.fn(),
    recordAudit: vi.fn(),
    isActorPrivilegedForOwnerRecord: vi.fn(),
  };
});

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize,
  can: vi.fn(() => Promise.resolve(true)),
  getRolePermissionSet: vi.fn(() => Promise.resolve(new Set())),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext,
}));

vi.mock("@/lib/audit", () => ({
  recordAudit,
}));

vi.mock("@/modules/employees/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/employees/service")>();
  return {
    ...actual,
    isActorPrivilegedForOwnerRecord,
  };
});

vi.mock("@/db/client", () => ({
  db: mockClient,
  withTenantTransaction: vi.fn(async (orgId: string, cb: any) => cb(mockClient)),
}));

// Test fixtures
const orgId = "org-test-100";
const crossOrgId = "org-other-200";

const ownerEmp = {
  id: "emp-owner-001",
  organizationId: orgId,
  userId: "user-owner-001",
  employeeId: "EMP001",
  displayName: "Naresh S",
  workEmail: "owner@nareshtechnologies.example",
  phone: "1234567890",
  status: "active" as const,
  roleKey: "ORGANIZATION_OWNER",
  roleTitle: "Organization Owner",
};

const hrAdminEmp = {
  id: "emp-hr-002",
  organizationId: orgId,
  userId: "user-hr-002",
  employeeId: "EMP002",
  displayName: "Arjun Kumar",
  workEmail: "arjun@nareshtechnologies.example",
  phone: "9876543210",
  status: "active" as const,
  roleKey: "HR_ADMIN",
  roleTitle: "HR Admin",
};

const managerEmp = {
  id: "emp-mgr-003",
  organizationId: orgId,
  userId: "user-mgr-003",
  employeeId: "EMP003",
  displayName: "Priya Sharma",
  workEmail: "priya@nareshtechnologies.example",
  phone: "5551234567",
  status: "active" as const,
  roleKey: "MANAGER",
  roleTitle: "Manager",
};

const inactiveEmp = {
  id: "emp-inactive-004",
  organizationId: orgId,
  userId: "user-inact-004",
  employeeId: "EMP004",
  displayName: "Inactive Employee",
  workEmail: "inactive@nareshtechnologies.example",
  phone: null,
  status: "inactive" as const,
  roleKey: "MANAGER",
  roleTitle: "Manager",
};

const crossOrgEmp = {
  id: "emp-cross-005",
  organizationId: crossOrgId,
  userId: "user-cross-005",
  employeeId: "EMP999",
  displayName: "External Employee",
  workEmail: "external@other.example",
  phone: null,
  status: "active" as const,
  roleKey: "MANAGER",
  roleTitle: "Manager",
};

const hrDept = {
  id: "dept-hr-101",
  organizationId: orgId,
  code: "HR",
  name: "Human Resources",
  description: "HR Department",
  headEmployeeId: hrAdminEmp.id,
  status: "active" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const engDept = {
  id: "dept-eng-202",
  organizationId: orgId,
  code: "ENG",
  name: "Engineering",
  description: "Engineering Department",
  headEmployeeId: null,
  status: "active" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMemberships = [
  { userId: ownerEmp.userId, roleKey: "ORGANIZATION_OWNER", roleName: "Organization Owner" },
  { userId: hrAdminEmp.userId, roleKey: "HR_ADMIN", roleName: "HR Admin" },
  { userId: managerEmp.userId, roleKey: "MANAGER", roleName: "Manager" },
  { userId: inactiveEmp.userId, roleKey: "MANAGER", roleName: "Manager" },
  { userId: crossOrgEmp.userId, roleKey: "MANAGER", roleName: "Manager" },
];

let targetEmployee: any = null;
let existingManagingDept: any = null;
let currentDepartmentToFind: any = null;
let activeDepartments: any[] = [];
let eligibleEmployees: any[] = [];

describe("Department Manager Dropdown & Assignment Regression Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorize.mockResolvedValue(true);
    isActorPrivilegedForOwnerRecord.mockResolvedValue(true);

    activeDepartments = [hrDept, engDept];
    eligibleEmployees = [ownerEmp, hrAdminEmp, managerEmp, inactiveEmp, crossOrgEmp];
    targetEmployee = null;
    existingManagingDept = null;
    currentDepartmentToFind = null;

    mockClient.select.mockImplementation((fields?: any) => ({
      from: vi.fn((table: any) => {
        // 1. memberships query in enrichEmployeesWithRoles
        if (table === memberships) {
          return {
            innerJoin: vi.fn(() => ({
              where: vi.fn().mockResolvedValue(mockMemberships),
            })),
          };
        }

        // 2. departments table query
        if (table === departments) {
          return {
            where: vi.fn(() => ({
              limit: vi.fn().mockImplementation(async (count: number) => {
                if (existingManagingDept) {
                  return [existingManagingDept].slice(0, count);
                }
                if (currentDepartmentToFind) {
                  const dept = currentDepartmentToFind;
                  currentDepartmentToFind = null;
                  return [dept].slice(0, count);
                }
                return [];
              }),
              then: (resolve: any) => Promise.resolve(activeDepartments).then(resolve),
            })),
            limit: vi.fn().mockImplementation(async (count: number) => {
              if (existingManagingDept) {
                return [existingManagingDept].slice(0, count);
              }
              if (currentDepartmentToFind) {
                const dept = currentDepartmentToFind;
                currentDepartmentToFind = null;
                return [dept].slice(0, count);
              }
              return [];
            }),
            then: (resolve: any) => Promise.resolve(activeDepartments).then(resolve),
          };
        }

        // 3. employees table query
        if (table === employees) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn((lim: number) => ({
                  offset: vi.fn(async (off: number) => eligibleEmployees.slice(off, off + lim)),
                })),
                then: (resolve: any) => Promise.resolve(eligibleEmployees).then(resolve),
              })),
              limit: vi.fn().mockImplementation(async (count: number) => {
                if (targetEmployee) {
                  return [targetEmployee].slice(0, count);
                }
                return [];
              }),
              then: (resolve: any) => {
                if (fields && typeof fields === "object" && "count" in fields) {
                  return Promise.resolve([{ count: eligibleEmployees.length }]).then(resolve);
                }
                return Promise.resolve(eligibleEmployees).then(resolve);
              },
            })),
            orderBy: vi.fn(() => ({
              limit: vi.fn((lim: number) => ({
                offset: vi.fn(async (off: number) => eligibleEmployees.slice(off, off + lim)),
              })),
              then: (resolve: any) => Promise.resolve(eligibleEmployees).then(resolve),
            })),
          };
        }

        return {
          innerJoin: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
          where: vi.fn(() => ({
            orderBy: vi.fn().mockResolvedValue([]),
            limit: vi.fn().mockResolvedValue([]),
            then: (resolve: any) => Promise.resolve([]).then(resolve),
          })),
        };
      }),
    }));

    mockClient.insert.mockImplementation(() => ({
      values: vi.fn((values: any) => ({
        returning: vi.fn().mockResolvedValue([{ id: "new-dept-id", ...values }]),
      })),
    }));

    mockClient.update.mockImplementation(() => ({
      set: vi.fn((patch: any) => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ ...engDept, ...patch }]),
        })),
      })),
    }));

    mockClient.transaction.mockImplementation(async (callback: any) => callback(mockClient));
  });

  describe("1. Manager Dropdown & Eligibility Rules", () => {
    it("excludes the Organization Owner from the manager dropdown by default", async () => {
      activeDepartments = [{ id: hrDept.id, headEmployeeId: hrDept.headEmployeeId }];
      eligibleEmployees = [ownerEmp, hrAdminEmp, managerEmp];

      const managers = await listEligibleManagers(orgId, undefined, mockClient as any);

      const ownerInList = managers.some((m) => m.roleKey === "ORGANIZATION_OWNER" || m.id === ownerEmp.id);
      expect(ownerInList).toBe(false);
    });

    it("allows an eligible active HR Admin to be selected when permitted by manager eligibility rules", async () => {
      expect(DEFAULT_ELIGIBLE_MANAGER_ROLES).toContain("HR_ADMIN");

      activeDepartments = [{ id: hrDept.id, headEmployeeId: hrDept.headEmployeeId }];
      eligibleEmployees = [hrAdminEmp, managerEmp];

      // For HR department edit (currentDepartmentId = hrDept.id), hrAdminEmp is retained
      const managers = await listEligibleManagers(orgId, hrDept.id, mockClient as any);
      const hrAdminInList = managers.some((m) => m.id === hrAdminEmp.id);
      expect(hrAdminInList).toBe(true);
    });

    it("excludes employees who are already assigned as manager of another active department", async () => {
      // Arjun Kumar already manages HR (hrDept)
      activeDepartments = [{ id: hrDept.id, headEmployeeId: hrAdminEmp.id }];
      eligibleEmployees = [hrAdminEmp, managerEmp];

      // Listing for Engineering department (engDept.id)
      const managers = await listEligibleManagers(orgId, engDept.id, mockClient as any);

      // Arjun Kumar already manages HR, so must NOT appear for Engineering
      const arjunInEngDropdown = managers.some((m) => m.id === hrAdminEmp.id);
      expect(arjunInEngDropdown).toBe(false);

      // Priya Sharma (managerEmp) is unassigned to active departments, so should appear
      const priyaInEngDropdown = managers.some((m) => m.id === managerEmp.id);
      expect(priyaInEngDropdown).toBe(true);
    });

    it("editing a department retains its current manager in eligible list while excluding managers assigned to other departments", async () => {
      activeDepartments = [
        { id: hrDept.id, headEmployeeId: hrAdminEmp.id },
        { id: "dept-sales-303", headEmployeeId: "emp-sales-mgr" },
      ];
      eligibleEmployees = [hrAdminEmp, managerEmp];

      // Pass currentDepartmentId = hrDept.id
      const managers = await listEligibleManagers(orgId, hrDept.id, mockClient as any);

      // Current manager Arjun Kumar MUST be retained
      expect(managers.some((m) => m.id === hrAdminEmp.id)).toBe(true);
      // Other manager "emp-sales-mgr" must NOT appear
      expect(managers.some((m) => m.id === "emp-sales-mgr")).toBe(false);
    });
  });

  describe("2. Server-side Validation & Mutation Restrictions", () => {
    it("rejects assigning Organization Owner as department manager with 400", async () => {
      targetEmployee = ownerEmp;

      await expect(
        validateManagerEmployee(orgId, ownerEmp.id, undefined, mockClient as any)
      ).rejects.toThrow(
        new AppError("VALIDATION_ERROR", "Organization Owner cannot be assigned as a department manager.", 400)
      );
    });

    it("rejects inactive employees from being assigned as manager", async () => {
      targetEmployee = inactiveEmp;

      await expect(
        validateManagerEmployee(orgId, inactiveEmp.id, undefined, mockClient as any)
      ).rejects.toThrow(
        new AppError(
          "VALIDATION_ERROR",
          'Assigned manager has status "inactive". Only active employees can head a department.',
          400
        )
      );
    });

    it("rejects cross-organization employees from being assigned as manager", async () => {
      targetEmployee = null; // Employee not found in current organization

      await expect(
        validateManagerEmployee(orgId, crossOrgEmp.id, undefined, mockClient as any)
      ).rejects.toThrow(
        new AppError("VALIDATION_ERROR", "Assigned manager does not belong to this organization.", 400)
      );
    });

    it("rejects assigning an employee who is already managing another active department", async () => {
      targetEmployee = managerEmp;
      existingManagingDept = { id: "dept-other-888", name: "Operations" };

      await expect(
        validateManagerEmployee(orgId, managerEmp.id, engDept.id, mockClient as any)
      ).rejects.toThrow(
        new AppError(
          "VALIDATION_ERROR",
          'Employee is already assigned as manager of active department "Operations". An employee can only manage one department at a time.',
          400
        )
      );
    });

    it("allows setting None (Unassigned) by passing null or undefined headEmployeeId", async () => {
      const result = await validateManagerEmployee(orgId, null, undefined, mockClient as any);
      expect(result).toBeNull();

      const resultUndefined = await validateManagerEmployee(orgId, undefined, undefined, mockClient as any);
      expect(resultUndefined).toBeNull();
    });

    it("createDepartment wraps execution in a transaction to prevent duplicate manager assignments", async () => {
      targetEmployee = managerEmp;
      existingManagingDept = null;

      const created = await createDepartment(orgId, ownerEmp.userId, {
        code: "FIN",
        name: "Finance",
        headEmployeeId: managerEmp.id,
      });

      expect(mockClient.transaction).toHaveBeenCalled();
      expect(created).toBeDefined();
    });

    it("updateDepartment passes current departmentId and validates within transaction", async () => {
      targetEmployee = managerEmp;
      existingManagingDept = null;
      currentDepartmentToFind = engDept;

      const updated = await updateDepartment(orgId, ownerEmp.userId, engDept.id, {
        name: "Engineering Division",
        headEmployeeId: managerEmp.id,
      });

      expect(mockClient.transaction).toHaveBeenCalled();
      expect(updated).toBeDefined();
    });
  });

  describe("3. Memberships Query & Workspace Isolation Verification", () => {
    it("enrichEmployeesWithRoles safely resolves roles using tenant transaction without unhandled errors", async () => {
      const enriched = await enrichEmployeesWithRoles(orgId, [hrAdminEmp as any], mockClient as any);
      expect(enriched.length).toBe(1);
      expect(enriched[0].roleKey).toBe("HR_ADMIN");
      expect(enriched[0].roleTitle).toBe("HR Admin");
    });

    it("listEmployees executes cleanly under tenant scoping without failing on memberships selection", async () => {
      eligibleEmployees = [ownerEmp, hrAdminEmp];

      const result = await listEmployees(orgId, { page: 1, pageSize: 25 }, mockClient as any);
      expect(result.total).toBe(2);
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].displayName).toBe("Naresh S");
      expect(result.rows[1].displayName).toBe("Arjun Kumar");
    });
  });
});
