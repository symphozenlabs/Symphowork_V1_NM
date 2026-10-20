import { describe, expect, it } from "vitest";
import { calculateAttendance, shiftWindow, calculateBreakSummary } from "$lib/domain/attendance/calculator";

describe("attendance calculation", () => {
  it("handles overnight shifts", () => {
    const window = shiftWindow("2026-09-24", "22:00:00", "06:00:00", true);
    expect(window.end.getUTCDate()).toBe(25);
  });

  it("calculates late, early, break and net work", () => {
    const start = new Date("2026-09-24T09:00:00Z");
    const end = new Date("2026-09-24T18:00:00Z");
    const result = calculateAttendance({
      scheduledStart: start,
      scheduledEnd: end,
      gracePeriodMinutes: 5,
      earlyDepartureThresholdMinutes: 0,
      punches: [
        { type: "clock_in", at: new Date("2026-09-24T09:12:00Z") },
        { type: "break_start", at: new Date("2026-09-24T13:00:00Z") },
        { type: "break_end", at: new Date("2026-09-24T13:30:00Z") },
        { type: "clock_out", at: new Date("2026-09-24T17:30:00Z") }
      ]
    });
    expect(result.lateMinutes).toBe(7);
    expect(result.earlyDepartureMinutes).toBe(30);
    expect(result.breakMinutes).toBe(30);
    expect(result.status).toBe("late_and_early");
  });

  it("calculates break summary when not started", () => {
    const summary = calculateBreakSummary({
      punches: [{ type: "clock_in", at: new Date("2026-09-24T09:00:00Z") }],
      allowedBreakMinutes: 60
    });
    expect(summary.status).toBe("not_started");
    expect(summary.completedMinutes).toBe(0);
    expect(summary.remainingMinutes).toBe(60);
    expect(summary.isExceeded).toBe(false);
  });

  it("calculates active break summary with elapsed seconds", () => {
    const breakStart = new Date("2026-09-24T12:00:00Z");
    const now = new Date("2026-09-24T12:25:30Z");
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-09-24T09:00:00Z") },
        { type: "break_start", at: breakStart }
      ],
      allowedBreakMinutes: 60,
      now
    });
    expect(summary.status).toBe("on_break");
    expect(summary.activeBreakStart).toEqual(breakStart);
    expect(summary.activeElapsedSeconds).toBe(1530);
    expect(summary.activeMinutes).toBe(26);
    expect(summary.remainingMinutes).toBe(34);
    expect(summary.isExceeded).toBe(false);
  });

  it("calculates exceeded break time across completed intervals", () => {
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-09-24T09:00:00Z") },
        { type: "break_start", at: new Date("2026-09-24T12:00:00Z") },
        { type: "break_end", at: new Date("2026-09-24T12:45:00Z") }, // 45m
        { type: "break_start", at: new Date("2026-09-24T15:00:00Z") },
        { type: "break_end", at: new Date("2026-09-24T15:30:00Z") }  // 30m -> total 75m
      ],
      allowedBreakMinutes: 60
    });
    expect(summary.status).toBe("completed");
    expect(summary.completedMinutes).toBe(75);
    expect(summary.totalUsedMinutes).toBe(75);
    expect(summary.isExceeded).toBe(true);
    expect(summary.exceededMinutes).toBe(15);
    expect(summary.remainingMinutes).toBe(0);
    expect(summary.intervals).toHaveLength(2);
  });
});
