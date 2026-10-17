import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  DEPARTMENT_REQUIRED_ROLES,
  isDepartmentRequiredForRole,
  createEmployee,
} from "@/modules/employees/service";
import { departments, employees, organizations } from "@/db/schema";

const { authorize, recordAudit } = vi.hoisted(() => ({
  authorize: vi.fn(),
  recordAudit: vi.fn(),
}));

let mockDepartments: { id: string; organizationId: string; status: string }[] = [];
let mockEmployees: { id: string; organizationId: string; personalEmail?: string }[] = [];

const tx = {
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === employees) {
          return Promise.resolve(mockEmployees);
        }
        if (table === departments) {
          return Promise.resolve(mockDepartments);
        }
        return Promise.resolve([]);
      }),
    })),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn(() => ({
      where: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockImplementation(() => {
          if (table === organizations) {
            return Promise.resolve([
              {
                prefix: "EMP",
                next: 2,
                padding: 4,
              },
            ]);
          }
          return Promise.resolve([]);
        }),
      })),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn((values: Record<string, unknown>) => ({
      returning: vi.fn().mockResolvedValue([
        {
          id: "emp-101",
          employeeId: "EMP0001",
          ...values,
        },
      ]),
    })),
  })),
};

vi.mock("@/db/client", () => ({
  db: {
    transaction: vi.fn(async (cb: (nestedTx: typeof tx) => Promise<unknown>) => cb(tx)),
    query: {
      memberships: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
}));

vi.mock("@/modules/tenancy/authorization", () => ({ authorize }));
vi.mock("@/lib/audit", () => ({ recordAudit }));

describe("Role-based Department Requirements during Onboarding", () => {
  const organizationId = "org-1";
  const actorUserId = "user-owner";

  beforeEach(() => {
    vi.clearAllMocks();
    authorize.mockResolvedValue({ id: actorUserId });
    mockDepartments = [];
    mockEmployees = [];
  });

  describe("Role classification rules", () => {
    it("identifies department-required roles: MANAGER, TEAM_LEAD, PROJECT_MANAGER, EMPLOYEE", () => {
      expect(DEPARTMENT_REQUIRED_ROLES).toContain("MANAGER");
      expect(DEPARTMENT_REQUIRED_ROLES).toContain("TEAM_LEAD");
      expect(DEPARTMENT_REQUIRED_ROLES).toContain("PROJECT_MANAGER");
      expect(DEPARTMENT_REQUIRED_ROLES).toContain("EMPLOYEE");

      expect(isDepartmentRequiredForRole("MANAGER")).toBe(true);
      expect(isDepartmentRequiredForRole("TEAM_LEAD")).toBe(true);
      expect(isDepartmentRequiredForRole("PROJECT_MANAGER")).toBe(true);
      expect(isDepartmentRequiredForRole("EMPLOYEE")).toBe(true);
    });

    it("identifies department-optional roles: OWNER, HR_ADMIN, HR_EXECUTIVE, FINANCE_ADMIN, RECRUITER", () => {
      expect(isDepartmentRequiredForRole("ORGANIZATION_OWNER")).toBe(false);
      expect(isDepartmentRequiredForRole("HR_ADMIN")).toBe(false);
      expect(isDepartmentRequiredForRole("HR_EXECUTIVE")).toBe(false);
      expect(isDepartmentRequiredForRole("FINANCE_ADMIN")).toBe(false);
      expect(isDepartmentRequiredForRole("RECRUITER")).toBe(false);
    });
  });

  describe("Server-side validation in createEmployee", () => {
    it("rejects department-required role if organization has 0 active departments", async () => {
      mockDepartments = []; // 0 active departments

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Ravi",
          lastName: "Patel",
          personalEmail: "ravi@example.com",
          targetRole: "MANAGER",
          status: "invited",
        })
      ).rejects.toThrow(
        "Cannot onboard a MANAGER because this organization has no active departments configured. An Organization Owner must create at least one department first."
      );
    });

    it("rejects department-required role if departmentId is not selected when departments exist", async () => {
      mockDepartments = [
        { id: "dept-1", organizationId, status: "active" },
      ];

      // In the mock, when counting departments, return the active department
      tx.select = vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === employees) return Promise.resolve([]);
            if (table === departments) {
              return Promise.resolve([{ count: 1 }]);
            }
            return Promise.resolve([]);
          }),
        })),
      }));

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Ravi",
          lastName: "Patel",
          personalEmail: "ravi@example.com",
          targetRole: "EMPLOYEE",
          status: "invited",
        })
      ).rejects.toThrow("Department assignment is required for EMPLOYEE role.");
    });

    it("permits onboarding department-optional roles (e.g. HR_ADMIN) without departmentId", async () => {
      tx.select = vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === employees) return Promise.resolve([]);
            return Promise.resolve([]);
          }),
        })),
      }));

      const result = await createEmployee(organizationId, actorUserId, {
        firstName: "Ananya",
        lastName: "Sen",
        personalEmail: "ananya@example.com",
        targetRole: "HR_ADMIN",
        status: "invited",
      });

      expect(result.employee).toBeDefined();
      expect(result.targetRole).toBe("HR_ADMIN");
    });

    it("permits onboarding RECRUITER without departmentId", async () => {
      const result = await createEmployee(organizationId, actorUserId, {
        firstName: "Sneha",
        lastName: "Reddy",
        personalEmail: "sneha@example.com",
        targetRole: "RECRUITER",
        status: "invited",
      });

      expect(result.employee).toBeDefined();
      expect(result.targetRole).toBe("RECRUITER");
    });

    it("rejects assignment if department does not belong to organization", async () => {
      tx.select = vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === employees) return Promise.resolve([]);
            if (table === departments) return Promise.resolve([]); // Not found in this org
            return Promise.resolve([]);
          }),
        })),
      }));

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Vijay",
          lastName: "Rao",
          personalEmail: "vijay@example.com",
          targetRole: "EMPLOYEE",
          departmentId: "dept-foreign",
          status: "invited",
        })
      ).rejects.toThrow("Department does not belong to this organization.");
    });

    it("rejects assignment if department is inactive", async () => {
      tx.select = vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === employees) return Promise.resolve([]);
            if (table === departments) {
              return Promise.resolve([{ id: "dept-1", status: "inactive" }]);
            }
            return Promise.resolve([]);
          }),
        })),
      }));

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Vijay",
          lastName: "Rao",
          personalEmail: "vijay@example.com",
          targetRole: "EMPLOYEE",
          departmentId: "dept-1",
          status: "invited",
        })
      ).rejects.toThrow("Selected department is inactive and cannot accept new employee assignments.");
    });
  });
});
