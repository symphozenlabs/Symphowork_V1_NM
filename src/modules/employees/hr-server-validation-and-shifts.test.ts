import { beforeEach, describe, expect, it, vi } from "vitest";
import { departments, employees, organizations, shifts, designations, employmentTypes, teams } from "@/db/schema";

const authorize = vi.fn();
const recordAudit = vi.fn();

let mockDepartments: Array<{ id: string; organizationId: string; code?: string; name?: string; status: string }> = [];
let mockShifts: Array<{ id: string; organizationId: string; name?: string; startTime?: string; endTime?: string; overnight?: boolean; status?: string }> = [];
let mockDesignations: Array<{ id: string; organizationId: string; name?: string; code?: string }> = [];
let mockEmploymentTypes: Array<{ id: string; organizationId: string; name?: string; code?: string }> = [];
let mockTeams: Array<{ id: string; organizationId: string; departmentId: string; status: string }> = [];
let mockEmployees: Array<Record<string, unknown>> = [];
let insertedEmployees: Array<Record<string, unknown>> = [];

const tx = {
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === employees) return Promise.resolve(mockEmployees);
        if (table === departments) return Promise.resolve(mockDepartments);
        if (table === shifts) return Promise.resolve(mockShifts);
        if (table === designations) return Promise.resolve(mockDesignations);
        if (table === employmentTypes) return Promise.resolve(mockEmploymentTypes);
        if (table === teams) return Promise.resolve(mockTeams);
        return Promise.resolve([]);
      }),
    })),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn(() => ({
      where: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockImplementation(() => {
          if (table === organizations) {
            return Promise.resolve([{ prefix: "EMP", next: 10, padding: 4 }]);
          }
          return Promise.resolve([]);
        }),
      })),
    })),
  })),
  insert: vi.fn((table: unknown) => ({
    values: vi.fn((values: Record<string, unknown> | Array<Record<string, unknown>>) => ({
      returning: vi.fn().mockImplementation(() => {
        if (table === employees) {
          const emp = { id: "emp-new-uuid", ...values };
          insertedEmployees.push(emp);
          return Promise.resolve([emp]);
        }
        return Promise.resolve([{ id: "generated-uuid", ...(Array.isArray(values) ? values[0] : values) }]);
      }),
    })),
  })),
};

vi.mock("@/db/client", () => ({
  db: {
    transaction: vi.fn(async (cb: (nestedTx: typeof tx) => Promise<unknown>) => cb(tx)),
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === employees) return Promise.resolve(mockEmployees);
          if (table === departments) return Promise.resolve(mockDepartments);
          if (table === shifts) return Promise.resolve(mockShifts);
          if (table === designations) return Promise.resolve(mockDesignations);
          if (table === employmentTypes) return Promise.resolve(mockEmploymentTypes);
          if (table === teams) return Promise.resolve(mockTeams);
          return Promise.resolve([]);
        }),
      })),
    })),
    query: {
      memberships: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      roles: {
        findFirst: vi.fn().mockResolvedValue({ id: "role-owner", key: "ORGANIZATION_OWNER" }),
      },
    },
  },
}));

vi.mock("@/modules/tenancy/authorization", () => ({ authorize }));
vi.mock("@/lib/audit", () => ({ recordAudit }));

const { createEmployee } = await import("./service");

