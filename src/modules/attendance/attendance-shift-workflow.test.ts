/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { attendancePolicies, attendancePunches, attendanceRecords, employees, organizations, shifts } from "@/db/schema";

const authorize = vi.fn();
const authorizeAny = vi.fn();
const recordAudit = vi.fn();

let mockEmployee: any = null;
let mockOrganization: any = null;
let mockShifts: any[] = [];
let mockRecords: any[] = [];
let mockPunches: any[] = [];
let mockPolicies: any[] = [];
let insertedPunches: any[] = [];
let insertedRecords: any[] = [];
let updatedRecords: any[] = [];

const tx = {
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        const obj = {
          orderBy: vi.fn().mockImplementation(() => {
            const inner = Promise.resolve(table === attendancePunches ? mockPunches : mockRecords);
            (inner as any).limit = vi.fn().mockImplementation(() => Promise.resolve(mockRecords));
            return inner;
          }),
          then: (resolve: any) => {
            if (table === attendanceRecords) return resolve(mockRecords);
            if (table === shifts) return resolve(mockShifts);
            if (table === attendancePunches) return resolve(mockPunches);
            if (table === attendancePolicies) return resolve(mockPolicies);
            return resolve([]);
          },
        };
        return obj;
      }),
    })),
  })),
  insert: vi.fn((table: unknown) => ({
    values: vi.fn((values: any) => {
      if (table === attendancePunches) {
        insertedPunches.push(values);
        return Promise.resolve([values]);
      }
      if (table === attendanceRecords) {
        insertedRecords.push(values);
        return {
          returning: vi.fn().mockResolvedValue([{ id: "rec-new-uuid", ...values }]),
        };
      }
      return Promise.resolve([values]);
    }),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn((values: any) => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockImplementation(() => {
          if (table === attendanceRecords) {
            updatedRecords.push(values);
            return Promise.resolve([{ id: "rec-1", ...values }]);
          }
          return Promise.resolve([]);
        }),
      })),
    })),
  })),
};

vi.mock("@/db/client", () => ({
  db: {
    transaction: vi.fn(async (cb: (nestedTx: typeof tx) => Promise<unknown>) => cb(tx)),
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === organizations) return Promise.resolve([mockOrganization]);
          if (table === employees) return Promise.resolve([mockEmployee]);
          if (table === attendanceRecords) return Promise.resolve(mockRecords);
          if (table === attendancePunches) return Promise.resolve(mockPunches);
          return Promise.resolve([]);
        }),
      })),
    })),
  },
}));

vi.mock("@/modules/tenancy/authorization", () => ({ authorize, authorizeAny }));
vi.mock("@/lib/audit", () => ({ recordAudit }));
vi.mock("@/modules/employees/service", () => ({
  getOrEnsureEmployeeForUser: vi.fn(async () => mockEmployee),
}));

const { recordPunch } = await import("./service");

