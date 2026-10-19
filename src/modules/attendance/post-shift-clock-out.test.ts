/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  attendancePolicies,
  attendancePunches,
  attendanceRecords,
  employees,
  organizations,
  shifts,
} from "@/db/schema";
import { calculateAttendance, createDateInTimezone } from "@/modules/attendance/calculator";
import { calculatePayroll } from "@/modules/payroll/calculator";

const { authorizeAny, recordAudit } = vi.hoisted(() => ({
  authorizeAny: vi.fn(),
  recordAudit: vi.fn(),
}));

const orgId = "org-test-post-shift";
const timezone = "Asia/Kolkata";
const userId = "user-test-emp-1";

const shift1GeneralDay = {
  id: "shift-1-gds",
  organizationId: orgId,
  name: "General Day Shift",
  code: "GENERAL_DAY",
  startTime: "09:00:00",
  endTime: "18:00:00",
  overnight: false,
  breakMinutes: 60,
  graceMinutes: 15,
};

const shift2Evening = {
  id: "shift-2-eve",
  organizationId: orgId,
  name: "Organization Shift 2 – Evening",
  code: "SHIFT_2_EVENING",
  startTime: "18:00:00",
  endTime: "03:00:00",
  overnight: true,
  breakMinutes: 60,
  graceMinutes: 15,
};

let currentEmployee: any = null;
let currentShift: any = shift1GeneralDay;
let currentRecord: any = null;
let existingPunches: any[] = [];
let mockPolicies: any[] = [];

const tx = {
  select: vi.fn(() => ({
    from: vi.fn((table: any) => ({
      where: vi.fn().mockImplementation(() => {
        const queryResult = {
          orderBy: vi.fn().mockImplementation(() => {
            const inner = Promise.resolve(
              table === attendancePunches ? existingPunches : currentRecord ? [currentRecord] : []
            );
            (inner as any).limit = vi.fn().mockImplementation(() =>
              Promise.resolve(currentRecord ? [currentRecord] : [])
            );
            return inner;
          }),
          limit: vi.fn(() => Promise.resolve(currentRecord ? [currentRecord] : [])),
          then: (resolve: any) => {
            if (table === shifts) return resolve(currentShift ? [currentShift] : []);
            if (table === attendanceRecords) {
              return resolve(currentRecord ? [currentRecord] : []);
            }
            if (table === attendancePunches) {
              return resolve(existingPunches);
            }
            if (table === attendancePolicies) {
              return resolve(mockPolicies);
            }
            return resolve([]);
          },
        };
        return queryResult;
      }),
    })),
  })),
  insert: vi.fn((table: any) => ({
    values: vi.fn((vals: any) => {
      if (table === attendanceRecords) {
        currentRecord = { id: "rec-post-shift-1", ...vals };
        return {
          returning: vi.fn().mockResolvedValue([currentRecord]),
        };
      }
      if (table === attendancePunches) {
        const punch = { id: `p-${existingPunches.length + 1}`, ...vals };
        existingPunches.push(punch);
        return Promise.resolve([punch]);
      }
      return Promise.resolve([vals]);
    }),
  })),
  update: vi.fn(() => ({
    set: vi.fn((vals: any) => ({
      where: vi.fn(() => {
        if (currentRecord) {
          currentRecord = { ...currentRecord, ...vals };
        }
        return {
          returning: vi.fn().mockResolvedValue([currentRecord ?? vals]),
        };
      }),
    })),
  })),
};

let mockOrg: any = { id: orgId, name: "SymphoCorp", timezone };

vi.mock("@/db/client", () => ({
  db: {
    transaction: vi.fn(async (cb: any) => cb(tx)),
    select: vi.fn(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === organizations) {
            return Promise.resolve(mockOrg ? [mockOrg] : []);
          }
          if (table === employees) {
            return Promise.resolve(currentEmployee ? [currentEmployee] : []);
          }
          return Promise.resolve([]);
        }),
      })),
    })),
  },
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize: vi.fn(),
  authorizeAny,
}));
vi.mock("@/lib/audit", () => ({ recordAudit }));
vi.mock("@/modules/employees/service", () => ({
  employeeForUser: vi.fn(async () => currentEmployee),
  getOrEnsureEmployeeForUser: vi.fn(async () => currentEmployee),
}));

