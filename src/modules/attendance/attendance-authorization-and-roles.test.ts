/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_PERMISSION_KEYS, PERMISSIONS, ROLE_PERMISSIONS } from "@/modules/rbac/permissions";
import { attendancePolicies, attendancePunches, attendanceRecords, organizations, shifts } from "@/db/schema";
import { recordPunch } from "@/modules/attendance/service";

const mockEmployee = {
  id: "emp-hr-exec-1",
  organizationId: "org-test-1",
  userId: "user-kavita-menon",
  displayName: "Kavita Menon",
  status: "active",
  shiftId: "shift-general-1",
};

const mockShift = {
  id: "shift-general-1",
  organizationId: "org-test-1",
  name: "General Day Shift",
  code: "GDS",
  startTime: "09:00",
  endTime: "18:00",
  overnight: false,
};

const mockOrganization = {
  id: "org-test-1",
  name: "SymphoCorp",
  timezone: "Asia/Kolkata",
};

let currentRecord: any = null;
let insertedPunches: any[] = [];
let mockUserRoleKey = "HR_EXECUTIVE";

const tx = {
  select: vi.fn(() => ({
    from: vi.fn((table: any) => ({
      where: vi.fn().mockImplementation(() => {
        return {
          orderBy: vi.fn().mockImplementation(() => {
            const inner = Promise.resolve(table === attendancePunches ? insertedPunches : (currentRecord ? [currentRecord] : []));
            (inner as any).limit = vi.fn().mockImplementation(() => Promise.resolve(currentRecord ? [currentRecord] : []));
            return inner;
          }),
          limit: vi.fn(() => Promise.resolve(currentRecord ? [currentRecord] : [])),
          then: (resolve: any) => {
            if (table === shifts) return resolve([mockShift]);
            if (table === attendanceRecords) {
              return resolve(currentRecord ? [currentRecord] : []);
            }
            if (table === attendancePunches) {
              return resolve(insertedPunches);
            }
            if (table === attendancePolicies) {
              return resolve([{ gracePeriodMinutes: 15, earlyDepartureThresholdMinutes: 15, active: true }]);
            }
            return resolve([]);
          },
        };
      }),
    })),
  })),
  insert: vi.fn((table: any) => ({
    values: vi.fn((vals: any) => {
      if (table === attendanceRecords) {
        currentRecord = { id: "rec-new", ...vals };
        return {
          returning: vi.fn().mockResolvedValue([currentRecord]),
        };
      }
      if (table === attendancePunches) {
        insertedPunches.push({ id: `p-${insertedPunches.length + 1}`, ...vals });
        return Promise.resolve([{ id: `p-${insertedPunches.length}`, ...vals }]);
      }
      return Promise.resolve([vals]);
    }),
  })),
  update: vi.fn(() => ({
    set: vi.fn((vals: any) => ({
      where: vi.fn(() => {
        if (currentRecord) currentRecord = { ...currentRecord, ...vals };
        return {
          returning: vi.fn().mockResolvedValue([currentRecord ?? vals]),
        };
      }),
    })),
  })),
};

vi.mock("@/db/client", () => ({
  db: {
    transaction: vi.fn(async (cb: any) => cb(tx)),
    select: vi.fn(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === organizations) return Promise.resolve([mockOrganization]);
          return Promise.resolve([]);
        }),
      })),
    })),
  },
}));

vi.mock("@/modules/identity/auth", () => ({
  requireSession: vi.fn(async () => ({ id: "user-kavita-menon", platformRole: "NONE" })),
  getSessionUser: vi.fn(async () => ({ id: "user-kavita-menon", platformRole: "NONE" })),
}));

vi.mock("@/modules/tenancy/context", () => ({
  getCachedTenantContext: vi.fn(async () => ({
    organization: mockOrganization,
    user: { id: "user-kavita-menon", platformRole: "NONE" },
    membership: { roleId: "role-hrexec", status: "active", organizationId: "org-test-1" },
    role: { id: "role-hrexec", key: mockUserRoleKey },
    permissions: ROLE_PERMISSIONS[mockUserRoleKey],
  })),
}));

vi.mock("@/modules/employees/service", () => ({
  getOrEnsureEmployeeForUser: vi.fn(async () => mockEmployee),
}));

vi.mock("@/lib/audit", () => ({
  recordAudit: vi.fn(),
}));

