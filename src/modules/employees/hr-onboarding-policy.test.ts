import { describe, expect, it } from "vitest";
import { isHrDepartment } from "@/modules/departments/validation";
import { PERMISSIONS, ROLE_PERMISSIONS, canAssignRole, getAssignableRoles } from "@/modules/rbac/permissions";

describe("HR onboarding domain policy", () => {
  it("recognizes HR departments by code or name, case-insensitively", () => {
    expect(isHrDepartment({ code: "HR", name: "Human Resources" })).toBe(true);
    expect(isHrDepartment({ code: "hr", name: "People Operations" })).toBe(true);
    expect(isHrDepartment({ code: "CORP_HR", name: "Human Resources" })).toBe(true);
    expect(isHrDepartment({ code: "PEOPLE", name: "Human Resource Department" })).toBe(true);
    expect(isHrDepartment({ code: "HROPS", name: "HR" })).toBe(true);
    expect(isHrDepartment({ code: "ENG", name: "Engineering" })).toBe(false);
    expect(isHrDepartment(null)).toBe(false);
    expect(isHrDepartment(undefined)).toBe(false);
  });

  it("keeps HR_ADMIN and HR_EXECUTIVE permissions distinct", () => {
    expect(ROLE_PERMISSIONS.HR_ADMIN).toContain(PERMISSIONS.employeeOnboard);
    expect(ROLE_PERMISSIONS.HR_EXECUTIVE).not.toContain(PERMISSIONS.employeeOnboard);
  });

  it("allows HR_ADMIN to assign HR_EXECUTIVE, but not the reverse", () => {
    expect(canAssignRole("HR_ADMIN", "HR_EXECUTIVE")).toBe(true);
    expect(canAssignRole("HR_EXECUTIVE", "HR_ADMIN")).toBe(false);
    expect(getAssignableRoles("HR_EXECUTIVE")).not.toContain("HR_ADMIN");
  });
});
