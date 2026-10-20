import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSION_KEYS,
  APPROVAL_PERMISSIONS,
  ASSIGNABLE_ROLES_BY_ACTOR,
  canAssignRole,
  getAssignableRoles,
  hasAnyApprovalPermission,
  PERMISSIONS,
  ROLE_METADATA,
  ROLE_PERMISSIONS,
  SYSTEM_ROLES,
} from "$lib/domain/rbac/permissions";

describe("permission registry", () => {
  it("uses stable resource.action keys", () => {
    expect(ALL_PERMISSION_KEYS).toContain("organization.manage");
    expect(Object.values(PERMISSIONS).every((key) => /^[a-z]+(?:\.[a-z]+)+$/.test(key))).toBe(true);
  });

  it("gives the owner role the complete registry", () => {
    expect(SYSTEM_ROLES).toContain("ORGANIZATION_OWNER");
    expect(ROLE_PERMISSIONS.ORGANIZATION_OWNER).toHaveLength(ALL_PERMISSION_KEYS.length);
  });

  it("does not include ORGANIZATION_ADMIN in SYSTEM_ROLES or ROLE_PERMISSIONS", () => {
    expect(SYSTEM_ROLES).not.toContain("ORGANIZATION_ADMIN");
    expect(ROLE_PERMISSIONS).not.toHaveProperty("ORGANIZATION_ADMIN");
  });

  it("configures HR_EXECUTIVE with intended core HR permissions and employee onboarding", () => {
    const hrExecutivePerms = ROLE_PERMISSIONS.HR_EXECUTIVE;
    expect(hrExecutivePerms).toBeDefined();
    expect(hrExecutivePerms).toContain(PERMISSIONS.employeeCreate);
    expect(hrExecutivePerms).toContain(PERMISSIONS.employeeInvite);
    expect(hrExecutivePerms).toContain(PERMISSIONS.employeeRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.employeeUpdate);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceClockIn);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceClockOut);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceBreak);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceRegularizationCreate);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceRegularizationRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.leaveRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.leaveApply);
    expect(hrExecutivePerms).toContain(PERMISSIONS.documentRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.documentUpload);
    expect(hrExecutivePerms).toContain(PERMISSIONS.chatRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.chatSend);
    expect(hrExecutivePerms).toContain(PERMISSIONS.chatCreate);
    expect(hrExecutivePerms).toContain(PERMISSIONS.organizationRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.departmentRead);
    expect(hrExecutivePerms).toHaveLength(19);
  });

  it("configures departmentRead for authorized viewing roles and restricts department management to ORGANIZATION_OWNER and HR_ADMIN", () => {
    const authorizedViewingRoles = ["ORGANIZATION_OWNER", "HR_ADMIN", "HR_EXECUTIVE", "MANAGER", "FINANCE_ADMIN"];
    for (const role of authorizedViewingRoles) {
      expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.departmentRead);
    }

    const authorizedManagingRoles = ["ORGANIZATION_OWNER", "HR_ADMIN"];
    for (const role of authorizedManagingRoles) {
      expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.departmentCreate);
      expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.departmentUpdate);
      expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.departmentManage);
    }

    const nonManagingRoles = ["HR_EXECUTIVE", "MANAGER", "FINANCE_ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "RECRUITER", "EMPLOYEE"];
    for (const role of nonManagingRoles) {
      expect(ROLE_PERMISSIONS[role]).not.toContain(PERMISSIONS.departmentCreate);
      expect(ROLE_PERMISSIONS[role]).not.toContain(PERMISSIONS.departmentUpdate);
      expect(ROLE_PERMISSIONS[role]).not.toContain(PERMISSIONS.departmentManage);
    }

    const unauthorizedViewingRoles = ["PROJECT_MANAGER", "TEAM_LEAD", "RECRUITER", "EMPLOYEE"];
    for (const role of unauthorizedViewingRoles) {
      expect(ROLE_PERMISSIONS[role]).not.toContain(PERMISSIONS.departmentRead);
    }
  });

  it("enforces HR vs Recruiter role boundaries", () => {
    const recruiterPerms = ROLE_PERMISSIONS.RECRUITER;
    const hrAdminPerms = ROLE_PERMISSIONS.HR_ADMIN;
    const hrExecutivePerms = ROLE_PERMISSIONS.HR_EXECUTIVE;

    // Recruiter has ATS module permissions
    expect(recruiterPerms).toContain(PERMISSIONS.atsView);
    expect(recruiterPerms).toContain(PERMISSIONS.atsRequisitionCreate);
    expect(recruiterPerms).toContain(PERMISSIONS.atsCandidateCreate);
    expect(recruiterPerms).toContain(PERMISSIONS.atsInterviewCreate);

    // Recruiter MUST NOT receive payroll processing permissions
    const payrollPerms = [
      PERMISSIONS.payrollView,
      PERMISSIONS.payrollManage,
      PERMISSIONS.payrollConfigure,
      PERMISSIONS.payrollCalculate,
      PERMISSIONS.payrollReview,
      PERMISSIONS.payrollApprove,
      PERMISSIONS.payrollFinalize,
      PERMISSIONS.payrollViewAll,
    ];
    for (const perm of payrollPerms) {
      expect(recruiterPerms).not.toContain(perm);
    }

    // Recruiter MUST NOT receive department viewing or management permissions
    expect(recruiterPerms).not.toContain(PERMISSIONS.departmentRead);
    expect(recruiterPerms).not.toContain(PERMISSIONS.departmentCreate);
    expect(recruiterPerms).not.toContain(PERMISSIONS.departmentUpdate);
    expect(recruiterPerms).not.toContain(PERMISSIONS.departmentManage);

    // Recruiter MUST NOT receive general employee management permissions
    expect(recruiterPerms).not.toContain(PERMISSIONS.employeeCreate);
    expect(recruiterPerms).not.toContain(PERMISSIONS.employeeUpdate);
    expect(recruiterPerms).not.toContain(PERMISSIONS.employeeDelete);
    expect(recruiterPerms).not.toContain(PERMISSIONS.employeeInvite);
    expect(recruiterPerms).not.toContain(PERMISSIONS.documentVerify);

    // HR Admin retains full HR operations & authorized payroll
    expect(hrAdminPerms).toContain(PERMISSIONS.employeeCreate);
    expect(hrAdminPerms).toContain(PERMISSIONS.employeeOnboard);
    expect(hrAdminPerms).toContain(PERMISSIONS.documentVerify);
    expect(hrAdminPerms).toContain(PERMISSIONS.payrollManage);

    // HR Executive has core employee onboarding & documents, but no payroll
    expect(hrExecutivePerms).toContain(PERMISSIONS.employeeCreate);
    expect(hrExecutivePerms).toContain(PERMISSIONS.documentUpload);
    expect(hrExecutivePerms).not.toContain(PERMISSIONS.payrollManage);
    expect(hrExecutivePerms).not.toContain(PERMISSIONS.payrollCalculate);
  });


  it("configures PROJECT_MANAGER with intended project, task, and self-service attendance permissions", () => {
    const pmPerms = ROLE_PERMISSIONS.PROJECT_MANAGER;
    expect(pmPerms).toBeDefined();
    expect(pmPerms).toContain(PERMISSIONS.organizationRead);
    expect(pmPerms).toContain(PERMISSIONS.employeeRead);
    expect(pmPerms).toContain(PERMISSIONS.attendanceRead);
    expect(pmPerms).toContain(PERMISSIONS.attendanceClockIn);
    expect(pmPerms).toContain(PERMISSIONS.attendanceClockOut);
    expect(pmPerms).toContain(PERMISSIONS.attendanceBreak);
    expect(pmPerms).toContain(PERMISSIONS.attendanceRegularizationCreate);
    expect(pmPerms).toContain(PERMISSIONS.attendanceRegularizationRead);
    expect(pmPerms).toContain(PERMISSIONS.projectView);
    expect(pmPerms).toContain(PERMISSIONS.projectCreate);
    expect(pmPerms).toContain(PERMISSIONS.projectEdit);
    expect(pmPerms).toContain(PERMISSIONS.projectArchive);
    expect(pmPerms).toContain(PERMISSIONS.projectManageMembers);
    expect(pmPerms).toContain(PERMISSIONS.taskRead);
    expect(pmPerms).toContain(PERMISSIONS.taskCreate);
    expect(pmPerms).toContain(PERMISSIONS.taskAssign);
    expect(pmPerms).toContain(PERMISSIONS.taskUpdate);
    expect(pmPerms).toContain(PERMISSIONS.taskDelete);
    expect(pmPerms).toContain(PERMISSIONS.taskChangeStatus);
    expect(pmPerms).toContain(PERMISSIONS.taskChangePriority);
    expect(pmPerms).toContain(PERMISSIONS.taskComment);
    expect(pmPerms).toContain(PERMISSIONS.taskAttach);
    expect(pmPerms).toContain(PERMISSIONS.taskManageDependencies);
    expect(pmPerms).toContain(PERMISSIONS.chatRead);
    expect(pmPerms).toContain(PERMISSIONS.chatSend);
    expect(pmPerms).toContain(PERMISSIONS.chatCreate);
    expect(pmPerms).toHaveLength(26);
  });

  it("configures all tenant staff roles with chat read, send, and create permissions", () => {
    const staffRoles = [
      "ORGANIZATION_OWNER",
      "HR_ADMIN",
      "HR_EXECUTIVE",
      "PROJECT_MANAGER",
      "RECRUITER",
      "MANAGER",
      "TEAM_LEAD",
      "FINANCE_ADMIN",
      "EMPLOYEE",
    ] as const;

    for (const roleKey of staffRoles) {
      const perms = ROLE_PERMISSIONS[roleKey];
      expect(perms).toContain(PERMISSIONS.chatRead);
      expect(perms).toContain(PERMISSIONS.chatSend);
      expect(perms).toContain(PERMISSIONS.chatCreate);
    }
  });

  it("restricts EMPLOYEE from viewing company-wide payroll while allowing self-service payslips", () => {
    const employeePerms = ROLE_PERMISSIONS.EMPLOYEE;
    expect(employeePerms).not.toContain(PERMISSIONS.payrollView);
    expect(employeePerms).toContain(PERMISSIONS.payrollViewSelf);
    expect(employeePerms).toContain(PERMISSIONS.payslipView);
    expect(employeePerms).toContain(PERMISSIONS.payslipDownload);
  });

  it("preserves payroll.view for authorized payroll roles", () => {
    const authorizedRoles = [
      "ORGANIZATION_OWNER",
      "HR_ADMIN",
      "FINANCE_ADMIN",
      "MANAGER",
      "TEAM_LEAD",
    ];
    for (const role of authorizedRoles) {
      expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.payrollView);
    }
  });

  describe("onboarding role hierarchy and assignable roles", () => {
    it("exposes ASSIGNABLE_ROLES_BY_ACTOR configuration map", () => {
      expect(ASSIGNABLE_ROLES_BY_ACTOR.ORGANIZATION_OWNER).toHaveLength(8);
      expect(ASSIGNABLE_ROLES_BY_ACTOR.HR_ADMIN).toHaveLength(7);
      expect(ASSIGNABLE_ROLES_BY_ACTOR.HR_EXECUTIVE).toEqual(["EMPLOYEE"]);
    });

    it("allows ORGANIZATION_OWNER to create/invite all 8 operational roles", () => {
      const roles = getAssignableRoles("ORGANIZATION_OWNER");
      expect(roles).toEqual([
        "HR_ADMIN",
        "HR_EXECUTIVE",
        "FINANCE_ADMIN",
        "MANAGER",
        "TEAM_LEAD",
        "PROJECT_MANAGER",
        "RECRUITER",
        "EMPLOYEE",
      ]);
      for (const target of roles) {
        expect(canAssignRole("ORGANIZATION_OWNER", target)).toBe(true);
      }
      expect(canAssignRole("ORGANIZATION_OWNER", "ORGANIZATION_OWNER")).toBe(false);
      expect(canAssignRole("ORGANIZATION_OWNER", "PLATFORM_OWNER")).toBe(false);
    });

    it("allows HR_ADMIN to create/invite 7 operational roles, but never HR_ADMIN or OWNER", () => {
      const roles = getAssignableRoles("HR_ADMIN");
      expect(roles).toEqual([
        "HR_EXECUTIVE",
        "FINANCE_ADMIN",
        "MANAGER",
        "TEAM_LEAD",
        "PROJECT_MANAGER",
        "RECRUITER",
        "EMPLOYEE",
      ]);
      expect(canAssignRole("HR_ADMIN", "HR_ADMIN")).toBe(false);
      expect(canAssignRole("HR_ADMIN", "ORGANIZATION_OWNER")).toBe(false);
      expect(canAssignRole("HR_ADMIN", "PLATFORM_OWNER")).toBe(false);
      expect(canAssignRole("HR_ADMIN", "HR_EXECUTIVE")).toBe(true);
      expect(canAssignRole("HR_ADMIN", "EMPLOYEE")).toBe(true);
    });

    it("restricts HR_EXECUTIVE to create/invite EMPLOYEE only", () => {
      const roles = getAssignableRoles("HR_EXECUTIVE");
      expect(roles).toEqual(["EMPLOYEE"]);
      expect(canAssignRole("HR_EXECUTIVE", "EMPLOYEE")).toBe(true);
      expect(canAssignRole("HR_EXECUTIVE", "HR_ADMIN")).toBe(false);
      expect(canAssignRole("HR_EXECUTIVE", "HR_EXECUTIVE")).toBe(false);
      expect(canAssignRole("HR_EXECUTIVE", "MANAGER")).toBe(false);
      expect(canAssignRole("HR_EXECUTIVE", "ORGANIZATION_OWNER")).toBe(false);
    });

    it("strictly disallows other roles from creating or inviting anyone", () => {
      const disallowedRoles = [
        "FINANCE_ADMIN",
        "MANAGER",
        "TEAM_LEAD",
        "PROJECT_MANAGER",
        "RECRUITER",
        "EMPLOYEE",
        "PLATFORM_OWNER",
        null,
        undefined,
        "INVALID_ROLE",
      ];

      for (const role of disallowedRoles) {
        expect(getAssignableRoles(role)).toEqual([]);
        expect(canAssignRole(role, "EMPLOYEE")).toBe(false);
        expect(canAssignRole(role, "HR_EXECUTIVE")).toBe(false);
      }
    });

    it("defines full ROLE_METADATA for all system roles", () => {
      for (const role of SYSTEM_ROLES) {
        expect(ROLE_METADATA[role]).toBeDefined();
        expect(ROLE_METADATA[role].title).toBeTruthy();
        expect(ROLE_METADATA[role].description).toBeTruthy();
        expect(ROLE_METADATA[role].category).toBeTruthy();
      }
    });
  });

  describe("approval workflow authorization", () => {
    it("defines APPROVAL_PERMISSIONS containing relevant approval and workflow keys", () => {
      expect(APPROVAL_PERMISSIONS).toContain(PERMISSIONS.workflowApprove);
      expect(APPROVAL_PERMISSIONS).toContain(PERMISSIONS.workflowManage);
      expect(APPROVAL_PERMISSIONS).toContain(PERMISSIONS.leaveApprove);
      expect(APPROVAL_PERMISSIONS).toContain(PERMISSIONS.attendanceRegularizationApprove);
      expect(APPROVAL_PERMISSIONS).toContain(PERMISSIONS.expenseApprove);
      expect(APPROVAL_PERMISSIONS).toContain(PERMISSIONS.payrollApprove);
      expect(APPROVAL_PERMISSIONS).toContain(PERMISSIONS.atsRequisitionApprove);
    });

    it("evaluates hasAnyApprovalPermission accurately across system roles", () => {
      // Authorized roles with approval or workflow sign-off capabilities
      const authorizedRoles = [
        "ORGANIZATION_OWNER",
        "HR_ADMIN",
        "MANAGER",
        "TEAM_LEAD",
        "FINANCE_ADMIN",
      ];
      for (const role of authorizedRoles) {
        expect(hasAnyApprovalPermission(ROLE_PERMISSIONS[role])).toBe(true);
      }

      // Unauthorized roles without approval permissions
      const unauthorizedRoles = [
        "EMPLOYEE",
        "HR_EXECUTIVE",
        "PROJECT_MANAGER",
        "RECRUITER",
      ];
      for (const role of unauthorizedRoles) {
        expect(hasAnyApprovalPermission(ROLE_PERMISSIONS[role])).toBe(false);
      }
    });

    it("verifies EMPLOYEE has neither employee.read nor any approval permission", () => {
      const employeePerms = ROLE_PERMISSIONS.EMPLOYEE;
      expect(employeePerms).not.toContain(PERMISSIONS.employeeRead);
      expect(hasAnyApprovalPermission(employeePerms)).toBe(false);
    });
  });
});

