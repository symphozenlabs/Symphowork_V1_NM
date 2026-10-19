/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkAndEnsureAttendanceReminder } from "@/modules/attendance/reminder";
import {
  attendanceRecords,
  holidays,
  leaveApplications,
  memberships,
  organizations,
  shifts,
  workingDays,
} from "@/db/schema";

const mockCreateNotification = vi.fn();
vi.mock("@/modules/notifications/service", () => ({
  createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

let mockEmployee: any = {
  id: "emp-kavita",
  organizationId: "org-1",
  userId: "user-kavita",
  shiftId: "shift-general",
  status: "active",
};

vi.mock("@/modules/employees/service", () => ({
  getOrEnsureEmployeeForUser: vi.fn(async () => mockEmployee),
}));

const mockOrg = {
  id: "org-1",
  name: "Acme Corp",
  timezone: "Asia/Kolkata",
};

const mockShift = {
  id: "shift-general",
  organizationId: "org-1",
  name: "General Day Shift",
  code: "GEN_DAY",
  startTime: "09:00:00",
  endTime: "18:00:00",
  overnight: false,
  status: "active",
};

let mockMembershipRole = "HR_EXECUTIVE";
let mockHoliday: any = null;
let mockWorkingDay: any = { isWorkingDay: true };
let mockApprovedLeave: any = null;
let mockAttendanceRecord: any = null;

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: any) => {
        const chain = {
          innerJoin: vi.fn(() => chain),
          where: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          then: (resolve: any) => {
            if (table === organizations) return resolve([mockOrg]);
            if (table === memberships) return resolve([{ roleKey: mockMembershipRole }]);
            if (table === shifts) return resolve([mockShift]);
            if (table === holidays) return resolve(mockHoliday ? [mockHoliday] : []);
            if (table === workingDays) return resolve(mockWorkingDay ? [mockWorkingDay] : []);
            if (table === leaveApplications) return resolve(mockApprovedLeave ? [mockApprovedLeave] : []);
            if (table === attendanceRecords) return resolve(mockAttendanceRecord ? [mockAttendanceRecord] : []);
            return resolve([]);
          },
        };
        return chain;
      }),
    })),
  },
}));