describe("Attendance & Shift Lifecycle Integration", () => {
  const organizationId = "org-test-1";
  const userId = "user-emp-1";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T10:00:00+05:30"));
    insertedPunches = [];
    insertedRecords = [];
    updatedRecords = [];
    mockRecords = [];
    mockPunches = [];
    mockOrganization = {
      id: organizationId,
      name: "SymphoCorp",
      timezone: "Asia/Kolkata",
    };
    mockPolicies = [
      {
        id: "pol-1",
        organizationId,
        active: true,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 15,
      },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Shift Assignment Gatekeeping on Clock In", () => {
    it("rejects clock in with 422 VALIDATION_ERROR when employee has no shift assigned", async () => {
      mockEmployee = {
        id: "emp-no-shift",
        organizationId,
        userId,
        shiftId: null, // No shift assigned
      };
      mockShifts = [];

      await expect(
        recordPunch({ organizationId, userId, type: "clock_in" })
      ).rejects.toThrow("No shift is assigned to your employee profile.");
    });

    it("rejects clock in when assigned shift does not exist in the organization", async () => {
      mockEmployee = {
        id: "emp-invalid-shift",
        organizationId,
        userId,
        shiftId: "shift-nonexistent",
      };
      mockShifts = []; // Not found in org

      await expect(
        recordPunch({ organizationId, userId, type: "clock_in" })
      ).rejects.toThrow("No shift is assigned to your employee profile.");
    });
  });

  describe("Shift-Scheduled Attendance Window and Punch Recording", () => {
    it("records clock in with accurate server timestamp and associates shift schedule window", async () => {
      mockEmployee = {
        id: "emp-with-shift",
        organizationId,
        userId,
        shiftId: "shift-general-0918",
      };
      mockShifts = [
        {
          id: "shift-general-0918",
          organizationId,
          name: "General Day Shift",
          startTime: "09:00",
          endTime: "18:00",
          overnight: false,
        },
      ];
      mockRecords = []; // No existing record for today

      const beforePunch = new Date();
      const result = await recordPunch({ organizationId, userId, type: "clock_in" });
      const afterPunch = new Date();

      expect(result).toBeDefined();
      expect(insertedRecords).toHaveLength(1);
      expect(insertedRecords[0].shiftId).toBe("shift-general-0918");
      expect(insertedRecords[0].scheduledStart).toBeDefined();
      expect(insertedRecords[0].scheduledEnd).toBeDefined();

      expect(insertedPunches).toHaveLength(1);
      expect(insertedPunches[0].punchType).toBe("clock_in");
      expect(insertedPunches[0].punchedAt.getTime()).toBeGreaterThanOrEqual(beforePunch.getTime());
      expect(insertedPunches[0].punchedAt.getTime()).toBeLessThanOrEqual(afterPunch.getTime());
    });

    it("prevents duplicate clock in for the same work date", async () => {
      mockEmployee = {
        id: "emp-with-shift",
        organizationId,
        userId,
        shiftId: "shift-general-0918",
      };
      mockShifts = [
        {
          id: "shift-general-0918",
          organizationId,
          name: "General Day Shift",
          startTime: "09:00",
          endTime: "18:00",
          overnight: false,
        },
      ];
      mockRecords = [
        {
          id: "rec-already-clocked",
          organizationId,
          employeeId: "emp-with-shift",
          actualFirstIn: new Date().toISOString(),
        },
      ];

      await expect(
        recordPunch({ organizationId, userId, type: "clock_in" })
      ).rejects.toThrow("You are already clocked in for this work date.");
    });

    it("prevents clocking out before clocking in", async () => {
      mockEmployee = {
        id: "emp-with-shift",
        organizationId,
        userId,
        shiftId: "shift-general-0918",
      };
      mockShifts = [
        {
          id: "shift-general-0918",
          organizationId,
          name: "General Day Shift",
          startTime: "09:00",
          endTime: "18:00",
          overnight: false,
        },
      ];
      mockRecords = []; // No active record

      await expect(
        recordPunch({ organizationId, userId, type: "clock_out" })
      ).rejects.toThrow("Clock in before clocking out.");
    });
  });

  describe("Self-Service & Role-Based Punch Authorization Checks", () => {
    it("invokes authorizeAny with both the punch permission and attendance.manage", async () => {
      mockEmployee = {
        id: "emp-with-shift",
        organizationId,
        userId,
        status: "active",
        shiftId: "shift-general-0918",
      };
      mockShifts = [
        {
          id: "shift-general-0918",
          organizationId,
          name: "General Day Shift",
          startTime: "09:00",
          endTime: "18:00",
          overnight: false,
        },
      ];
      mockRecords = [];

      await recordPunch({ organizationId, userId, type: "clock_in" });

      expect(authorizeAny).toHaveBeenCalledWith({
        organizationId,
        permissions: ["attendance.clockin", "attendance.manage"],
      });
    });

    it("rejects punch when employee profile status is not active (e.g. suspended)", async () => {
      mockEmployee = {
        id: "emp-suspended",
        organizationId,
        userId,
        status: "suspended",
        shiftId: "shift-general-0918",
      };

      await expect(
        recordPunch({ organizationId, userId, type: "clock_in" })
      ).rejects.toThrow("Active employee profile is required to record attendance.");
    });

    it("rejects punch when caller attempts to record punch for another employeeId", async () => {
      mockEmployee = {
        id: "emp-self",
        organizationId,
        userId,
        status: "active",
        shiftId: "shift-general-0918",
      };

      await expect(
        recordPunch({ organizationId, userId, type: "clock_in", employeeId: "emp-someone-else" })
      ).rejects.toThrow("You are not authorized to record attendance punches for other employees.");
    });
  });

  describe("Attendance Lifecycle, Punch Sequences & Break Enforcement", () => {
    const shift = {
      id: "shift-general-0918",
      organizationId,
      name: "General Day Shift",
      startTime: "09:00",
      endTime: "18:00",
      overnight: false,
    };

    beforeEach(() => {
      mockEmployee = {
        id: "emp-active-tester",
        organizationId,
        userId,
        status: "active",
        shiftId: shift.id,
      };
      mockShifts = [shift];
    });

    it("supports complete lifecycle: clock in -> break start -> break end -> clock out", async () => {
      // 1. Clock in
      mockRecords = [];
      mockPunches = [];
      const resIn = await recordPunch({ organizationId, userId, type: "clock_in" });
      expect(resIn).toBeDefined();

      // 2. Break start
      mockRecords = [
        {
          id: "rec-today-1",
          organizationId,
          employeeId: mockEmployee.id,
          attendanceDate: "2026-10-18",
          shiftId: shift.id,
          actualFirstIn: new Date().toISOString(),
        },
      ];
      mockPunches = [
        {
          id: "p-in",
          attendanceId: "rec-today-1",
          punchType: "clock_in",
          punchedAt: new Date(Date.now() - 3600000),
        },
      ];
      const resBreakStart = await recordPunch({ organizationId, userId, type: "break_start" });
      expect(resBreakStart).toBeDefined();

      // 3. Break end
      mockPunches.push({
        id: "p-bstart",
        attendanceId: "rec-today-1",
        punchType: "break_start",
        punchedAt: new Date(Date.now() - 1800000),
      });
      const resBreakEnd = await recordPunch({ organizationId, userId, type: "break_end" });
      expect(resBreakEnd).toBeDefined();

      // 4. Clock out
      mockPunches.push({
        id: "p-bend",
        attendanceId: "rec-today-1",
        punchType: "break_end",
        punchedAt: new Date(Date.now() - 900000),
      });
      const resOut = await recordPunch({ organizationId, userId, type: "clock_out" });
      expect(resOut).toBeDefined();
    });

    it("supports multiple distinct breaks on the same work date", async () => {
      mockRecords = [
        {
          id: "rec-today-1",
          organizationId,
          employeeId: mockEmployee.id,
          attendanceDate: "2026-10-18",
          shiftId: shift.id,
          actualFirstIn: new Date().toISOString(),
        },
      ];
      // First break completed
      mockPunches = [
        { id: "p1", attendanceId: "rec-today-1", punchType: "clock_in", punchedAt: new Date(Date.now() - 7200000) },
        { id: "p2", attendanceId: "rec-today-1", punchType: "break_start", punchedAt: new Date(Date.now() - 5400000) },
        { id: "p3", attendanceId: "rec-today-1", punchType: "break_end", punchedAt: new Date(Date.now() - 3600000) },
      ];

      // Second break start should succeed
      const res2 = await recordPunch({ organizationId, userId, type: "break_start" });
      expect(res2).toBeDefined();

      // Second break end should succeed
      mockPunches.push({ id: "p4", attendanceId: "rec-today-1", punchType: "break_start", punchedAt: new Date(Date.now() - 1800000) });
      const resEnd2 = await recordPunch({ organizationId, userId, type: "break_end" });
      expect(resEnd2).toBeDefined();
    });

    it("rejects duplicate break start when a break is already active", async () => {
      mockRecords = [
        {
          id: "rec-today-1",
          organizationId,
          employeeId: mockEmployee.id,
          attendanceDate: "2026-10-18",
          shiftId: shift.id,
          actualFirstIn: new Date().toISOString(),
        },
      ];
      mockPunches = [
        { id: "p1", attendanceId: "rec-today-1", punchType: "clock_in", punchedAt: new Date(Date.now() - 3600000) },
        { id: "p2", attendanceId: "rec-today-1", punchType: "break_start", punchedAt: new Date(Date.now() - 1800000) },
      ];

      await expect(
        recordPunch({ organizationId, userId, type: "break_start" })
      ).rejects.toThrow("A break is already active.");
    });

    it("rejects break end when there is no active break", async () => {
      mockRecords = [
        {
          id: "rec-today-1",
          organizationId,
          employeeId: mockEmployee.id,
          attendanceDate: "2026-10-18",
          shiftId: shift.id,
          actualFirstIn: new Date().toISOString(),
        },
      ];
      mockPunches = [
        { id: "p1", attendanceId: "rec-today-1", punchType: "clock_in", punchedAt: new Date(Date.now() - 3600000) },
      ];

      await expect(
        recordPunch({ organizationId, userId, type: "break_end" })
      ).rejects.toThrow("There is no active break.");
    });

    it("rejects clocking out while an active break is ongoing", async () => {
      mockRecords = [
        {
          id: "rec-today-1",
          organizationId,
          employeeId: mockEmployee.id,
          attendanceDate: "2026-10-18",
          shiftId: shift.id,
          actualFirstIn: new Date().toISOString(),
        },
      ];
      mockPunches = [
        { id: "p1", attendanceId: "rec-today-1", punchType: "clock_in", punchedAt: new Date(Date.now() - 3600000) },
        { id: "p2", attendanceId: "rec-today-1", punchType: "break_start", punchedAt: new Date(Date.now() - 1800000) },
      ];

      await expect(
        recordPunch({ organizationId, userId, type: "clock_out" })
      ).rejects.toThrow("End active break before clocking out.");
    });

    it("rejects punches after shift is already completed (clocked out)", async () => {
      mockRecords = [
        {
          id: "rec-today-1",
          organizationId,
          employeeId: mockEmployee.id,
          attendanceDate: "2026-10-18",
          shiftId: shift.id,
          actualFirstIn: new Date(Date.now() - 7200000).toISOString(),
          actualLastOut: new Date().toISOString(),
        },
      ];

      // Clock in again on same work date
      await expect(
        recordPunch({ organizationId, userId, type: "clock_in" })
      ).rejects.toThrow("You are already clocked in for this work date.");

      // Clock out again
      await expect(
        recordPunch({ organizationId, userId, type: "clock_out" })
      ).rejects.toThrow("You are already clocked out.");

      // Break start after clocked out
      await expect(
        recordPunch({ organizationId, userId, type: "break_start" })
      ).rejects.toThrow("Shift attendance is already completed.");

      // Break end after clocked out
      await expect(
        recordPunch({ organizationId, userId, type: "break_end" })
      ).rejects.toThrow("Shift attendance is already completed.");
    });
  });
});
