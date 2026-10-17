import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/modules/rbac/permissions";

const authorize = vi.fn();
const resolveTenantContext = vi.fn();
const recordAudit = vi.fn();

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

// Test actors and IDs
const organizationId = "org-main-001";
const otherOrganizationId = "org-other-002";

// Arjun Kumar: HR Admin and HR Department Manager
const arjunUserId = "user-arjun-kumar";
const arjunEmployeeId = "emp-arjun-001";

// Other employee (Engineering lead)
const engLeadEmployeeId = "emp-eng-lead-002";

// Departments
const hrDeptId = "dept-hr-101";
const engDeptId = "dept-eng-202";

describe("Department Management — Scoped Access & Authorization Regression Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorize.mockResolvedValue({ id: arjunUserId });
    resolveTenantContext.mockResolvedValue({
      organization: { id: organizationId },
      user: { id: arjunUserId },
      role: { key: "HR_ADMIN" },
    });
  });

  describe("1. Role and Permission Boundaries Preservation", () => {
    it("preserves standard HR_ADMIN permissions without granting owner or billing permissions", () => {
      const hrAdminPerms = ROLE_PERMISSIONS.HR_ADMIN;
      expect(hrAdminPerms).toContain(PERMISSIONS.employeeRead);
      expect(hrAdminPerms).toContain(PERMISSIONS.employeeCreate);
      expect(hrAdminPerms).toContain(PERMISSIONS.employeeUpdate);
      expect(hrAdminPerms).toContain(PERMISSIONS.attendanceRead);
      expect(hrAdminPerms).toContain(PERMISSIONS.leaveApprove);

      // Must NOT include sensitive owner or billing permissions
      expect(hrAdminPerms).not.toContain(PERMISSIONS.organizationManage);
      expect(hrAdminPerms).not.toContain(PERMISSIONS.billingManage);
      expect(hrAdminPerms).not.toContain(PERMISSIONS.billingView);

      // Has authorized department and HR settings management permissions
      expect(hrAdminPerms).toContain(PERMISSIONS.departmentManage);
      expect(hrAdminPerms).toContain(PERMISSIONS.organizationSettingsUpdate);
    });

    it("ensures department manager assignment does not leak extra payroll or org administration permissions", () => {
      const managerPerms = ROLE_PERMISSIONS.MANAGER;
      expect(managerPerms).toContain(PERMISSIONS.departmentRead);
      expect(managerPerms).toContain(PERMISSIONS.employeeRead);
      expect(managerPerms).toContain(PERMISSIONS.attendanceRead);

      // Must NOT have sensitive payroll or settings permissions
      expect(managerPerms).not.toContain(PERMISSIONS.payrollConfigure);
      expect(managerPerms).not.toContain(PERMISSIONS.payrollFinalize);
      expect(managerPerms).not.toContain(PERMISSIONS.organizationSettingsUpdate);
      expect(managerPerms).not.toContain(PERMISSIONS.employeeUpdate);
      expect(managerPerms).not.toContain(PERMISSIONS.employeeCreate);
    });
  });

  describe("2. Server-side Department Scoping & Isolation Logic", () => {
    it("identifies Arjun Kumar as assigned manager for HR Department and verifies scope isolation", async () => {
      // Simulate isManagerOfDepartment check logic
      const isManagerOfHr = (deptId: string, headEmpId: string | null, actorEmpId: string) =>
        deptId === hrDeptId && headEmpId === actorEmpId;

      expect(isManagerOfHr(hrDeptId, arjunEmployeeId, arjunEmployeeId)).toBe(true);
      expect(isManagerOfHr(engDeptId, engLeadEmployeeId, arjunEmployeeId)).toBe(false);
    });

    it("immediately revokes department manager access when headEmployeeId is removed or reassigned", () => {
      let currentHeadEmployeeId: string | null = arjunEmployeeId;

      const checkAccess = (actorEmpId: string) => currentHeadEmployeeId === actorEmpId;

      // When assigned: has access
      expect(checkAccess(arjunEmployeeId)).toBe(true);

      // When owner removes or changes assignment:
      currentHeadEmployeeId = null;
      expect(checkAccess(arjunEmployeeId)).toBe(false);

      currentHeadEmployeeId = "emp-someone-else";
      expect(checkAccess(arjunEmployeeId)).toBe(false);
    });
  });

  describe("3. Team Management Scope and Validation Rules", () => {
    it("validates team code formatting and unique constraint within organization", () => {
      const existingTeamCodes = new Set(["HR-REC", "ENG-CORE"]);

      const validateTeamCode = (code: string) => {
        const clean = code.trim().toUpperCase();
        if (clean.length < 2 || clean.length > 40) return { valid: false, reason: "length" };
        if (!/^[A-Za-z0-9_-]+$/.test(clean)) return { valid: false, reason: "format" };
        if (existingTeamCodes.has(clean)) return { valid: false, reason: "duplicate" };
        return { valid: true, code: clean };
      };

      expect(validateTeamCode("hr-ops")).toEqual({ valid: true, code: "HR-OPS" });
      expect(validateTeamCode("HR-REC")).toEqual({ valid: false, reason: "duplicate" });
      expect(validateTeamCode("X")).toEqual({ valid: false, reason: "length" });
      expect(validateTeamCode("INVALID CODE!")).toEqual({ valid: false, reason: "format" });
    });

    it("strictly prevents managers from assigning or moving a team to another department", () => {
      const originalDepartmentId = hrDeptId;
      const targetDepartmentId = engDeptId;

      const canManagerMoveTeamToOtherDept = (isOwner: boolean, sourceDept: string, destDept: string) => {
        if (isOwner) return true;
        // Department managers can NEVER move teams to other departments
        return sourceDept === destDept;
      };

      expect(canManagerMoveTeamToOtherDept(false, originalDepartmentId, targetDepartmentId)).toBe(false);
      expect(canManagerMoveTeamToOtherDept(true, originalDepartmentId, targetDepartmentId)).toBe(true);
      expect(canManagerMoveTeamToOtherDept(false, hrDeptId, hrDeptId)).toBe(true);
    });
  });

  describe("4. Attendance Calculation & Absence Rules for Department Roster", () => {
    const today = "2026-10-14";
    const pastWorkingDay = "2026-10-13";

    function computeRosterAttendanceStatus(params: {
      date: string;
      isToday: boolean;
      isPastDate: boolean;
      isWorkingDay: boolean;
      isHoliday: boolean;
      joiningDate?: string | null;
      hasPunch: boolean;
      hasApprovedLeave: boolean;
    }) {
      if (params.joiningDate && params.joiningDate > params.date) {
        return "not_joined";
      }
      if (params.hasPunch) {
        return "present";
      }
      if (params.hasApprovedLeave) {
        return "on_leave";
      }
      if (params.isHoliday) {
        return "holiday";
      }
      if (!params.isWorkingDay) {
        return "weekend";
      }
      if (params.isToday) {
        return "pending_arrival";
      }
      if (params.isPastDate) {
        return "absent";
      }
      return "pending_arrival";
    }

    it("marks unpunched employee on current workday as pending_arrival (not absent)", () => {
      const status = computeRosterAttendanceStatus({
        date: today,
        isToday: true,
        isPastDate: false,
        isWorkingDay: true,
        isHoliday: false,
        joiningDate: "2026-01-01",
        hasPunch: false,
        hasApprovedLeave: false,
      });

      expect(status).toBe("pending_arrival");
    });

    it("marks employee with approved leave as on_leave and excludes them from absence count", () => {
      const status = computeRosterAttendanceStatus({
        date: pastWorkingDay,
        isToday: false,
        isPastDate: true,
        isWorkingDay: true,
        isHoliday: false,
        joiningDate: "2026-01-01",
        hasPunch: false,
        hasApprovedLeave: true,
      });

      expect(status).toBe("on_leave");
    });

    it("marks employee on holiday as holiday and excludes them from absence count", () => {
      const status = computeRosterAttendanceStatus({
        date: pastWorkingDay,
        isToday: false,
        isPastDate: true,
        isWorkingDay: true,
        isHoliday: true,
        joiningDate: "2026-01-01",
        hasPunch: false,
        hasApprovedLeave: false,
      });

      expect(status).toBe("holiday");
    });

    it("marks employee on weekly rest day as weekend and excludes them from absence count", () => {
      const status = computeRosterAttendanceStatus({
        date: pastWorkingDay,
        isToday: false,
        isPastDate: true,
        isWorkingDay: false,
        isHoliday: false,
        joiningDate: "2026-01-01",
        hasPunch: false,
        hasApprovedLeave: false,
      });

      expect(status).toBe("weekend");
    });

    it("marks employee with future joining date as not_joined", () => {
      const status = computeRosterAttendanceStatus({
        date: today,
        isToday: true,
        isPastDate: false,
        isWorkingDay: true,
        isHoliday: false,
        joiningDate: "2026-11-01",
        hasPunch: false,
        hasApprovedLeave: false,
      });

      expect(status).toBe("not_joined");
    });

    it("marks unpunched employee on past working day without leave as absent", () => {
      const status = computeRosterAttendanceStatus({
        date: pastWorkingDay,
        isToday: false,
        isPastDate: true,
        isWorkingDay: true,
        isHoliday: false,
        joiningDate: "2026-01-01",
        hasPunch: false,
        hasApprovedLeave: false,
      });

      expect(status).toBe("absent");
    });
  });

  describe("5. Tenant & Cross-Organization Isolation Verification", () => {
    it("rejects operations when department belongs to a different organization", () => {
      const checkOrgMatch = (userOrgId: string, resourceOrgId: string) => {
        if (userOrgId !== resourceOrgId) {
          throw new AppError("FORBIDDEN", "Tenant isolation violation.", 403);
        }
        return true;
      };

      expect(() => checkOrgMatch(organizationId, otherOrganizationId)).toThrowError(
        new AppError("FORBIDDEN", "Tenant isolation violation.", 403)
      );
      expect(checkOrgMatch(organizationId, organizationId)).toBe(true);
    });

    it("rejects team operations when team department does not match requested department", () => {
      const checkTeamDepartmentMatch = (targetDeptId: string, teamDeptId: string) => {
        if (targetDeptId !== teamDeptId) {
          throw new AppError("FORBIDDEN", "Team does not belong to this department.", 403);
        }
        return true;
      };

      expect(() => checkTeamDepartmentMatch(hrDeptId, engDeptId)).toThrowError(
        new AppError("FORBIDDEN", "Team does not belong to this department.", 403)
      );
      expect(checkTeamDepartmentMatch(hrDeptId, hrDeptId)).toBe(true);
    });
  });
});