describe("Attendance Authorization & Roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T10:00:00+05:30"));
    currentRecord = null;
    insertedPunches = [];
    mockUserRoleKey = "HR_EXECUTIVE";
  });

  describe("Role Permission Matrix Verification", () => {
    it("confirms HR_EXECUTIVE has self-service attendance punch permissions", () => {
      const perms = ROLE_PERMISSIONS.HR_EXECUTIVE;
      expect(perms).toContain(PERMISSIONS.attendanceRead);
      expect(perms).toContain(PERMISSIONS.attendanceClockIn);
      expect(perms).toContain(PERMISSIONS.attendanceClockOut);
      expect(perms).toContain(PERMISSIONS.attendanceBreak);
      expect(perms).toContain(PERMISSIONS.attendanceRegularizationCreate);
      expect(perms).toContain(PERMISSIONS.attendanceRegularizationRead);
      // HR_EXECUTIVE must not have administrative attendance management
      expect(perms).not.toContain(PERMISSIONS.attendanceManage);
    });

    it("confirms other operational staff roles have self-service attendance punch permissions", () => {
      const staffRoles = [
        "EMPLOYEE",
        "HR_ADMIN",
        "MANAGER",
        "TEAM_LEAD",
        "FINANCE_ADMIN",
        "PROJECT_MANAGER",
        "RECRUITER",
      ];

      for (const role of staffRoles) {
        const perms = ROLE_PERMISSIONS[role];
        expect(perms).toContain(PERMISSIONS.attendanceRead);
        expect(perms).toContain(PERMISSIONS.attendanceClockIn);
        expect(perms).toContain(PERMISSIONS.attendanceClockOut);
        expect(perms).toContain(PERMISSIONS.attendanceBreak);
      }
    });

    it("preserves ORGANIZATION_OWNER all-inclusive permission registry exactly", () => {
      expect(ROLE_PERMISSIONS.ORGANIZATION_OWNER).toHaveLength(ALL_PERMISSION_KEYS.length);
      expect(ROLE_PERMISSIONS.ORGANIZATION_OWNER).toContain(PERMISSIONS.attendanceClockIn);
      expect(ROLE_PERMISSIONS.ORGANIZATION_OWNER).toContain(PERMISSIONS.attendanceManage);
    });
  });

  describe("Punch Execution Authorization", () => {
    it("allows HR Executive (Kavita Menon) to record clock in for their own assigned shift", async () => {
      const result = await recordPunch({
        organizationId: "org-test-1",
        userId: "user-kavita-menon",
        type: "clock_in",
        employeeId: mockEmployee.id,
      });

      expect(result).toBeDefined();
      expect(currentRecord).toBeDefined();
      expect(currentRecord.actualFirstIn).toBeDefined();
      expect(insertedPunches).toHaveLength(1);
      expect(insertedPunches[0].punchType).toBe("clock_in");
    });

    it("allows HR Executive to complete full break and clock out lifecycle", async () => {
      // 1. Clock in
      await recordPunch({
        organizationId: "org-test-1",
        userId: "user-kavita-menon",
        type: "clock_in",
      });

      // 2. Start break
      await recordPunch({
        organizationId: "org-test-1",
        userId: "user-kavita-menon",
        type: "break_start",
      });
      expect(insertedPunches).toHaveLength(2);
      expect(insertedPunches[1].punchType).toBe("break_start");

      // 3. End break
      await recordPunch({
        organizationId: "org-test-1",
        userId: "user-kavita-menon",
        type: "break_end",
      });
      expect(insertedPunches).toHaveLength(3);
      expect(insertedPunches[2].punchType).toBe("break_end");

      // 4. Clock out
      const outResult = await recordPunch({
        organizationId: "org-test-1",
        userId: "user-kavita-menon",
        type: "clock_out",
      });
      expect(outResult).toBeDefined();
      expect(insertedPunches).toHaveLength(4);
      expect(insertedPunches[3].punchType).toBe("clock_out");
    });

    it("rejects attempt to punch on behalf of another employee", async () => {
      await expect(
        recordPunch({
          organizationId: "org-test-1",
          userId: "user-kavita-menon",
          type: "clock_in",
          employeeId: "emp-someone-else",
        })
      ).rejects.toThrow("You are not authorized to record attendance punches for other employees.");
    });
  });
});
