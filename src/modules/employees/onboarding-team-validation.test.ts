import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmployee, updateEmployee } from "@/modules/employees/service";
import { departments, employees, organizations, teams } from "@/db/schema";
import { AppError } from "@/lib/errors";

const { authorize, recordAudit } = vi.hoisted(() => ({
  authorize: vi.fn(),
  recordAudit: vi.fn(),
}));

const organizationId = "11111111-1111-4111-8111-111111111111";
const otherOrgId = "22222222-2222-4222-8222-222222222222";
const actorUserId = "user-actor-1";

const salesDeptId = "33333333-3333-4333-8333-333333333333";
const engDeptId = "44444444-4444-4444-8444-444444444444";

type MockTeam = {
  id: string;
  organizationId: string;
  departmentId: string | null;
  name: string;
  code: string;
  status: "active" | "inactive" | "archived";
};

type MockDept = {
  id: string;
  organizationId: string;
  name: string;
  status: "active" | "inactive";
};

let mockDepartments: MockDept[] = [];
let mockTeams: MockTeam[] = [];
let mockEmployees: any[] = [];

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
        if (table === teams) {
          return Promise.resolve(mockTeams);
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
          if (table === employees) {
            return Promise.resolve([
              {
                id: "emp-updated",
                organizationId,
                departmentId: salesDeptId,
                teamId: "team-sales-ops",
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
          id: "emp-new-101",
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
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === employees) return Promise.resolve(mockEmployees);
          if (table === departments) return Promise.resolve(mockDepartments);
          if (table === teams) return Promise.resolve(mockTeams);
          return Promise.resolve([]);
        }),
      })),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((changes: any) => ({
        where: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: "emp-updated",
              organizationId,
              ...changes,
            },
          ]),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((values: any) => Promise.resolve([values])),
    })),
    query: {
      memberships: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  },
}));

vi.mock("@/modules/tenancy/authorization", () => ({ authorize }));
vi.mock("@/lib/audit", () => ({ recordAudit }));

describe("Employee Onboarding Team Validation & Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorize.mockResolvedValue({ id: actorUserId });

    mockDepartments = [
      { id: salesDeptId, organizationId, name: "Sales", status: "active" },
      { id: engDeptId, organizationId, name: "Engineering", status: "active" },
    ];

    mockTeams = [
      {
        id: "team-sales-ops",
        organizationId,
        departmentId: salesDeptId,
        name: "Sales Operations Team",
        code: "SALES-OPS",
        status: "active",
      },
      {
        id: "team-sales-inactive",
        organizationId,
        departmentId: salesDeptId,
        name: "Sales Inactive Team",
        code: "SALES-INACTIVE",
        status: "inactive",
      },
      {
        id: "team-fe-core",
        organizationId,
        departmentId: engDeptId,
        name: "Frontend Core",
        code: "FE-CORE",
        status: "active",
      },
    ];

    mockEmployees = [];
  });

  it("rejects onboarding submission when selected team belongs to a different department", async () => {
    // Dept is Sales, but team is Frontend Core (Engineering)
    mockTeams = [
      {
        id: "team-fe-core",
        organizationId,
        departmentId: engDeptId,
        name: "Frontend Core",
        code: "FE-CORE",
        status: "active",
      },
    ];

    await expect(
      createEmployee(organizationId, actorUserId, {
        firstName: "Alice",
        lastName: "Smith",
        personalEmail: "alice@example.com",
        departmentId: salesDeptId,
        teamId: "team-fe-core",
        targetRole: "EMPLOYEE",
        status: "invited",
      })
    ).rejects.toThrow("Selected team does not belong to the selected department.");
  });

  it("rejects onboarding submission when selected team is inactive", async () => {
    mockTeams = [
      {
        id: "team-sales-inactive",
        organizationId,
        departmentId: salesDeptId,
        name: "Sales Inactive Team",
        code: "SALES-INACTIVE",
        status: "inactive",
      },
    ];

    await expect(
      createEmployee(organizationId, actorUserId, {
        firstName: "Bob",
        lastName: "Miller",
        personalEmail: "bob@example.com",
        departmentId: salesDeptId,
        teamId: "team-sales-inactive",
        targetRole: "EMPLOYEE",
        status: "invited",
      })
    ).rejects.toThrow("Selected team is inactive and cannot accept new employee assignments.");
  });

  it("rejects onboarding submission when team belongs to another organization (cross-tenant attack)", async () => {
    mockTeams = []; // Not found in this organization

    await expect(
      createEmployee(organizationId, actorUserId, {
        firstName: "Charlie",
        lastName: "Brown",
        personalEmail: "charlie@example.com",
        departmentId: salesDeptId,
        teamId: "team-foreign-org",
        targetRole: "EMPLOYEE",
        status: "invited",
      })
    ).rejects.toThrow("Team does not belong to this organization.");
  });

  it("rejects onboarding submission when teamId is assigned without a departmentId", async () => {
    mockTeams = [
      {
        id: "team-sales-ops",
        organizationId,
        departmentId: salesDeptId,
        name: "Sales Operations Team",
        code: "SALES-OPS",
        status: "active",
      },
    ];

    await expect(
      createEmployee(organizationId, actorUserId, {
        firstName: "Diana",
        lastName: "Prince",
        personalEmail: "diana@example.com",
        teamId: "team-sales-ops",
        targetRole: "HR_ADMIN", // Dept is optional for HR_ADMIN
        status: "invited",
      })
    ).rejects.toThrow("Selected team does not belong to the selected department.");
  });

  it("successfully creates employee when team is active and belongs to the selected department", async () => {
    mockTeams = [
      {
        id: "team-sales-ops",
        organizationId,
        departmentId: salesDeptId,
        name: "Sales Operations Team",
        code: "SALES-OPS",
        status: "active",
      },
    ];

    const result = await createEmployee(organizationId, actorUserId, {
      firstName: "Evan",
      lastName: "Wright",
      personalEmail: "evan@example.com",
      departmentId: salesDeptId,
      teamId: "team-sales-ops",
      targetRole: "EMPLOYEE",
      status: "invited",
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.departmentId).toBe(salesDeptId);
    expect(result.employee.teamId).toBe("team-sales-ops");
  });

  it("updateEmployee rejects assignment of team from another department", async () => {
    mockEmployees = [
      {
        id: "emp-1",
        organizationId,
        departmentId: salesDeptId,
        teamId: "team-sales-ops",
        displayName: "Existing Employee",
      },
    ];

    mockTeams = [
      {
        id: "team-fe-core",
        organizationId,
        departmentId: engDeptId,
        name: "Frontend Core",
        code: "FE-CORE",
        status: "active",
      },
    ];

    await expect(
      updateEmployee(organizationId, actorUserId, "emp-1", {
        teamId: "team-fe-core",
      })
    ).rejects.toThrow("Selected team does not belong to the selected department.");
  });

  it("updateEmployee clears team if department is changed to one where the team does not belong", async () => {
    mockEmployees = [
      {
        id: "emp-1",
        organizationId,
        departmentId: salesDeptId,
        teamId: "team-sales-ops",
        displayName: "Existing Employee",
      },
    ];

    // team-sales-ops belongs to salesDeptId, but department is changing to engDeptId
    mockTeams = [
      {
        id: "team-sales-ops",
        organizationId,
        departmentId: salesDeptId,
        name: "Sales Operations Team",
        code: "SALES-OPS",
        status: "active",
      },
    ];

    const updated = await updateEmployee(organizationId, actorUserId, "emp-1", {
      departmentId: engDeptId,
    });

    expect(updated).toBeDefined();
    expect(updated.teamId).toBeNull();
  });
});
