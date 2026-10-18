import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { isHrDepartment } from "@/modules/departments/validation";
import { Step2RoleDetails } from "@/components/employees/onboarding-wizard/step-2-role-details";
import { Step3ReviewConfirm } from "@/components/employees/onboarding-wizard/step-3-review-confirm";
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

  describe("2. UI Role-Details Filtering & Exclusion (HR vs Non-HR)", () => {
    const mockDepts = [
      { id: "dept-hr", name: "Human Resources", code: "HR" },
      { id: "dept-eng", name: "Engineering", code: "ENG" },
      { id: "dept-sales", name: "Sales", code: "SALES" },
    ];
    const mockShifts = [
      { id: "shift-1", name: "Standard General Shift", startTime: "09:00", endTime: "18:00" },
    ];
    const mockTypes = [
      { id: "type-1", name: "Full-time Regular", code: "FULL_TIME" },
    ];
    const mockDesignations = [
      { id: "desig-1", name: "HR Business Partner", code: "HRBP" },
    ];

    it("filters Department dropdown to ONLY HR departments for HR_ADMIN and HR_EXECUTIVE", () => {
      const hrAdminHtml = renderToStaticMarkup(
        React.createElement(Step2RoleDetails, {
          form: {
            targetRole: "HR_ADMIN",
            firstName: "Arun",
            middleName: "",
            lastName: "Nair",
            personalEmail: "arun@example.com",
            workEmail: "",
            phone: "",
            joiningDate: "",
            departmentId: "dept-hr",
            designationId: "",
            teamId: "",
            locationId: "",
            shiftId: "",
            employmentTypeId: "",
            reportingManagerId: "",
          },
          onChange: () => {},
          errors: {},
          departments: mockDepts,
          designations: mockDesignations,
          shifts: mockShifts,
          employmentTypes: mockTypes,
          isLoadingMasterData: false,
        })
      );

      // Selected HR department is rendered in button
      expect(hrAdminHtml).toContain("Human Resources (HR)");
      expect(hrAdminHtml).not.toContain("Engineering (ENG)");
      expect(hrAdminHtml).not.toContain("Sales (SALES)");
    });

    it("omits Team / Squad and Location / Office fields completely for HR roles", () => {
      const hrAdminHtml = renderToStaticMarkup(
        React.createElement(Step2RoleDetails, {
          form: {
            targetRole: "HR_ADMIN",
            firstName: "Arun",
            middleName: "",
            lastName: "Nair",
            personalEmail: "arun@example.com",
            workEmail: "",
            phone: "",
            joiningDate: "",
            departmentId: "dept-hr",
            designationId: "",
            teamId: "",
            locationId: "",
            shiftId: "",
            employmentTypeId: "",
            reportingManagerId: "",
          },
          onChange: () => {},
          errors: {},
          departments: mockDepts,
          designations: mockDesignations,
          shifts: mockShifts,
          employmentTypes: mockTypes,
          isLoadingMasterData: false,
        })
      );

      // Must NOT contain Location or Team inputs
      expect(hrAdminHtml).not.toContain("Location / Office");
      expect(hrAdminHtml).not.toContain("Team / Squad");
    });

    it("preserves Team and Location for standard non-HR roles (EMPLOYEE)", () => {
      const employeeHtml = renderToStaticMarkup(
        React.createElement(Step2RoleDetails, {
          form: {
            targetRole: "EMPLOYEE",
            firstName: "Priya",
            middleName: "",
            lastName: "Menon",
            personalEmail: "priya@example.com",
            workEmail: "",
            phone: "",
            joiningDate: "",
            departmentId: "dept-eng",
            designationId: "",
            teamId: "",
            locationId: "",
            shiftId: "",
            employmentTypeId: "",
            reportingManagerId: "",
          },
          onChange: () => {},
          errors: {},
          departments: mockDepts,
          designations: mockDesignations,
          shifts: mockShifts,
          employmentTypes: mockTypes,
          isLoadingMasterData: false,
        })
      );

      // Must contain Location and Team inputs for EMPLOYEE
      expect(employeeHtml).toContain("Location / Office");
      expect(employeeHtml).toContain("Team / Squad");
      expect(employeeHtml).toContain("Engineering (ENG)");
    });

    it("displays clear guidance when no HR department exists for HR onboarding", () => {
      const noHrHtml = renderToStaticMarkup(
        React.createElement(Step2RoleDetails, {
          form: {
            targetRole: "HR_ADMIN",
            firstName: "Arun",
            middleName: "",
            lastName: "Nair",
            personalEmail: "arun@example.com",
            workEmail: "",
            phone: "",
            joiningDate: "",
            departmentId: "",
            designationId: "",
            teamId: "",
            locationId: "",
            shiftId: "",
            employmentTypeId: "",
            reportingManagerId: "",
          },
          onChange: () => {},
          errors: {},
          departments: [{ id: "dept-eng", name: "Engineering", code: "ENG" }],
          designations: mockDesignations,
          shifts: mockShifts,
          employmentTypes: mockTypes,
          isLoadingMasterData: false,
        })
      );

      expect(noHrHtml).toContain("No active HR department configured");
      expect(noHrHtml).toContain("Settings &gt; Master Data &gt; Departments");
    });
  });

  describe("3. Review & Confirm Summary Card (Location & Team Omission for HR)", () => {
    it("never renders Location or Team rows in Step 3 for HR roles", () => {
      const html = renderToStaticMarkup(
        React.createElement(Step3ReviewConfirm, {
          form: {
            targetRole: "HR_ADMIN",
            firstName: "Arun",
            middleName: "",
            lastName: "Nair",
            personalEmail: "arun@example.com",
            workEmail: "arun.hr@company.com",
            phone: "+91 99999 88888",
            joiningDate: "",
            departmentId: "dept-hr",
            designationId: "desig-1",
            teamId: "team-accidental", // should be ignored
            locationId: "loc-accidental", // should be ignored
            shiftId: "shift-1",
            employmentTypeId: "type-1",
            reportingManagerId: "",
          },
          onEditStep: () => {},
          isSubmitting: false,
          submissionError: null,
          onSubmit: () => {},
          departments: [{ id: "dept-hr", name: "Human Resources", code: "HR" }],
          designations: [{ id: "desig-1", name: "HR Administrator", code: "HRADMIN" }],
          shifts: [{ id: "shift-1", name: "General Shift", startTime: "09:00", endTime: "18:00" }],
          employmentTypes: [{ id: "type-1", name: "Full-time Regular", code: "FULL_TIME" }],
          locations: [{ id: "loc-accidental", name: "Bangalore HQ" }],
          teams: [{ id: "team-accidental", name: "Core HR Team", code: "CHRT" }],
        })
      );

      expect(html).toContain("Human Resources (HR)");
      expect(html).toContain("HR Administrator (HRADMIN)");
      expect(html).toContain("General Shift (09:00 – 18:00)");
      expect(html).toContain("Full-time Regular (FULL_TIME)");

      // Must NEVER display Location or Team rows for HR
      expect(html).not.toContain("Location / Office");
      expect(html).not.toContain("Bangalore HQ");
      expect(html).not.toContain("Team / Squad");
      expect(html).not.toContain("Core HR Team");
    });
  });

  describe("4. HR_ADMIN vs HR_EXECUTIVE RBAC Separation", () => {
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