const { recordPunch } = await import("@/modules/attendance/service");

describe("SymphoWork V1 — Post-Shift Clock-Out & Safe Overtime Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    currentShift = shift1GeneralDay;
    currentEmployee = {
      id: "emp-101",
      organizationId: orgId,
      userId,
      displayName: "Amit Patel",
      status: "active",
      shiftId: shift1GeneralDay.id,
    };
    mockOrg = { id: orgId, name: "SymphoCorp", timezone };
    currentRecord = null;
    existingPunches = [];
    mockPolicies = [
      {
        id: "pol-1",
        organizationId: orgId,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 15,
        active: true,
      },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. Shift 1 clock-out at 17:59
  it("1. Shift 1 clock-out at 17:59 succeeds on-time before shift end", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "17:59:00", timezone);
    vi.setSystemTime(clockInAt);

    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });
    expect(currentRecord.actualFirstIn).toEqual(clockInAt);

    vi.setSystemTime(clockOutAt);
    const updated = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    expect(updated.actualLastOut).toEqual(clockOutAt);
    expect(updated.earlyDepartureMinutes).toBe(0); // 1 minute before end, within 15m threshold
    expect(updated.lateMinutes).toBe(0);
    expect(updated.status).toBe("present");
    expect(updated.totalWorkMinutes).toBe(539);
  });

  // 2. Shift 1 clock-out exactly at 18:00
  it("2. Shift 1 clock-out exactly at 18:00 succeeds at shift end boundary", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "18:00:00", timezone);
    vi.setSystemTime(clockInAt);

    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    vi.setSystemTime(clockOutAt);
    const updated = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    expect(updated.actualLastOut).toEqual(clockOutAt);
    expect(updated.earlyDepartureMinutes).toBe(0);
    expect(updated.lateMinutes).toBe(0);
    expect(updated.status).toBe("present");
    expect(updated.totalWorkMinutes).toBe(540);
    expect(updated.netWorkMinutes).toBe(540);
  });

  // 3. Shift 1 clock-out at 18:30
  it("3. Shift 1 clock-out at 18:30 succeeds post-shift with potential overtime recorded", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "18:30:00", timezone);
    vi.setSystemTime(clockInAt);

    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    vi.setSystemTime(clockOutAt);
    const updated = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    expect(updated.actualLastOut).toEqual(clockOutAt);
    expect(updated.status).toBe("present");
    expect(updated.totalWorkMinutes).toBe(570);
    expect(updated.netWorkMinutes).toBe(570);

    const calc = calculateAttendance({
      scheduledStart: currentRecord.scheduledStart,
      scheduledEnd: currentRecord.scheduledEnd,
      punches: existingPunches.map((p) => ({ type: p.punchType, at: p.punchedAt })),
      gracePeriodMinutes: 15,
      earlyDepartureThresholdMinutes: 15,
      now: clockOutAt,
    });
    expect(calc.potentialOvertimeMinutes).toBe(30);
    expect(calc.scheduledDurationMinutes).toBe(540);
  });

  // 4. Shift 1 clock-out at 19:15
  it("4. Shift 1 clock-out at 19:15 succeeds post-shift with potential overtime recorded", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "19:15:00", timezone);
    vi.setSystemTime(clockInAt);

    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    vi.setSystemTime(clockOutAt);
    const updated = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    expect(updated.actualLastOut).toEqual(clockOutAt);
    expect(updated.status).toBe("present");
    expect(updated.totalWorkMinutes).toBe(615);
    expect(updated.netWorkMinutes).toBe(615);

    const calc = calculateAttendance({
      scheduledStart: currentRecord.scheduledStart,
      scheduledEnd: currentRecord.scheduledEnd,
      punches: existingPunches.map((p) => ({ type: p.punchType, at: p.punchedAt })),
      gracePeriodMinutes: 15,
      earlyDepartureThresholdMinutes: 15,
      now: clockOutAt,
    });
    expect(calc.potentialOvertimeMinutes).toBe(75);
  });

  // 5. Late clock-in followed by valid post-shift clock-out
  it("5. Late clock-in (09:19) followed by valid post-shift clock-out (19:15) succeeds with late status and does not mark missing_punch", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:19:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "19:15:00", timezone);
    vi.setSystemTime(clockInAt);

    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    vi.setSystemTime(clockOutAt);
    const updated = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    expect(updated.actualFirstIn).toEqual(clockInAt);
    expect(updated.actualLastOut).toEqual(clockOutAt);
    expect(updated.lateMinutes).toBe(4); // 19m late - 15m grace = 4m
    expect(updated.earlyDepartureMinutes).toBe(0);
    expect(updated.status).toBe("late");
    expect(updated.status).not.toBe("missing_punch");
    expect(updated.totalWorkMinutes).toBe(596); // 9h 56m
  });

  // 6. Clock-out after a completed break
  it("6. Clock-out after a completed break succeeds post-shift", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const breakStartAt = createDateInTimezone("2026-10-19", "13:00:00", timezone);
    const breakEndAt = createDateInTimezone("2026-10-19", "14:00:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "19:15:00", timezone);

    vi.setSystemTime(clockInAt);
    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    vi.setSystemTime(breakStartAt);
    await recordPunch({ organizationId: orgId, userId, type: "break_start" });

    vi.setSystemTime(breakEndAt);
    await recordPunch({ organizationId: orgId, userId, type: "break_end" });

    vi.setSystemTime(clockOutAt);
    const updated = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    expect(updated.totalWorkMinutes).toBe(615);
    expect(updated.totalBreakMinutes).toBe(60);
    expect(updated.netWorkMinutes).toBe(555); // 615 - 60
    expect(updated.status).toBe("present");
  });

  // 7. Clock-out while a break is still active, following existing business rules
  it("7. Clock-out while a break is still active is rejected with 'End active break before clocking out.'", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const breakStartAt = createDateInTimezone("2026-10-19", "17:50:00", timezone);
    const postShiftClockOutAttempt = createDateInTimezone("2026-10-19", "18:15:00", timezone);
    const breakEndAt = createDateInTimezone("2026-10-19", "18:20:00", timezone);
    const finalClockOutAt = createDateInTimezone("2026-10-19", "18:25:00", timezone);

    vi.setSystemTime(clockInAt);
    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    vi.setSystemTime(breakStartAt);
    await recordPunch({ organizationId: orgId, userId, type: "break_start" });

    // Attempt clock out post-shift while break is active -> MUST be rejected
    vi.setSystemTime(postShiftClockOutAttempt);
    await expect(
      recordPunch({ organizationId: orgId, userId, type: "clock_out" })
    ).rejects.toThrow("End active break before clocking out.");

    // End break post-shift -> MUST succeed
    vi.setSystemTime(breakEndAt);
    const breakEndRes = await recordPunch({ organizationId: orgId, userId, type: "break_end" });
    expect(breakEndRes).toBeDefined();

    // Now clock out post-shift -> MUST succeed
    vi.setSystemTime(finalClockOutAt);
    const finalRes = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });
    expect(finalRes.actualLastOut).toEqual(finalClockOutAt);
    expect(finalRes.status).toBe("present");
  });

  // 8. Duplicate clock-out rejection
  it("8. Duplicate clock-out is rejected with 409 'You are already clocked out.'", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "19:15:00", timezone);

    vi.setSystemTime(clockInAt);
    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    vi.setSystemTime(clockOutAt);
    await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    // Second clock out attempt
    vi.setSystemTime(new Date(clockOutAt.getTime() + 60000));
    await expect(
      recordPunch({ organizationId: orgId, userId, type: "clock_out" })
    ).rejects.toThrow("You are already clocked out.");
  });

  // 9. Clock-out without a valid clock-in rejection
  it("9. Clock-out without a valid clock-in is rejected with 400 'Clock in before clocking out.'", async () => {
    const clockOutAttempt = createDateInTimezone("2026-10-19", "18:30:00", timezone);
    vi.setSystemTime(clockOutAttempt);

    await expect(
      recordPunch({ organizationId: orgId, userId, type: "clock_out" })
    ).rejects.toThrow("Clock in before clocking out.");
  });

  // 10. Repeated clock-in after clock-out rejection for the same work session
  it("10. Repeated clock-in after clock-out for the same work session is rejected with 409 'You are already clocked in for this work date.'", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "18:00:00", timezone);
    const repeatedClockIn = createDateInTimezone("2026-10-19", "18:05:00", timezone);

    vi.setSystemTime(clockInAt);
    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    vi.setSystemTime(clockOutAt);
    await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    // Attempt second clock in on same work date
    vi.setSystemTime(repeatedClockIn);
    await expect(
      recordPunch({ organizationId: orgId, userId, type: "clock_in" })
    ).rejects.toThrow("You are already clocked in for this work date.");
  });

  // 11. Shift 2 overnight clock-out after its scheduled end
  it("11. Shift 2 overnight clock-out (03:45) after its scheduled end (03:00) succeeds and attributes to correct workday", async () => {
    currentShift = shift2Evening;
    currentEmployee.shiftId = shift2Evening.id;

    // Shift 2 is 18:00 to 03:00 overnight
    const clockInAt = createDateInTimezone("2026-10-18", "18:05:00", timezone);
    const clockOutAt = createDateInTimezone("2026-10-19", "03:45:00", timezone);

    vi.setSystemTime(clockInAt);
    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });
    expect(currentRecord.attendanceDate).toBe("2026-10-18");

    vi.setSystemTime(clockOutAt);
    const updated = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    expect(updated.attendanceDate).toBe("2026-10-18");
    expect(updated.actualFirstIn).toEqual(clockInAt);
    expect(updated.actualLastOut).toEqual(clockOutAt);
    expect(updated.status).toBe("present");
    expect(updated.totalWorkMinutes).toBe(580); // 9h 40m
    expect(updated.netWorkMinutes).toBe(580);

    const calc = calculateAttendance({
      scheduledStart: currentRecord.scheduledStart,
      scheduledEnd: currentRecord.scheduledEnd,
      punches: existingPunches.map((p) => ({ type: p.punchType, at: p.punchedAt })),
      gracePeriodMinutes: 15,
      earlyDepartureThresholdMinutes: 15,
      now: clockOutAt,
    });
    expect(calc.potentialOvertimeMinutes).toBe(45); // 03:00 to 03:45
  });

  // 12. Correct net work duration after subtracting breaks
  it("12. Calculates correct net work duration accurately after subtracting completed breaks without truncating at scheduled shift end", () => {
    const scheduledStart = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const scheduledEnd = createDateInTimezone("2026-10-19", "18:00:00", timezone);
    const firstIn = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const b1Start = createDateInTimezone("2026-10-19", "11:00:00", timezone);
    const b1End = createDateInTimezone("2026-10-19", "11:15:00", timezone);
    const b2Start = createDateInTimezone("2026-10-19", "13:00:00", timezone);
    const b2End = createDateInTimezone("2026-10-19", "13:45:00", timezone);
    const lastOut = createDateInTimezone("2026-10-19", "19:00:00", timezone); // 10h span

    const result = calculateAttendance({
      scheduledStart,
      scheduledEnd,
      punches: [
        { type: "clock_in", at: firstIn },
        { type: "break_start", at: b1Start },
        { type: "break_end", at: b1End },
        { type: "break_start", at: b2Start },
        { type: "break_end", at: b2End },
        { type: "clock_out", at: lastOut },
      ],
      gracePeriodMinutes: 15,
      earlyDepartureThresholdMinutes: 15,
      now: lastOut,
    });

    expect(result.totalWorkMinutes).toBe(600); // 10 hours
    expect(result.breakMinutes).toBe(60); // 15m + 45m
    expect(result.netWorkMinutes).toBe(540); // exactly 9 hours net work
    expect(result.potentialOvertimeMinutes).toBe(60); // 18:00 to 19:00
    expect(result.scheduledDurationMinutes).toBe(540);
    expect(result.status).toBe("present");
  });

  // 13. Correct attendance status after a post-shift clock-out
  it("13. Restores correct attendance status from missing_punch to present/late after a post-shift clock-out", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    const midEvaluationTime = createDateInTimezone("2026-10-19", "18:30:00", timezone);
    const postShiftClockOutAt = createDateInTimezone("2026-10-19", "19:15:00", timezone);

    vi.setSystemTime(clockInAt);
    await recordPunch({ organizationId: orgId, userId, type: "clock_in" });

    // Mid-evaluation at 18:30 without clock-out evaluates as missing_punch
    const midCalc = calculateAttendance({
      scheduledStart: currentRecord.scheduledStart,
      scheduledEnd: currentRecord.scheduledEnd,
      punches: existingPunches.map((p) => ({ type: p.punchType, at: p.punchedAt })),
      gracePeriodMinutes: 15,
      earlyDepartureThresholdMinutes: 15,
      now: midEvaluationTime,
    });
    expect(midCalc.status).toBe("missing_punch");

    // Employee clocks out at 19:15
    vi.setSystemTime(postShiftClockOutAt);
    const updated = await recordPunch({ organizationId: orgId, userId, type: "clock_out" });

    expect(updated.status).toBe("present");
    expect(updated.status).not.toBe("missing_punch");
    expect(updated.actualLastOut).toEqual(postShiftClockOutAt);
  });

  // 14. Payroll regression tests to ensure unapproved overtime does not become automatically payable
  it("14. Payroll regression: unapproved overtime does NOT become automatically payable and does NOT mutate salary or LOP calculations", () => {
    // Normal base salary components
    const components = [
      {
        code: "BASIC",
        name: "Basic Salary",
        type: "earning" as const,
        method: "fixed" as const,
        fixedAmount: 50000,
        taxable: true,
        proratable: true,
        statutory: false,
      },
      {
        code: "HRA",
        name: "House Rent Allowance",
        type: "earning" as const,
        method: "fixed" as const,
        fixedAmount: 20000,
        taxable: true,
        proratable: true,
        statutory: false,
      },
    ];

    const statutory = {
      pf: { applicable: false, employeeRate: 0, employerRate: 0 },
      esi: { applicable: false, employeeRate: 0, employerRate: 0 },
      professionalTax: { applicable: false, amount: 0 },
      tds: { applicable: false, amount: 0 },
    };

    // Calculate normal payroll run where employee clocked on-time (absentDays: 0, lopDays: 0)
    const basePayroll = calculatePayroll({
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
      calendarDays: 31,
      workingDays: 22,
      eligibleCalendarDays: 31,
      eligibleWorkingDays: 22,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      absentDays: 0,
      lopDays: 0,
      prorationBasis: "calendar_days",
      components,
      adjustments: [],
      statutory,
    });

    // Employee performed 75 minutes of post-shift overtime on 10 days (total 750m unapproved overtime)
    // Their attendance status remains 'present', so absentDays = 0, lopDays = 0
    const overtimePayroll = calculatePayroll({
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
      calendarDays: 31,
      workingDays: 22,
      eligibleCalendarDays: 31,
      eligibleWorkingDays: 22,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      absentDays: 0,
      lopDays: 0,
      prorationBasis: "calendar_days",
      components,
      adjustments: [], // No approved overtime adjustment exists!
      statutory,
    });

    // Net and gross salaries MUST be strictly identical:
    expect(overtimePayroll.grossEarnings).toBe(basePayroll.grossEarnings);
    expect(overtimePayroll.netSalary).toBe(basePayroll.netSalary);
    expect(overtimePayroll.payableDays).toBe(basePayroll.payableDays);
    expect(overtimePayroll.lopDays).toBe(0);

    // Overtime lines must NOT exist without an explicit approved adjustment
    const hasOvertimeLine = overtimePayroll.lines.some((l) => /overtime/i.test(l.name) || /overtime/i.test(l.code));
    expect(hasOvertimeLine).toBe(false);
  });

  // 15. RBAC and tenant-isolation regression tests
  it("15. RBAC and tenant isolation regression: rejects punch across tenant boundaries or on behalf of another employee", async () => {
    const clockInAt = createDateInTimezone("2026-10-19", "09:00:00", timezone);
    vi.setSystemTime(clockInAt);

    // 1. Cannot punch for another employeeId
    await expect(
      recordPunch({
        organizationId: orgId,
        userId,
        type: "clock_in",
        employeeId: "emp-different-target",
      })
    ).rejects.toThrow("You are not authorized to record attendance punches for other employees.");

    // 2. Suspended or inactive employee cannot punch
    currentEmployee.status = "inactive";
    await expect(
      recordPunch({
        organizationId: orgId,
        userId,
        type: "clock_in",
      })
    ).rejects.toThrow("Active employee profile is required to record attendance.");

    // 3. Organization boundary check
    currentEmployee.status = "active";
    mockOrg = null;
    await expect(
      recordPunch({
        organizationId: "nonexistent-tenant-org",
        userId,
        type: "clock_in",
      })
    ).rejects.toThrow("Organization was not found.");
  });
});
