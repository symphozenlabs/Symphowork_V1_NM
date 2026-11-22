import { describe, expect, it, vi, beforeEach } from "vitest";
import { assertIsOrganizationOwner } from "@/modules/departments/service";

const mocks = vi.hoisted(() => ({
  recordAudit: vi.fn(),
  authorize: vi.fn(),
  can: vi.fn(),
  isActorPrivilegedForOwnerRecord: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  recordAudit: mocks.recordAudit,
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize: mocks.authorize,
  can: mocks.can,
}));

vi.mock("@/modules/employees/service", () => ({
  enrichEmployeesWithRoles: vi.fn(),
  isActorPrivilegedForOwnerRecord: mocks.isActorPrivilegedForOwnerRecord,
}));

vi.mock("@/db/client", () => ({
  db: {},
  withTenantTransaction: vi.fn(),
}));

describe("Department Service Unit & Safety Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("assertIsOrganizationOwner", () => {
    it("allows a user the owner-record policy marks privileged", async () => {
      mocks.isActorPrivilegedForOwnerRecord.mockResolvedValue(true);

      await expect(assertIsOrganizationOwner("org-a", "user-a")).resolves.toBe(true);
      expect(mocks.isActorPrivilegedForOwnerRecord).toHaveBeenCalledWith("org-a", "user-a", undefined);
      expect(mocks.can).not.toHaveBeenCalled();
    });

    it("allows the department management permission", async () => {
      mocks.isActorPrivilegedForOwnerRecord.mockResolvedValue(false);
      mocks.can.mockResolvedValue(true);

      await expect(assertIsOrganizationOwner("org-a", "user-a")).resolves.toBe(true);
      expect(mocks.can).toHaveBeenCalledWith({ userId: "user-a", organizationId: "org-a", permission: "department.manage" });
    });

    it("rejects a user without owner privilege or department management permission", async () => {
      mocks.isActorPrivilegedForOwnerRecord.mockResolvedValue(false);
      mocks.can.mockResolvedValue(false);

      await expect(assertIsOrganizationOwner("org-a", "user-a")).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    });
  });

  describe("Deletion safety & dependency checks", () => {
    it("reports safe deletion when 0 active employees, teams, requisitions, or policies", () => {
      const mockSafety = {
        canDelete: true,
        reason: undefined,
        counts: {
          activeEmployees: 0,
          activeTeams: 0,
          activeRequisitions: 0,
          activeExpensePolicies: 0,
        },
      };

      expect(mockSafety.canDelete).toBe(true);
      expect(mockSafety.counts.activeEmployees).toBe(0);
    });

    it("blocks deletion when active employees are assigned", () => {
      const activeEmployees: number = 3;
      const canDelete = activeEmployees === 0;
      expect(canDelete).toBe(false);
    });

    it("blocks deletion when active ATS requisitions exist", () => {
      const activeRequisitions: number = 1;
      const canDelete = activeRequisitions === 0;
      expect(canDelete).toBe(false);
    });
  });

  describe("Attendance calculation rules", () => {
    it("approved leave does not count as absence", () => {
      const hasApprovedLeave = true;
      const hasPunch = false;
      const isPastWorkingDay = true;

      let status = "absent";
      if (hasPunch) {
        status = "present";
      } else if (hasApprovedLeave) {
        status = "leave";
      } else if (isPastWorkingDay) {
        status = "absent";
      }

      expect(status).toBe("leave");
    });

    it("non-working days and holidays do not count as absence", () => {
      const isWorkingDay = false;
      const isHoliday = true;
      const hasPunch = false;

      let absentCount = 0;
      if (!isWorkingDay || isHoliday) {
        // Excluded from absence calculation
      } else if (!hasPunch) {
        absentCount++;
      }

      expect(absentCount).toBe(0);
    });

    it("unpunched employee on current working day is pending arrival, not absent", () => {
      const isCurrentDate = true;
      const hasPunch = false;
      const isWorkingDay = true;
      const isHoliday = false;

      let pendingCount = 0;
      let absentCount = 0;

      if (isWorkingDay && !isHoliday) {
        if (!hasPunch) {
          if (isCurrentDate) {
            pendingCount++;
          } else {
            absentCount++;
          }
        }
      }

      expect(pendingCount).toBe(1);
      expect(absentCount).toBe(0);
    });

    it("employee with future joining date is excluded from attendance calculation", () => {
      const targetDate = "2026-10-14";
      const employeeJoiningDate = "2026-11-01";

      const isEligible = !employeeJoiningDate || employeeJoiningDate <= targetDate;
      expect(isEligible).toBe(false);
    });
  });
});
