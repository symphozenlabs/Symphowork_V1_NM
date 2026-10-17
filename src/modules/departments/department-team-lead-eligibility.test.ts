/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { departments, employees, memberships, teams } from "@/db/schema";
import {
  DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES,
  listEligibleTeamLeads,
  validateTeamLeadEmployee,
  createDepartmentTeam,
  updateDepartmentTeam,
} from "./service";

// Hoist mocks
const { mockClient, authorize, resolveTenantContext, recordAudit, withTenantTransaction } = vi.hoisted(() => {
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
    withTenantTransaction: vi.fn(async (_orgId: string, cb: any) => cb(mockClient)),
  };
});

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize,
  can: vi.fn(() => Promise.resolve(true)),
  assertCanManageDepartmentTeams: vi.fn(() => Promise.resolve(true)),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext,
}));

vi.mock("@/lib/audit", () => ({
  recordAudit,
}));

vi.mock("@/db/client", () => ({
  db: mockClient,
  withTenantTransaction,
}));

// Test fixtures
const orgId = "org-tenant-100";
const crossTenantOrgId = "org-tenant-999";

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

const teamLeadEmp = {
  id: "emp-lead-002",
  organizationId: orgId,
  userId: "user-lead-002",
  employeeId: "EMP002",
  displayName: "Vikram Mehta",
  workEmail: "vikram.lead@dev.local",
  phone: "9876543210",
  status: "active" as const,
  roleKey: "TEAM_LEAD",
  roleTitle: "Team Lead",
};

const secondLeadEmp = {
  id: "emp-lead-003",
  organizationId: orgId,
  userId: "user-lead-003",
  employeeId: "EMP003",
  displayName: "Ananya Roy",
  workEmail: "ananya.lead@dev.local",
  phone: "9876543211",
  status: "active" as const,
  roleKey: "TEAM_LEAD",
  roleTitle: "Team Lead",
};

const inactiveLeadEmp = {
  id: "emp-inact-004",
  organizationId: orgId,
  userId: "user-inact-004",
  employeeId: "EMP004",
  displayName: "Inactive Lead",
  workEmail: "inactive.lead@dev.local",
  phone: null,
  status: "inactive" as const,
  roleKey: "TEAM_LEAD",
  roleTitle: "Team Lead",
};

const regularEmployee = {
  id: "emp-reg-005",
  organizationId: orgId,
  userId: "user-reg-005",
  employeeId: "EMP005",
  displayName: "Amit Patel",
  workEmail: "amit.employee@dev.local",
  phone: null,
  status: "active" as const,
  roleKey: "EMPLOYEE",
  roleTitle: "Employee",
};

const managerEmployee = {
  id: "emp-mgr-006",
  organizationId: orgId,
  userId: "user-mgr-006",
  employeeId: "EMP006",
  displayName: "Anand Rao",
  workEmail: "anand.manager@dev.local",
  phone: null,
  status: "active" as const,
  roleKey: "MANAGER",
  roleTitle: "Manager",
};

const crossTenantLeadEmp = {
  id: "emp-cross-007",
  organizationId: crossTenantOrgId,
  userId: "user-cross-007",
  employeeId: "EMP888",
  displayName: "External Lead",
  workEmail: "external@other.example",
  phone: null,
  status: "active" as const,
  roleKey: "TEAM_LEAD",
  roleTitle: "Team Lead",
};

const dept = {
  id: "dept-eng-101",
  organizationId: orgId,
  code: "ENG",
  name: "Engineering",
};

