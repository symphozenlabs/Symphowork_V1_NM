import { describe, expect, it } from "vitest";
import { calculateBreakSummary } from "@/modules/attendance/calculator";

describe("Break Summary Calculation & Edge Cases", () => {
  it("1. No breaks taken: full allowance remains and status is not_started", () => {
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
      ],
      allowedBreakMinutes: 60,
      now: new Date("2026-10-19T11:00:00Z"),
    });

    expect(summary.allowedMinutes).toBe(60);
    expect(summary.completedMinutes).toBe(0);
    expect(summary.activeMinutes).toBe(0);
    expect(summary.activeElapsedSeconds).toBe(0);
    expect(summary.totalUsedMinutes).toBe(0);
    expect(summary.remainingMinutes).toBe(60);
    expect(summary.isExceeded).toBe(false);
    expect(summary.exceededMinutes).toBe(0);
    expect(summary.status).toBe("not_started");
    expect(summary.activeBreakStart).toBeNull();
    expect(summary.intervals).toHaveLength(0);
  });

  it("2. One completed break: used and remaining time are correct", () => {
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
        { type: "break_start", at: new Date("2026-10-19T13:00:00Z") },
        { type: "break_end", at: new Date("2026-10-19T13:20:00Z") },
      ],
      allowedBreakMinutes: 60,
      now: new Date("2026-10-19T14:00:00Z"),
    });

    expect(summary.allowedMinutes).toBe(60);
    expect(summary.completedMinutes).toBe(20);
    expect(summary.activeMinutes).toBe(0);
    expect(summary.totalUsedMinutes).toBe(20);
    expect(summary.remainingMinutes).toBe(40);
    expect(summary.isExceeded).toBe(false);
    expect(summary.exceededMinutes).toBe(0);
    expect(summary.status).toBe("completed");
    expect(summary.intervals).toHaveLength(1);
    expect(summary.intervals[0].durationMinutes).toBe(20);
  });

  it("3. Multiple breaks: durations are summed accurately", () => {
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
        // Break 1: 15 min
        { type: "break_start", at: new Date("2026-10-19T10:30:00Z") },
        { type: "break_end", at: new Date("2026-10-19T10:45:00Z") },
        // Break 2: 30 min
        { type: "break_start", at: new Date("2026-10-19T13:00:00Z") },
        { type: "break_end", at: new Date("2026-10-19T13:30:00Z") },
      ],
      allowedBreakMinutes: 60,
      now: new Date("2026-10-19T15:00:00Z"),
    });

    expect(summary.completedMinutes).toBe(45);
    expect(summary.totalUsedMinutes).toBe(45);
    expect(summary.remainingMinutes).toBe(15);
    expect(summary.status).toBe("completed");
    expect(summary.isExceeded).toBe(false);
    expect(summary.intervals).toHaveLength(2);
    expect(summary.intervals[0].durationMinutes).toBe(15);
    expect(summary.intervals[1].durationMinutes).toBe(30);
  });

  it("4. Active break: elapsed duration and remaining time update dynamically", () => {
    const breakStartTime = new Date("2026-10-19T14:00:00Z");
    const punches = [
      { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
      { type: "break_start", at: new Date("2026-10-19T11:00:00Z") },
      { type: "break_end", at: new Date("2026-10-19T11:15:00Z") }, // 15 min completed
      { type: "break_start", at: breakStartTime }, // Active break
    ];

    // At 14:07:00 (7 min elapsed on active break)
    const summary1 = calculateBreakSummary({
      punches,
      allowedBreakMinutes: 60,
      now: new Date("2026-10-19T14:07:00Z"),
    });

    expect(summary1.status).toBe("on_break");
    expect(summary1.completedMinutes).toBe(15);
    expect(summary1.activeMinutes).toBe(7);
    expect(summary1.activeElapsedSeconds).toBe(420);
    expect(summary1.totalUsedMinutes).toBe(22);
    expect(summary1.remainingMinutes).toBe(38);
    expect(summary1.activeBreakStart?.toISOString()).toBe(breakStartTime.toISOString());

    // At 14:20:00 (20 min elapsed on active break)
    const summary2 = calculateBreakSummary({
      punches,
      allowedBreakMinutes: 60,
      now: new Date("2026-10-19T14:20:00Z"),
    });

    expect(summary2.status).toBe("on_break");
    expect(summary2.completedMinutes).toBe(15);
    expect(summary2.activeMinutes).toBe(20);
    expect(summary2.activeElapsedSeconds).toBe(1200);
    expect(summary2.totalUsedMinutes).toBe(35);
    expect(summary2.remainingMinutes).toBe(25);
  });

  it("5. Refresh/reload: summary reconstructs correctly from persisted DB punches", () => {
    // Simulating database row format returned from GET /api/app/attendance (string timestamps, punchType)
    const persistedDbPunches = [
      {
        id: "p-1",
        punchType: "clock_in",
        punchedAt: "2026-10-19T09:00:00.000Z",
      },
      {
        id: "p-2",
        punchType: "break_start",
        punchedAt: "2026-10-19T12:00:00.000Z",
      },
      {
        id: "p-3",
        punchType: "break_end",
        punchedAt: "2026-10-19T12:25:00.000Z",
      },
    ];

    const reconstructed = calculateBreakSummary({
      punches: persistedDbPunches,
      allowedBreakMinutes: 60,
      now: new Date("2026-10-19T13:00:00.000Z"),
    });

    expect(reconstructed.allowedMinutes).toBe(60);
    expect(reconstructed.completedMinutes).toBe(25);
    expect(reconstructed.totalUsedMinutes).toBe(25);
    expect(reconstructed.remainingMinutes).toBe(35);
    expect(reconstructed.status).toBe("completed");
    expect(reconstructed.intervals).toHaveLength(1);
    expect(reconstructed.intervals[0].durationMinutes).toBe(25);
  });

  it("6. Break allowance exceeded: remaining time stays at zero without negative values", () => {
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
        // 45 min
        { type: "break_start", at: new Date("2026-10-19T11:00:00Z") },
        { type: "break_end", at: new Date("2026-10-19T11:45:00Z") },
        // 35 min
        { type: "break_start", at: new Date("2026-10-19T14:00:00Z") },
        { type: "break_end", at: new Date("2026-10-19T14:35:00Z") },
      ],
      allowedBreakMinutes: 60, // Total used: 80 min
      now: new Date("2026-10-19T15:00:00Z"),
    });

    expect(summary.totalUsedMinutes).toBe(80);
    expect(summary.remainingMinutes).toBe(0); // Clamped at 0
    expect(summary.isExceeded).toBe(true);
    expect(summary.exceededMinutes).toBe(20);
    expect(summary.status).toBe("completed");
  });

  it("7. Clock-out completed: summary remains fully visible with final day break usage", () => {
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
        { type: "break_start", at: new Date("2026-10-19T13:00:00Z") },
        { type: "break_end", at: new Date("2026-10-19T13:45:00Z") },
        { type: "clock_out", at: new Date("2026-10-19T18:00:00Z") },
      ],
      allowedBreakMinutes: 60,
      now: new Date("2026-10-19T18:05:00Z"),
    });

    expect(summary.completedMinutes).toBe(45);
    expect(summary.totalUsedMinutes).toBe(45);
    expect(summary.remainingMinutes).toBe(15);
    expect(summary.status).toBe("completed");
    expect(summary.intervals).toHaveLength(1);
    expect(summary.intervals[0].durationMinutes).toBe(45);
  });

  it("8. Overnight shift and midnight boundaries", () => {
    // Shift runs 22:00 to 06:00. Break starts 23:45 and ends 00:25 next day
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T22:00:00Z") },
        { type: "break_start", at: new Date("2026-10-19T23:45:00Z") },
        { type: "break_end", at: new Date("2026-10-20T00:25:00Z") }, // 40 min across midnight
      ],
      allowedBreakMinutes: 60,
      now: new Date("2026-10-20T01:00:00Z"),
    });

    expect(summary.completedMinutes).toBe(40);
    expect(summary.totalUsedMinutes).toBe(40);
    expect(summary.remainingMinutes).toBe(20);
    expect(summary.status).toBe("completed");
    expect(summary.intervals).toHaveLength(1);
    expect(summary.intervals[0].durationMinutes).toBe(40);
  });

  it("9. Handles missing or invalid punch pairs gracefully without double counting", () => {
    const summary = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
        // Orphaned break_end without start (should be safely ignored)
        { type: "break_end", at: new Date("2026-10-19T09:30:00Z") },
        // Valid break
        { type: "break_start", at: new Date("2026-10-19T10:00:00Z") },
        // Duplicate break_start while already active (should not duplicate)
        { type: "break_start", at: new Date("2026-10-19T10:10:00Z") },
        { type: "break_end", at: new Date("2026-10-19T10:20:00Z") },
      ],
      allowedBreakMinutes: 60,
      now: new Date("2026-10-19T11:00:00Z"),
    });

    // Only 1 interval from 10:00 to 10:20 = 20 min
    expect(summary.completedMinutes).toBe(20);
    expect(summary.totalUsedMinutes).toBe(20);
    expect(summary.remainingMinutes).toBe(40);
    expect(summary.intervals).toHaveLength(1);
    expect(summary.intervals[0].durationMinutes).toBe(20);
  });

  it("10. Uses dynamic shift configuration instead of hardcoded 60 minutes", () => {
    // Shift with 45-minute break allowance
    const summary45 = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
        { type: "break_start", at: new Date("2026-10-19T12:00:00Z") },
        { type: "break_end", at: new Date("2026-10-19T12:30:00Z") },
      ],
      allowedBreakMinutes: 45,
      now: new Date("2026-10-19T13:00:00Z"),
    });

    expect(summary45.allowedMinutes).toBe(45);
    expect(summary45.completedMinutes).toBe(30);
    expect(summary45.remainingMinutes).toBe(15);

    // Shift with 90-minute break allowance
    const summary90 = calculateBreakSummary({
      punches: [
        { type: "clock_in", at: new Date("2026-10-19T09:00:00Z") },
        { type: "break_start", at: new Date("2026-10-19T12:00:00Z") },
        { type: "break_end", at: new Date("2026-10-19T12:30:00Z") },
      ],
      allowedBreakMinutes: 90,
      now: new Date("2026-10-19T13:00:00Z"),
    });

    expect(summary90.allowedMinutes).toBe(90);
    expect(summary90.completedMinutes).toBe(30);
    expect(summary90.remainingMinutes).toBe(60);
  });
});