describe("Server-side HR Onboarding, Shift Assignment, and Tenant Isolation", () => {
  const organizationId = "org-current";
  const foreignOrgId = "org-foreign";
  const actorUserId = "user-actor";

  beforeEach(() => {
    vi.clearAllMocks();
    insertedEmployees = [];
    mockEmployees = [];
    mockDepartments = [
      { id: "dept-hr", organizationId, code: "HR", name: "Human Resources", status: "active" },
      { id: "dept-eng", organizationId, code: "ENG", name: "Engineering", status: "active" },
      { id: "dept-foreign", organizationId: foreignOrgId, code: "HR", name: "Foreign HR", status: "active" },
    ];
    mockShifts = [
      { id: "shift-general", organizationId, name: "General Shift", startTime: "09:00", endTime: "18:00", overnight: false },
      { id: "shift-foreign", organizationId: foreignOrgId, name: "Foreign Shift", startTime: "09:00", endTime: "18:00", overnight: false },
    ];
    mockDesignations = [
      { id: "desig-hrexec", organizationId, name: "HR Executive", code: "HREXEC" },
      { id: "desig-foreign", organizationId: foreignOrgId, name: "Foreign Desig", code: "FDESIG" },
    ];
    mockEmploymentTypes = [
      { id: "type-fulltime", organizationId, name: "Full-time Regular", code: "FULL_TIME" },
      { id: "type-foreign", organizationId: foreignOrgId, name: "Foreign Type", code: "FTYPE" },
    ];
    mockTeams = [
      { id: "team-hr-core", organizationId, departmentId: "dept-hr", status: "active" },
    ];
  });

  describe("HR Department & Team Server Restrictions", () => {
    it("rejects team selection when onboarding an HR Administrator", async () => {
      mockDepartments = [{ id: "dept-hr", organizationId, code: "HR", name: "Human Resources", status: "active" }];
      mockTeams = [{ id: "team-hr-core", organizationId, departmentId: "dept-hr", status: "active" }];

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Suresh",
          lastName: "Rao",
          personalEmail: "suresh@example.com",
          departmentId: "dept-hr",
          teamId: "team-hr-core",
          targetRole: "HR_ADMIN",
          status: "invited",
        })
      ).rejects.toThrow("Team selection is not permitted for HR roles.");
    });

    it("rejects team selection when onboarding an HR Executive", async () => {
      mockDepartments = [{ id: "dept-hr", organizationId, code: "HR", name: "Human Resources", status: "active" }];
      mockTeams = [{ id: "team-hr-core", organizationId, departmentId: "dept-hr", status: "active" }];

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Meera",
          lastName: "Nair",
          personalEmail: "meera@example.com",
          departmentId: "dept-hr",
          teamId: "team-hr-core",
          targetRole: "HR_EXECUTIVE",
          status: "invited",
        })
      ).rejects.toThrow("Team selection is not permitted for HR roles.");
    });

    it("rejects assigning a non-HR department (Engineering) to an HR Administrator", async () => {
      mockDepartments = [{ id: "dept-eng", organizationId, code: "ENG", name: "Engineering", status: "active" }];

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Suresh",
          lastName: "Rao",
          personalEmail: "suresh@example.com",
          departmentId: "dept-eng",
          targetRole: "HR_ADMIN",
          status: "invited",
        })
      ).rejects.toThrow(
        "HR Administrator and HR Executive roles must be assigned to the Human Resources (HR) department."
      );
    });

    it("rejects assigning an HR department belonging to another organization (tenant isolation)", async () => {
      // Mock department query returns empty because dept-foreign belongs to another organization
      mockDepartments = [];

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Suresh",
          lastName: "Rao",
          personalEmail: "suresh@example.com",
          departmentId: "dept-foreign",
          targetRole: "HR_ADMIN",
          status: "invited",
        })
      ).rejects.toThrow("Department does not belong to this organization.");
    });
  });

  describe("Shift, Designation & Employment Type Tenant Isolation and Persistence", () => {
    it("rejects assigning a shift belonging to another organization", async () => {
      mockDepartments = [{ id: "dept-hr", organizationId, code: "HR", name: "Human Resources", status: "active" }];
      mockShifts = []; // Not found in organizationId

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Rajesh",
          lastName: "Kapur",
          personalEmail: "rajesh@example.com",
          departmentId: "dept-hr",
          shiftId: "shift-foreign",
          targetRole: "HR_ADMIN",
          status: "invited",
        })
      ).rejects.toThrow("Shift does not belong to this organization.");
    });

    it("rejects assigning a designation belonging to another organization", async () => {
      mockDepartments = [{ id: "dept-hr", organizationId, code: "HR", name: "Human Resources", status: "active" }];
      mockDesignations = []; // Not found in organizationId

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Rajesh",
          lastName: "Kapur",
          personalEmail: "rajesh@example.com",
          departmentId: "dept-hr",
          designationId: "desig-foreign",
          targetRole: "HR_ADMIN",
          status: "invited",
        })
      ).rejects.toThrow("Designation does not belong to this organization.");
    });

    it("rejects assigning an employment type belonging to another organization", async () => {
      mockDepartments = [{ id: "dept-hr", organizationId, code: "HR", name: "Human Resources", status: "active" }];
      mockEmploymentTypes = []; // Not found in organizationId

      await expect(
        createEmployee(organizationId, actorUserId, {
          firstName: "Rajesh",
          lastName: "Kapur",
          personalEmail: "rajesh@example.com",
          departmentId: "dept-hr",
          employmentTypeId: "type-foreign",
          targetRole: "HR_ADMIN",
          status: "invited",
        })
      ).rejects.toThrow("Employment type does not belong to this organization.");
    });

    it("successfully creates and persists HR employee with valid shift, designation, and employment type", async () => {
      mockDepartments = [{ id: "dept-hr", organizationId, code: "HR", name: "Human Resources", status: "active" }];
      mockShifts = [{ id: "shift-general", organizationId, name: "General Shift", startTime: "09:00", endTime: "18:00" }];
      mockDesignations = [{ id: "desig-hrexec", organizationId, name: "HR Executive", code: "HREXEC" }];
      mockEmploymentTypes = [{ id: "type-fulltime", organizationId, name: "Full-time Regular", code: "FULL_TIME" }];

      const result = await createEmployee(organizationId, actorUserId, {
        firstName: "Kavita",
        lastName: "Iyer",
        personalEmail: "kavita.iyer@example.com",
        departmentId: "dept-hr",
        designationId: "desig-hrexec",
        shiftId: "shift-general",
        employmentTypeId: "type-fulltime",
        targetRole: "HR_EXECUTIVE",
        status: "invited",
      });

      expect(result.employee).toBeDefined();
      expect(result.targetRole).toBe("HR_EXECUTIVE");
      expect(insertedEmployees).toHaveLength(1);

      const saved = insertedEmployees[0];
      expect(saved.departmentId).toBe("dept-hr");
      expect(saved.designationId).toBe("desig-hrexec");
      expect(saved.shiftId).toBe("shift-general");
      expect(saved.employmentTypeId).toBe("type-fulltime");
      expect(saved.teamId).toBeUndefined();
      expect(saved.locationId).toBeUndefined();
    });
  });
});