const existingTeam = {
  id: "team-fe-1",
  organizationId: orgId,
  departmentId: dept.id,
  code: "FE-CORE",
  name: "Frontend Core",
  description: "Core frontend squad",
  teamLeadEmployeeId: teamLeadEmp.id,
  status: "active" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMemberships = [
  { userId: ownerEmp.userId, roleKey: "ORGANIZATION_OWNER", roleName: "Organization Owner" },
  { userId: teamLeadEmp.userId, roleKey: "TEAM_LEAD", roleName: "Team Lead" },
  { userId: secondLeadEmp.userId, roleKey: "TEAM_LEAD", roleName: "Team Lead" },
  { userId: inactiveLeadEmp.userId, roleKey: "TEAM_LEAD", roleName: "Team Lead" },
  { userId: regularEmployee.userId, roleKey: "EMPLOYEE", roleName: "Employee" },
  { userId: managerEmployee.userId, roleKey: "MANAGER", roleName: "Manager" },
  { userId: crossTenantLeadEmp.userId, roleKey: "TEAM_LEAD", roleName: "Team Lead" },
];

let targetEmployee: any = null;
let eligibleEmployees: any[] = [];
let existingTeamToFind: any = null;

describe("Department Team Lead Eligibility, Visibility & Cross-Tenant Isolation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorize.mockResolvedValue(true);

    eligibleEmployees = [
      ownerEmp,
      teamLeadEmp,
      secondLeadEmp,
      inactiveLeadEmp,
      regularEmployee,
      managerEmployee,
      crossTenantLeadEmp,
    ];
    targetEmployee = null;
    existingTeamToFind = null;

    mockClient.select.mockImplementation(() => ({
      from: vi.fn((table: any) => {
        // 1. memberships query
        if (table === memberships) {
          return {
            innerJoin: vi.fn(() => ({
              where: vi.fn().mockResolvedValue(mockMemberships),
            })),
          };
        }

        // 2. departments query
        if (table === departments) {
          return {
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([dept]),
            })),
          };
        }

        // 3. teams query
        if (table === teams) {
          return {
            where: vi.fn(() => ({
              limit: vi.fn().mockImplementation(async (count: number) => {
                if (existingTeamToFind) {
                  return [existingTeamToFind].slice(0, count);
                }
                return [];
              }),
            })),
          };
        }

        // 4. employees query
        if (table === employees) {
          return {
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve(eligibleEmployees)),
              limit: vi.fn().mockImplementation(async (count: number) => {
                if (targetEmployee) {
                  return [targetEmployee].slice(0, count);
                }
                return [];
              }),
              then: (resolve: any) => Promise.resolve(eligibleEmployees).then(resolve),
            })),
            orderBy: vi.fn(() => Promise.resolve(eligibleEmployees)),
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
        returning: vi.fn().mockResolvedValue([{ id: "new-team-id", ...values }]),
      })),
    }));

    mockClient.update.mockImplementation(() => ({
      set: vi.fn((patch: any) => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ ...existingTeam, ...patch }]),
        })),
      })),
    }));
  });

  describe("1. Role Eligibility & Team Lead Visibility", () => {
    it("confirms DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES includes TEAM_LEAD", () => {
      expect(DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES).toContain("TEAM_LEAD");
    });

    it("returns active employees with TEAM_LEAD role in the organization", async () => {
      eligibleEmployees = [ownerEmp, teamLeadEmp, secondLeadEmp, regularEmployee, managerEmployee];

      const leads = await listEligibleTeamLeads(orgId, undefined, mockClient as any);

      expect(leads.length).toBe(2);
      expect(leads.map((l) => l.id)).toEqual([teamLeadEmp.id, secondLeadEmp.id]);
      expect(leads[0].displayName).toBe("Vikram Mehta");
      expect(leads[0].roleKey).toBe("TEAM_LEAD");
      expect(leads[0].roleTitle).toBe("Team Lead");
    });

    it("filters out non-TEAM_LEAD roles (EMPLOYEE, MANAGER, ORGANIZATION_OWNER)", async () => {
      eligibleEmployees = [ownerEmp, regularEmployee, managerEmployee];

      const leads = await listEligibleTeamLeads(orgId, undefined, mockClient as any);

      expect(leads.length).toBe(0);
      expect(leads.some((l) => l.roleKey === "ORGANIZATION_OWNER")).toBe(false);
      expect(leads.some((l) => l.roleKey === "EMPLOYEE")).toBe(false);
      expect(leads.some((l) => l.roleKey === "MANAGER")).toBe(false);
    });

    it("enforces active status filtering: inactive employees are not returned", async () => {
      // Inactive employee with TEAM_LEAD role must be filtered out
      eligibleEmployees = [teamLeadEmp, inactiveLeadEmp];

      const leads = await listEligibleTeamLeads(orgId, undefined, mockClient as any);

      expect(leads.length).toBe(1);
      expect(leads[0].id).toBe(teamLeadEmp.id);
      expect(leads.some((l) => l.id === inactiveLeadEmp.id)).toBe(false);
    });

    it("handles empty state cleanly: returns empty array when no eligible Team Leads exist", async () => {
      eligibleEmployees = [ownerEmp, regularEmployee];

      const leads = await listEligibleTeamLeads(orgId, undefined, mockClient as any);

      expect(leads).toEqual([]);
      expect(leads.length).toBe(0);
    });
  });

  describe("2. Cross-Tenant Isolation & Authorization", () => {
    it("strictly isolates by tenant: cross-tenant Team Leads are excluded", async () => {
      // Setup: crossTenantLeadEmp belongs to crossTenantOrgId
      eligibleEmployees = [teamLeadEmp]; // In real query, eq(employees.organizationId, orgId) ensures crossTenantLeadEmp is never queried

      const leads = await listEligibleTeamLeads(orgId, undefined, mockClient as any);

      expect(leads.every((l) => l.id !== crossTenantLeadEmp.id)).toBe(true);
    });

    it("enforces department.read permission check", async () => {
      await listEligibleTeamLeads(orgId, undefined, mockClient as any);

      expect(authorize).toHaveBeenCalledWith({
        organizationId: orgId,
        permission: "department.read",
      });
    });

    it("wraps in withTenantTransaction when tx is omitted, preserving tenant context", async () => {
      eligibleEmployees = [teamLeadEmp];
      withTenantTransaction.mockClear();

      const leads = await listEligibleTeamLeads(orgId);

      expect(withTenantTransaction).toHaveBeenCalledWith(orgId, expect.any(Function));
      expect(leads.length).toBe(1);
      expect(leads[0].id).toBe(teamLeadEmp.id);
    });
  });

  describe("3. Server-side Team Lead Validation (validateTeamLeadEmployee)", () => {
    it("allows null or undefined to represent None (Unassigned)", async () => {
      const resNull = await validateTeamLeadEmployee(orgId, null, mockClient as any);
      expect(resNull).toBeNull();

      const resUndef = await validateTeamLeadEmployee(orgId, undefined, mockClient as any);
      expect(resUndef).toBeNull();

      const resEmptyStr = await validateTeamLeadEmployee(orgId, "", mockClient as any);
      expect(resEmptyStr).toBeNull();
    });

    it("accepts a valid active TEAM_LEAD in the organization", async () => {
      targetEmployee = teamLeadEmp;

      const validated = await validateTeamLeadEmployee(orgId, teamLeadEmp.id, mockClient as any);
      expect(validated).toBeDefined();
      expect(validated?.id).toBe(teamLeadEmp.id);
    });

    it("wraps in withTenantTransaction when tx is omitted during validation", async () => {
      targetEmployee = teamLeadEmp;
      withTenantTransaction.mockClear();

      const validated = await validateTeamLeadEmployee(orgId, teamLeadEmp.id);

      expect(withTenantTransaction).toHaveBeenCalledWith(orgId, expect.any(Function));
      expect(validated?.id).toBe(teamLeadEmp.id);
    });

    it("rejects cross-tenant employee with 400 VALIDATION_ERROR", async () => {
      targetEmployee = null; // not found in orgId

      await expect(
        validateTeamLeadEmployee(orgId, crossTenantLeadEmp.id, mockClient as any)
      ).rejects.toThrow(
        new AppError("VALIDATION_ERROR", "Selected team lead does not belong to this organization.", 400)
      );
    });

    it("rejects inactive employee with 400 VALIDATION_ERROR", async () => {
      targetEmployee = inactiveLeadEmp;

      await expect(
        validateTeamLeadEmployee(orgId, inactiveLeadEmp.id, mockClient as any)
      ).rejects.toThrow(
        new AppError(
          "VALIDATION_ERROR",
          'Assigned team lead has status "inactive". Only active employees can lead a team.',
          400
        )
      );
    });

    it("rejects employee with non-TEAM_LEAD role (e.g. regular EMPLOYEE)", async () => {
      targetEmployee = regularEmployee;

      await expect(
        validateTeamLeadEmployee(orgId, regularEmployee.id, mockClient as any)
      ).rejects.toThrow(
        new AppError(
          "VALIDATION_ERROR",
          'Employee with role "Employee" cannot be assigned as team lead. Eligible role: Team Lead.',
          400
        )
      );
    });

    it("rejects ORGANIZATION_OWNER from being assigned as team lead", async () => {
      targetEmployee = ownerEmp;

      await expect(
        validateTeamLeadEmployee(orgId, ownerEmp.id, mockClient as any)
      ).rejects.toThrow(
        new AppError("VALIDATION_ERROR", "Organization Owner cannot be assigned as a team lead.", 400)
      );
    });
  });

  describe("4. Mutation Integration in Team Creation & Update", () => {
    it("createDepartmentTeam validates teamLeadEmployeeId and succeeds for active Team Lead", async () => {
      targetEmployee = teamLeadEmp;

      const team = await createDepartmentTeam(orgId, ownerEmp.userId, dept.id, {
        name: "Backend Squad",
        code: "BE-SQUAD",
        teamLeadEmployeeId: teamLeadEmp.id,
      });

      expect(team).toBeDefined();
      expect(mockClient.insert).toHaveBeenCalled();
      expect(recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "team_created",
          organizationId: orgId,
        })
      );
    });

    it("createDepartmentTeam rejects invalid team lead assignment with 400", async () => {
      targetEmployee = null; // cross-tenant or not found

      await expect(
        createDepartmentTeam(orgId, ownerEmp.userId, dept.id, {
          name: "Invalid Team",
          code: "INV-TEAM",
          teamLeadEmployeeId: "invalid-emp-id",
        })
      ).rejects.toThrow(
        new AppError("VALIDATION_ERROR", "Selected team lead does not belong to this organization.", 400)
      );
    });

    it("updateDepartmentTeam validates teamLeadEmployeeId on update", async () => {
      existingTeamToFind = existingTeam;
      targetEmployee = secondLeadEmp;

      const updated = await updateDepartmentTeam(
        orgId,
        ownerEmp.userId,
        dept.id,
        existingTeam.id,
        {
          teamLeadEmployeeId: secondLeadEmp.id,
        }
      );

      expect(updated).toBeDefined();
      expect(mockClient.update).toHaveBeenCalled();
    });
  });
});
