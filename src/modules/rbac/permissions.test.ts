import { describe, expect, it } from "vitest";
import { ALL_PERMISSION_KEYS, PERMISSIONS, ROLE_PERMISSIONS } from "@/modules/rbac/permissions";

describe("permission registry", () => {
  it("uses stable resource.action keys", () => {
    expect(ALL_PERMISSION_KEYS).toContain("organization.manage");
    expect(Object.values(PERMISSIONS).every((key) => /^[a-z]+(?:\.[a-z]+)+$/.test(key))).toBe(true);
  });

  it("gives the owner role the complete registry", () => {
    expect(ROLE_PERMISSIONS.ORGANIZATION_OWNER).toHaveLength(ALL_PERMISSION_KEYS.length);
  });

  it("configures HR_EXECUTIVE with intended core HR permissions", () => {
    const hrExecutivePerms = ROLE_PERMISSIONS.HR_EXECUTIVE;
    expect(hrExecutivePerms).toBeDefined();
    expect(hrExecutivePerms).toContain(PERMISSIONS.employeeRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.employeeUpdate);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceRegularizationCreate);
    expect(hrExecutivePerms).toContain(PERMISSIONS.attendanceRegularizationRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.leaveRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.leaveApply);
    expect(hrExecutivePerms).toContain(PERMISSIONS.documentRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.documentUpload);
    expect(hrExecutivePerms).toContain(PERMISSIONS.chatRead);
    expect(hrExecutivePerms).toContain(PERMISSIONS.chatSend);
    expect(hrExecutivePerms).toContain(PERMISSIONS.organizationRead);
    expect(hrExecutivePerms).toHaveLength(12);
  });

  it("configures PROJECT_MANAGER with intended project and task permissions", () => {
    const pmPerms = ROLE_PERMISSIONS.PROJECT_MANAGER;
    expect(pmPerms).toBeDefined();
    expect(pmPerms).toContain(PERMISSIONS.organizationRead);
    expect(pmPerms).toContain(PERMISSIONS.employeeRead);
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
    expect(pmPerms).toHaveLength(19);
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
      "ORGANIZATION_ADMIN",
      "HR_ADMIN",
      "FINANCE_ADMIN",
      "MANAGER",
      "TEAM_LEAD",
    ];
    for (const role of authorizedRoles) {
      expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.payrollView);
    }
  });
});