describe("Daily Attendance Reminder Service", () => {
  const fixedDayTime = new Date("2026-10-18T05:30:00.000Z"); // 11:00 AM IST

  beforeEach(() => {
    vi.clearAllMocks();
    mockMembershipRole = "HR_EXECUTIVE";
    mockEmployee = {
      id: "emp-kavita",
      organizationId: "org-1",
      userId: "user-kavita",
      shiftId: "shift-general",
      status: "active",
    };
    mockHoliday = null;
    mockWorkingDay = { isWorkingDay: true };
    mockApprovedLeave = null;
    mockAttendanceRecord = null;
  });

  it("creates a reminder notification for eligible employee with incomplete attendance on a regular workday", async () => {
    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: fixedDayTime,
    });

    expect(result.eligible).toBe(true);
    expect(result.required).toBe(true);
    expect(result.completed).toBe(false);
    expect(result.workDate).toBe("2026-10-18");
    expect(result.shift?.name).toBe("General Day Shift");

    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        recipientUserId: "user-kavita",
        category: "attendance",
        type: "attendance.daily_reminder",
        idempotencyKey: "attendance:daily_reminder:emp-kavita:2026-10-18",
        actionUrl: "/app/attendance",
      })
    );
  });

  it("does not create a notification if employee has already clocked in for the workday", async () => {
    mockAttendanceRecord = {
      id: "rec-1",
      attendanceDate: "2026-10-18",
      actualFirstIn: new Date("2026-10-18T03:35:00.000Z"), // 09:05 AM IST
    };

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: fixedDayTime,
    });

    expect(result.eligible).toBe(true);
    expect(result.completed).toBe(true);
    expect(result.workDate).toBe("2026-10-18");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("exempts Organization Owner from mandatory attendance reminders", async () => {
    mockMembershipRole = "ORGANIZATION_OWNER";

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-owner",
      checkTime: fixedDayTime,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("organization_owner_exempt");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("exempts users who have no assigned shift", async () => {
    mockEmployee.shiftId = null;

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: fixedDayTime,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("no_shift_assigned");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("exempts users on company or public holidays", async () => {
    mockHoliday = {
      id: "hol-1",
      name: "Diwali Festival",
      holidayDate: "2026-10-18",
      status: "active",
    };

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: fixedDayTime,
    });

    expect(result.eligible).toBe(false);
    expect(result.exempt).toBe(true);
    expect(result.reason).toBe("holiday");
    expect(result.holidayName).toBe("Diwali Festival");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("exempts users on scheduled weekly off days", async () => {
    mockWorkingDay = { isWorkingDay: false };

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: fixedDayTime,
    });

    expect(result.eligible).toBe(false);
    expect(result.exempt).toBe(true);
    expect(result.reason).toBe("weekly_off");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("exempts users on approved leave for that workday", async () => {
    mockApprovedLeave = {
      id: "leave-app-1",
      employeeId: "emp-kavita",
      status: "approved",
      startDate: "2026-10-17",
      endDate: "2026-10-19",
    };

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: fixedDayTime,
    });

    expect(result.eligible).toBe(false);
    expect(result.exempt).toBe(true);
    expect(result.reason).toBe("approved_leave");
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("correctly attributes Shift 2 overnight shift to previous calendar day when checking after midnight during active overnight shift", async () => {
    // Overnight Shift 2: 18:00 to 03:00 IST
    const mockOvernightShift = {
      id: "shift-overnight",
      organizationId: "org-1",
      name: "Shift 2 – Evening",
      code: "SHIFT_2_EVENING",
      startTime: "18:00:00",
      endTime: "03:00:00",
      overnight: true,
      status: "active",
    };

    // Override shift returned by DB
    const dbMock = (await import("@/db/client")).db;
    const originalSelect = dbMock.select;
    dbMock.select = vi.fn(() => ({
      from: vi.fn((table: any) => {
        const chain = {
          innerJoin: vi.fn(() => chain),
          where: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          then: (resolve: any) => {
            if (table === organizations) return resolve([mockOrg]);
            if (table === memberships) return resolve([{ roleKey: mockMembershipRole }]);
            if (table === shifts) return resolve([mockOvernightShift]);
            if (table === holidays) return resolve([]);
            if (table === workingDays) return resolve([{ isWorkingDay: true }]);
            if (table === leaveApplications) return resolve([]);
            if (table === attendanceRecords) return resolve([]);
            return resolve([]);
          },
        };
        return chain;
      }),
    })) as any;

    // Check at 01:30 AM IST on Oct 19 (which is Oct 18 20:00 UTC)
    const afterMidnightTime = new Date("2026-10-18T20:00:00.000Z"); // 01:30 AM IST on Oct 19

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: afterMidnightTime,
    });

    expect(result.eligible).toBe(true);
    expect(result.required).toBe(true);
    expect(result.completed).toBe(false);
    // Workdate must be attributed to the start of the shift: 2026-10-18
    expect(result.workDate).toBe("2026-10-18");
    expect(result.shift?.overnight).toBe(true);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "attendance:daily_reminder:emp-kavita:2026-10-18",
      })
    );

    dbMock.select = originalSelect;
  });

  it("ensures idempotency when reminder is checked repeatedly within the same workday", async () => {
    // First check
    const res1 = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: fixedDayTime,
    });
    expect(res1.workDate).toBe("2026-10-18");
    expect(mockCreateNotification).toHaveBeenCalledTimes(1);

    // Second check on the same day must use identical idempotencyKey
    const res2 = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: new Date("2026-10-18T08:00:00.000Z"), // 1:30 PM IST same day
    });
    expect(res2.workDate).toBe("2026-10-18");
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    expect(mockCreateNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({
        idempotencyKey: "attendance:daily_reminder:emp-kavita:2026-10-18",
      })
    );
  });

  it("generates a distinct reminder for the subsequent workday when workDate advances", async () => {
    const nextDayTime = new Date("2026-10-19T05:30:00.000Z"); // 11:00 AM IST on Oct 19

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: "org-1",
      userId: "user-kavita",
      checkTime: nextDayTime,
    });

    expect(result.workDate).toBe("2026-10-19");
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "attendance:daily_reminder:emp-kavita:2026-10-19",
      })
    );
  });
});
