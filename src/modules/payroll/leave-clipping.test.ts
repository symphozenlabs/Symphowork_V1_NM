import { describe, expect, it } from "vitest";
import { calculateLeaveDaysInPeriod } from "./service";

describe("calculateLeaveDaysInPeriod (Multi-Month Leave Proration)", () => {
  const periodStart = "2026-05-01";
  const periodEnd = "2026-05-31";

  // Standard Monday-Friday working days in May 2026 (assuming 22 working days)
  const mayWorkingDays = new Set([
    "2026-05-01", // Friday
    "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08",
    "2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14", "2026-05-15",
    "2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21", "2026-05-22",
    "2026-05-25", "2026-05-26", "2026-05-27", "2026-05-28", "2026-05-29",
  ]);

  it("calculates leave days when entire leave is within the period", () => {
    // May 4 to May 8 = Mon to Fri (5 working days)
    const days = calculateLeaveDaysInPeriod(
      "2026-05-04",
      "2026-05-08",
      periodStart,
      periodEnd,
      mayWorkingDays
    );
    expect(days).toBe(5);
  });

  it("clips cross-month leave starting in previous month (April to May)", () => {
    // Leave from April 27 to May 6 (10 calendar days total)
    // In May, dates overlapping are May 1 to May 6
    // May 1 (Fri), May 2 (Sat - off), May 3 (Sun - off), May 4 (Mon), May 5 (Tue), May 6 (Wed)
    // Working days in May = May 1, May 4, May 5, May 6 = 4 days
    const days = calculateLeaveDaysInPeriod(
      "2026-04-27",
      "2026-05-06",
      periodStart,
      periodEnd,
      mayWorkingDays
    );
    expect(days).toBe(4);
  });

  it("clips cross-month leave ending in next month (May to June)", () => {
    // Leave from May 28 to June 5
    // In May, dates overlapping are May 28 to May 31
    // May 28 (Thu), May 29 (Fri), May 30 (Sat - off), May 31 (Sun - off)
    // Working days in May = May 28, May 29 = 2 days
    const days = calculateLeaveDaysInPeriod(
      "2026-05-28",
      "2026-06-05",
      periodStart,
      periodEnd,
      mayWorkingDays
    );
    expect(days).toBe(2);
  });

  it("returns 0 when leave does not overlap with payroll period", () => {
    // Entirely in April
    const aprilDays = calculateLeaveDaysInPeriod(
      "2026-04-01",
      "2026-04-10",
      periodStart,
      periodEnd,
      mayWorkingDays
    );
    expect(aprilDays).toBe(0);

    // Entirely in June
    const juneDays = calculateLeaveDaysInPeriod(
      "2026-06-01",
      "2026-06-10",
      periodStart,
      periodEnd,
      mayWorkingDays
    );
    expect(juneDays).toBe(0);
  });

  it("handles empty working day set by falling back to total calendar days in overlap", () => {
    // Empty working day set represents 7-day calendar basis
    const days = calculateLeaveDaysInPeriod(
      "2026-04-28",
      "2026-05-05",
      periodStart,
      periodEnd,
      new Set()
    );
    // Overlap: May 1, 2, 3, 4, 5 = 5 calendar days
    expect(days).toBe(5);
  });
});
