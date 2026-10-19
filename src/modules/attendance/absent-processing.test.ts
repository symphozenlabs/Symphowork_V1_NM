import { describe, expect, it } from "vitest";
import { shiftWindow, localDateInTimezone } from "./calculator";

describe("Absent Processing Logic and Shift Boundaries", () => {
  const timezone = "Asia/Kolkata"; // UTC+05:30

  it("determines whether normal shift has ended in organization timezone", () => {
    const workDate = "2026-10-19";
    const startTime = "09:00:00";
    const endTime = "18:00:00";

    const window = shiftWindow(workDate, startTime, endTime, false, timezone);

    // 09:00 IST = 03:30 UTC
    // 18:00 IST = 12:30 UTC
    expect(window.start.toISOString()).toBe("2026-10-19T03:30:00.000Z");
    expect(window.end.toISOString()).toBe("2026-10-19T12:30:00.000Z");

    // Before shift end: e.g. 17:59 IST (12:29 UTC)
    const beforeEnd = new Date("2026-10-19T12:29:00.000Z");
    expect(beforeEnd.getTime() < window.end.getTime()).toBe(true);

    // After shift end: e.g. 18:01 IST (12:31 UTC)
    const afterEnd = new Date("2026-10-19T12:31:00.000Z");
    expect(afterEnd.getTime() > window.end.getTime()).toBe(true);
  });

  it("determines overnight shift window spanning next day in organization timezone", () => {
    const workDate = "2026-10-19";
    const startTime = "22:00:00";
    const endTime = "06:00:00";

    const window = shiftWindow(workDate, startTime, endTime, true, timezone);

    // Start: 2026-10-19 22:00 IST = 16:30 UTC
    // End: 2026-10-20 06:00 IST = 00:30 UTC (next day)
    expect(window.start.toISOString()).toBe("2026-10-19T16:30:00.000Z");
    expect(window.end.toISOString()).toBe("2026-10-20T00:30:00.000Z");

    // During overnight shift at 02:00 IST on Oct 20 (20:30 UTC on Oct 19):
    const duringShift = new Date("2026-10-19T20:30:00.000Z");
    expect(duringShift.getTime() < window.end.getTime()).toBe(true);

    // After overnight shift ends at 06:05 IST on Oct 20 (00:35 UTC on Oct 20):
    const afterShift = new Date("2026-10-20T00:35:00.000Z");
    expect(afterShift.getTime() > window.end.getTime()).toBe(true);
  });

  it("formats local date consistently in organization timezone", () => {
    // 2026-10-19 at 23:30 UTC is 2026-10-20 05:00 in Asia/Kolkata (+05:30)
    const utcDate = new Date("2026-10-19T23:30:00.000Z");
    const localDate = localDateInTimezone(timezone, utcDate);
    expect(localDate).toBe("2026-10-20");
  });

  it("prevents marking absent when current time is before shift end", () => {
    const workDate = "2026-10-19";
    const shift = { startTime: "09:00:00", endTime: "18:00:00", overnight: false };
    const window = shiftWindow(workDate, shift.startTime, shift.endTime, shift.overnight, timezone);

    // Current time: 14:00 IST on Oct 19
    const currentTime = new Date("2026-10-19T08:30:00.000Z"); // 14:00 IST
    const hasShiftEnded = currentTime.getTime() >= window.end.getTime();

    // Critical safety requirement: Never mark employees absent before shift end
    expect(hasShiftEnded).toBe(false);
  });
});
