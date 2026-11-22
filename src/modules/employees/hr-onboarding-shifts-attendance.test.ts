import { describe, expect, it } from "vitest";
import { isHrDepartment } from "@/modules/departments/validation";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  canAssignRole,
  getAssignableRoles,
} from "@/modules/rbac/permissions";

describe("Phase 10 — Comprehensive HR Onboarding, Shift Assignment & Attendance Integration Tests", () => {
  describe("1. isHrDepartment Matching Rules", () => {
    it("correctly identifies HR departments by code or name case-insensitively", () => {
      expect(isHrDepartment({ code: "HR", name: "Human Resources" })).toBe(true);
      expect(isHrDepartment({ code: "hr", name: "People Operations" })).toBe(true);
      expect(isHrDepartment({ code: "CORP_HR", name: "Human Resources" })).toBe(true);
      expect(isHrDepartment({ code: "PEOPLE", name: "Human Resource Department" })).toBe(true);
      expect(isHrDepartment({ code: "HROPS", name: "HR" })).toBe(true);
    });

    it("rejects non-HR departments", () => {
      expect(isHrDepartment({ code: "ENG", name: "Engineering" })).toBe(false);
      expect(isHrDepartment({ code: "SALES", name: "Global Sales" })).toBe(false);
      expect(isHrDepartment({ code: "FIN", name: "Finance & Accounting" })).toBe(false);
      expect(isHrDepartment(null)).toBe(false);
      expect(isHrDepartment(undefined)).toBe(false);
      expect(isHrDepartment({ code: "", name: "" })).toBe(false);
    });
  });

  describe("2. HR_ADMIN vs HR_EXECUTIVE RBAC Separation", () => {
    it("preserves distinct system permissions between HR_ADMIN and HR_EXECUTIVE", () => {
      const hrAdminPerms = new Set(ROLE_PERMISSIONS.HR_ADMIN);
      const hrExecPerms = new Set(ROLE_PERMISSIONS.HR_EXECUTIVE);

      // HR_ADMIN has administrative management privileges
      expect(hrAdminPerms.has(PERMISSIONS.organizationSettingsRead)).toBe(true);
      expect(hrAdminPerms.has(PERMISSIONS.organizationSettingsUpdate)).toBe(true);
      expect(hrAdminPerms.has(PERMISSIONS.departmentCreate)).toBe(true);
      expect(hrAdminPerms.has(PERMISSIONS.departmentManage)).toBe(true);
      expect(hrAdminPerms.has(PERMISSIONS.attendanceManage)).toBe(true);
      expect(hrAdminPerms.has(PERMISSIONS.payrollConfigure)).toBe(true);

      // HR_EXECUTIVE does NOT have administrative management privileges
      expect(hrExecPerms.has(PERMISSIONS.organizationSettingsRead)).toBe(false);
      expect(hrExecPerms.has(PERMISSIONS.organizationSettingsUpdate)).toBe(false);
      expect(hrExecPerms.has(PERMISSIONS.departmentCreate)).toBe(false);
      expect(hrExecPerms.has(PERMISSIONS.departmentManage)).toBe(false);
      expect(hrExecPerms.has(PERMISSIONS.attendanceManage)).toBe(false);
      expect(hrExecPerms.has(PERMISSIONS.payrollConfigure)).toBe(false);
    });

    it("verifies assignable roles hierarchy (HR_ADMIN can assign HR_EXECUTIVE, HR_EXECUTIVE cannot assign HR_ADMIN)", () => {
      expect(canAssignRole("HR_ADMIN", "HR_EXECUTIVE")).toBe(true);
      expect(canAssignRole("HR_ADMIN", "HR_ADMIN")).toBe(false);
      expect(canAssignRole("HR_EXECUTIVE", "HR_ADMIN")).toBe(false);
      expect(canAssignRole("HR_EXECUTIVE", "HR_EXECUTIVE")).toBe(false);
      expect(getAssignableRoles("HR_EXECUTIVE")).toEqual(["EMPLOYEE"]);
    });
  });
});
