import { describe, expect, it } from "vitest";
import {
  calculateAttendance,
  createDateInTimezone,
  localDateInTimezone,
  resolveShiftWindowAndWorkDate,
  shiftWindow,
} from "@/modules/attendance/calculator";

describe("Attendance Shift Timing & Boundary Enforcement", () => {
  const asiaKolkata = "Asia/Kolkata";

  describe("Normal Shift (09:00 - 18:00 Asia/Kolkata)", () => {
    const shift = {
      startTime: "09:00:00",
      endTime: "18:00:00",
      overnight: false,
    };

    it("calculates exact start and end in Asia/Kolkata timezone", () => {
      const window = shiftWindow("2026-10-18", shift.startTime, shift.endTime, shift.overnight, asiaKolkata);
      // 09:00:00 IST = 03:30:00 UTC
      expect(window.start.toISOString()).toBe("2026-10-18T03:30:00.000Z");
      // 18:00:00 IST = 12:30:00 UTC
      expect(window.end.toISOString()).toBe("2026-10-18T12:30:00.000Z");
    });

    it("resolves workDate and shift window when punch is within shift hours", () => {
      // 10:30 IST on 2026-10-18 = 05:00 UTC
      const now = new Date("2026-10-18T05:00:00.000Z");
      const resolved = resolveShiftWindowAndWorkDate({
        now,
        timezone: asiaKolkata,
        shift,
      });

      expect(resolved.workDate).toBe("2026-10-18");
      expect(resolved.isWithinWindow).toBe(true);
      expect(resolved.isBeforeStart).toBe(false);
      expect(resolved.isAfterEnd).toBe(false);
    });

    it("identifies punch before shift start", () => {
      // 08:30 IST on 2026-10-18 = 03:00 UTC
      const now = new Date("2026-10-18T03:00:00.000Z");
      const resolved = resolveShiftWindowAndWorkDate({
        now,
        timezone: asiaKolkata,
        shift,
      });

      expect(resolved.workDate).toBe("2026-10-18");
      expect(resolved.isWithinWindow).toBe(false);
      expect(resolved.isBeforeStart).toBe(true);
      expect(resolved.isAfterEnd).toBe(false);
      expect(resolved.window.start.toISOString()).toBe("2026-10-18T03:30:00.000Z");
    });

    it("identifies punch after shift end", () => {
      // 18:05 IST on 2026-10-18 = 12:35 UTC
      const now = new Date("2026-10-18T12:35:00.000Z");
      const resolved = resolveShiftWindowAndWorkDate({
        now,
        timezone: asiaKolkata,
        shift,
      });

      expect(resolved.workDate).toBe("2026-10-18");
      expect(resolved.isWithinWindow).toBe(false);
      expect(resolved.isBeforeStart).toBe(false);
      expect(resolved.isAfterEnd).toBe(true);
      expect(resolved.window.end.toISOString()).toBe("2026-10-18T12:30:00.000Z");
    });

    it("handles grace period correctly: 10 mins late with 15m grace is counted as present", () => {
      const scheduledStart = createDateInTimezone("2026-10-18", "09:00:00", asiaKolkata);
      const scheduledEnd = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);
      // 09:10 IST punch
      const clockInAt = createDateInTimezone("2026-10-18", "09:10:00", asiaKolkata);
      const clockOutAt = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 15,
        punches: [
          { type: "clock_in", at: clockInAt },
          { type: "clock_out", at: clockOutAt },
        ],
      });

      expect(result.lateMinutes).toBe(0);
      expect(result.status).toBe("present");
    });

    it("verifies exact 09:00:00 punch with 15m grace is recorded on-time (0 late minutes, present)", () => {
      const scheduledStart = createDateInTimezone("2026-10-18", "09:00:00", asiaKolkata);
      const scheduledEnd = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);
      const clockInAt = createDateInTimezone("2026-10-18", "09:00:00", asiaKolkata);
      const clockOutAt = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        punches: [
          { type: "clock_in", at: clockInAt },
          { type: "clock_out", at: clockOutAt },
        ],
      });

      expect(result.lateMinutes).toBe(0);
      expect(result.status).toBe("present");
    });

    it("verifies exact 09:15:00 punch with 15m grace is recorded on-time (inclusive boundary: 0 late minutes, present)", () => {
      const scheduledStart = createDateInTimezone("2026-10-18", "09:00:00", asiaKolkata);
      const scheduledEnd = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);
      const clockInAt = createDateInTimezone("2026-10-18", "09:15:00", asiaKolkata);
      const clockOutAt = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        punches: [
          { type: "clock_in", at: clockInAt },
          { type: "clock_out", at: clockOutAt },
        ],
      });

      expect(result.lateMinutes).toBe(0);
      expect(result.status).toBe("present");
    });

    it("verifies 09:16:00 punch with 15m grace is recorded late (exceeded boundary: 1 late minute, late)", () => {
      const scheduledStart = createDateInTimezone("2026-10-18", "09:00:00", asiaKolkata);
      const scheduledEnd = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);
      const clockInAt = createDateInTimezone("2026-10-18", "09:16:00", asiaKolkata);
      const clockOutAt = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        punches: [
          { type: "clock_in", at: clockInAt },
          { type: "clock_out", at: clockOutAt },
        ],
      });

      expect(result.lateMinutes).toBe(1);
      expect(result.status).toBe("late");
    });

    it("verifies grace period affects late status only and does NOT extend permitted shift punch window", () => {
      // 08:59:59 is strictly before shift start (window start = 09:00:00)
      const beforeStart = new Date("2026-10-18T03:29:59.000Z"); // 08:59:59 IST
      const resolvedBefore = resolveShiftWindowAndWorkDate({ now: beforeStart, timezone: asiaKolkata, shift });
      expect(resolvedBefore.isWithinWindow).toBe(false);
      expect(resolvedBefore.isBeforeStart).toBe(true);

      // 09:00:00 is within shift window
      const atStart = new Date("2026-10-18T03:30:00.000Z"); // 09:00:00 IST
      const resolvedAtStart = resolveShiftWindowAndWorkDate({ now: atStart, timezone: asiaKolkata, shift });
      expect(resolvedAtStart.isWithinWindow).toBe(true);

      // 18:00:00 is within shift window
      const atEnd = new Date("2026-10-18T12:30:00.000Z"); // 18:00:00 IST
      const resolvedAtEnd = resolveShiftWindowAndWorkDate({ now: atEnd, timezone: asiaKolkata, shift });
      expect(resolvedAtEnd.isWithinWindow).toBe(true);

      // 18:00:01 is strictly after shift end
      const afterEnd = new Date("2026-10-18T12:30:01.000Z"); // 18:00:01 IST
      const resolvedAfter = resolveShiftWindowAndWorkDate({ now: afterEnd, timezone: asiaKolkata, shift });
      expect(resolvedAfter.isWithinWindow).toBe(false);
      expect(resolvedAfter.isAfterEnd).toBe(true);
    });

    it("handles grace period exceeded: 20 mins late with 15m grace is marked late with 5 late minutes", () => {
      const scheduledStart = createDateInTimezone("2026-10-18", "09:00:00", asiaKolkata);
      const scheduledEnd = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);
      // 09:20 IST punch
      const clockInAt = createDateInTimezone("2026-10-18", "09:20:00", asiaKolkata);
      const clockOutAt = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 15,
        punches: [
          { type: "clock_in", at: clockInAt },
          { type: "clock_out", at: clockOutAt },
        ],
      });

      expect(result.lateMinutes).toBe(5);
      expect(result.status).toBe("late");
    });
  });

  describe("Overnight Shift (18:00 - 03:00 the following day Asia/Kolkata)", () => {
    const overnightShift = {
      startTime: "18:00:00",
      endTime: "03:00:00",
      overnight: true,
    };

    it("spans across midnight to next calendar date", () => {
      const window = shiftWindow("2026-10-18", overnightShift.startTime, overnightShift.endTime, overnightShift.overnight, asiaKolkata);
      // 18:00 IST on Oct 18 = 12:30 UTC
      expect(window.start.toISOString()).toBe("2026-10-18T12:30:00.000Z");
      // 03:00 IST on Oct 19 = 21:30 UTC Oct 18
      expect(window.end.toISOString()).toBe("2026-10-18T21:30:00.000Z");
    });

    it("correctly attributes early morning punches (01:30 IST) to the previous day workDate", () => {
      // 01:30 IST on Oct 19 = 20:00 UTC Oct 18
      const now = new Date("2026-10-18T20:00:00.000Z");
      expect(localDateInTimezone(asiaKolkata, now)).toBe("2026-10-19");

      const resolved = resolveShiftWindowAndWorkDate({
        now,
        timezone: asiaKolkata,
        shift: overnightShift,
      });

      // Must be attributed to Oct 18 workday!
      expect(resolved.workDate).toBe("2026-10-18");
      expect(resolved.isWithinWindow).toBe(true);
      expect(resolved.window.start.toISOString()).toBe("2026-10-18T12:30:00.000Z");
      expect(resolved.window.end.toISOString()).toBe("2026-10-18T21:30:00.000Z");
    });

    it("correctly attributes evening punches (20:00 IST) on start date to that workDate", () => {
      // 20:00 IST on Oct 18 = 14:30 UTC Oct 18
      const now = new Date("2026-10-18T14:30:00.000Z");
      const resolved = resolveShiftWindowAndWorkDate({
        now,
        timezone: asiaKolkata,
        shift: overnightShift,
      });

      expect(resolved.workDate).toBe("2026-10-18");
      expect(resolved.isWithinWindow).toBe(true);
    });

    it("rejects punch after overnight shift ends (03:15 IST)", () => {
      // 03:15 IST on Oct 19 = 21:45 UTC Oct 18
      const now = new Date("2026-10-18T21:45:00.000Z");
      const resolved = resolveShiftWindowAndWorkDate({
        now,
        timezone: asiaKolkata,
        shift: overnightShift,
      });

      // Still attributes to Oct 18 shift, but punch is strictly after window.end
      expect(resolved.workDate).toBe("2026-10-18");
      expect(resolved.isWithinWindow).toBe(false);
      expect(resolved.isAfterEnd).toBe(true);
    });
  });

  describe("Timezone independence", () => {
    it("parses organization timezone independently of runtime node timezone", () => {
      // New York (EDT = UTC-4 in October)
      const nyTz = "America/New_York";
      const start = createDateInTimezone("2026-10-18", "09:00:00", nyTz);
      // 09:00 EDT = 13:00 UTC
      expect(start.toISOString()).toBe("2026-10-18T13:00:00.000Z");

      // Tokyo (JST = UTC+9)
      const tokyoTz = "Asia/Tokyo";
      const tokyoStart = createDateInTimezone("2026-10-18", "09:00:00", tokyoTz);
      // 09:00 JST = 00:00 UTC
      expect(tokyoStart.toISOString()).toBe("2026-10-18T00:00:00.000Z");
    });
  });

  describe("Active Shift vs Completed Shift Attendance Status Resolution", () => {
    const scheduledStart = createDateInTimezone("2026-10-18", "09:00:00", asiaKolkata);
    const scheduledEnd = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);

    it("evaluates active shift with on-time clock-in (09:10) but no clock-out as 'present'", () => {
      // Evaluated at 11:00 AM (during active shift)
      const clockInAt = createDateInTimezone("2026-10-18", "09:10:00", asiaKolkata);
      const evalTime = createDateInTimezone("2026-10-18", "11:00:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        now: evalTime,
        punches: [{ type: "clock_in", at: clockInAt }],
      });

      expect(result.status).toBe("present");
      expect(result.lateMinutes).toBe(0);
      expect(result.totalWorkMinutes).toBe(0);
      expect(result.netWorkMinutes).toBe(0);
    });

    it("evaluates active shift with late clock-in (09:29) but no clock-out as 'late'", () => {
      // Evaluated at 11:30 AM (during active shift)
      const clockInAt = createDateInTimezone("2026-10-18", "09:29:01", asiaKolkata);
      const evalTime = createDateInTimezone("2026-10-18", "11:30:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        now: evalTime,
        punches: [{ type: "clock_in", at: clockInAt }],
      });

      expect(result.status).toBe("late");
      expect(result.lateMinutes).toBe(14); // 29m - 15m grace = 14m
      expect(result.totalWorkMinutes).toBe(0);
      expect(result.netWorkMinutes).toBe(0);
    });

    it("evaluates completed shift missing clock-out as 'missing_punch'", () => {
      // Evaluated at 19:00 (after 18:00 shift end)
      const clockInAt = createDateInTimezone("2026-10-18", "09:00:00", asiaKolkata);
      const evalTime = createDateInTimezone("2026-10-18", "19:00:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        now: evalTime,
        punches: [{ type: "clock_in", at: clockInAt }],
      });

      expect(result.status).toBe("missing_punch");
    });

    it("evaluates record with no clock-in punch as 'missing_punch'", () => {
      const evalTime = createDateInTimezone("2026-10-18", "11:00:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        now: evalTime,
        punches: [],
      });

      expect(result.status).toBe("missing_punch");
      expect(result.firstIn).toBeNull();
      expect(result.lastOut).toBeNull();
    });

    it("evaluates completed shift with on-time clock-in and clock-out as 'present'", () => {
      const clockInAt = createDateInTimezone("2026-10-18", "09:15:00", asiaKolkata);
      const clockOutAt = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);
      const evalTime = createDateInTimezone("2026-10-18", "18:05:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        now: evalTime,
        punches: [
          { type: "clock_in", at: clockInAt },
          { type: "clock_out", at: clockOutAt },
        ],
      });

      expect(result.status).toBe("present");
      expect(result.lateMinutes).toBe(0);
      expect(result.totalWorkMinutes).toBe(525);
    });

    it("evaluates completed shift with late clock-in and clock-out as 'late'", () => {
      const clockInAt = createDateInTimezone("2026-10-18", "09:29:00", asiaKolkata);
      const clockOutAt = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);
      const evalTime = createDateInTimezone("2026-10-18", "18:05:00", asiaKolkata);

      const result = calculateAttendance({
        scheduledStart,
        scheduledEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        now: evalTime,
        punches: [
          { type: "clock_in", at: clockInAt },
          { type: "clock_out", at: clockOutAt },
        ],
      });

      expect(result.status).toBe("late");
      expect(result.lateMinutes).toBe(14);
      expect(result.totalWorkMinutes).toBe(511);
    });

    it("handles overnight shift: active in early morning is 'present', past shift end is 'missing_punch'", () => {
      // Overnight shift 18:00 Oct 18 - 03:00 Oct 19
      const overStart = createDateInTimezone("2026-10-18", "18:00:00", asiaKolkata);
      const overEnd = createDateInTimezone("2026-10-19", "03:00:00", asiaKolkata);
      const clockInAt = createDateInTimezone("2026-10-18", "18:05:00", asiaKolkata);

      // 1. At 01:00 AM on Oct 19 (shift is active)
      const activeEval = createDateInTimezone("2026-10-19", "01:00:00", asiaKolkata);
      const activeResult = calculateAttendance({
        scheduledStart: overStart,
        scheduledEnd: overEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        now: activeEval,
        punches: [{ type: "clock_in", at: clockInAt }],
      });

      expect(activeResult.status).toBe("present");
      expect(activeResult.lateMinutes).toBe(0);

      // 2. At 04:00 AM on Oct 19 (shift window has ended at 03:00, clock-out missing)
      const endedEval = createDateInTimezone("2026-10-19", "04:00:00", asiaKolkata);
      const endedResult = calculateAttendance({
        scheduledStart: overStart,
        scheduledEnd: overEnd,
        gracePeriodMinutes: 15,
        earlyDepartureThresholdMinutes: 0,
        now: endedEval,
        punches: [{ type: "clock_in", at: clockInAt }],
      });

      expect(endedResult.status).toBe("missing_punch");
    });
  });
});
