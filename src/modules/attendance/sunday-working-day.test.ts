import { describe, expect, it } from "vitest";

describe("Sunday day-of-week 0..6 representation in leave and payroll", () => {
  it("correctly identifies Sunday as day_of_week === 0 in Date.getUTCDay()", () => {
    // 2026-10-18 is a Sunday
    const sundayDate = "2026-10-18";
    const dayOfWeek = new Date(`${sundayDate}T00:00:00Z`).getUTCDay();
    expect(dayOfWeek).toBe(0);
  });

  it("evaluates Sunday working days correctly against working_days table (0 = Sunday)", () => {
    // Organization configures Sunday (0) through Thursday (4) as working days, Friday (5) & Saturday (6) as rest days
    const workingDaysConfig = [
      { dayOfWeek: 0, isWorkingDay: true },  // Sunday
      { dayOfWeek: 1, isWorkingDay: true },  // Monday
      { dayOfWeek: 2, isWorkingDay: true },  // Tuesday
      { dayOfWeek: 3, isWorkingDay: true },  // Wednesday
      { dayOfWeek: 4, isWorkingDay: true },  // Thursday
      { dayOfWeek: 5, isWorkingDay: false }, // Friday
      { dayOfWeek: 6, isWorkingDay: false }, // Saturday
    ];

    const workingByDay = new Map(workingDaysConfig.map((row) => [row.dayOfWeek, row.isWorkingDay]));
    const workingDaySet = new Set(workingDaysConfig.filter((row) => row.isWorkingDay).map((row) => row.dayOfWeek));

    // Test a Sunday date: 2026-10-18
    const sundayDate = "2026-10-18";
    const sundayDayOfWeek = new Date(`${sundayDate}T00:00:00Z`).getUTCDay();

    // Leave service logic:
    const leaveSundayIsWorking = workingByDay.get(sundayDayOfWeek) ?? (sundayDayOfWeek >= 1 && sundayDayOfWeek <= 5);
    expect(leaveSundayIsWorking).toBe(true);

    // Payroll service logic:
    const holidaySet = new Set<string>();
    const payrollSundayIsWorking = workingDaySet.size === 0 || (workingDaySet.has(sundayDayOfWeek) && !holidaySet.has(sundayDate));
    expect(payrollSundayIsWorking).toBe(true);
  });

  it("evaluates Sunday non-working days correctly when Sunday is configured as rest day", () => {
    // Standard Mon-Fri working schedule
    const workingDaysConfig = [
      { dayOfWeek: 0, isWorkingDay: false }, // Sunday
      { dayOfWeek: 1, isWorkingDay: true },  // Monday
      { dayOfWeek: 2, isWorkingDay: true },  // Tuesday
      { dayOfWeek: 3, isWorkingDay: true },  // Wednesday
      { dayOfWeek: 4, isWorkingDay: true },  // Thursday
      { dayOfWeek: 5, isWorkingDay: true },  // Friday
      { dayOfWeek: 6, isWorkingDay: false }, // Saturday
    ];

    const workingByDay = new Map(workingDaysConfig.map((row) => [row.dayOfWeek, row.isWorkingDay]));
    const workingDaySet = new Set(workingDaysConfig.filter((row) => row.isWorkingDay).map((row) => row.dayOfWeek));

    const sundayDate = "2026-10-18";
    const sundayDayOfWeek = new Date(`${sundayDate}T00:00:00Z`).getUTCDay();

    // Leave logic:
    const leaveSundayIsWorking = workingByDay.get(sundayDayOfWeek) ?? (sundayDayOfWeek >= 1 && sundayDayOfWeek <= 5);
    expect(leaveSundayIsWorking).toBe(false);

    // Payroll logic:
    const holidaySet = new Set<string>();
    const payrollSundayIsWorking = workingDaySet.size === 0 || (workingDaySet.has(sundayDayOfWeek) && !holidaySet.has(sundayDate));
    expect(payrollSundayIsWorking).toBe(false);
  });
});
