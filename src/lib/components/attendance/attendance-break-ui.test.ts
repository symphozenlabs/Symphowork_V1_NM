import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const attendanceActions = readFileSync(new URL("./AttendanceActions.svelte", import.meta.url), "utf8");
const organizationDashboard = readFileSync(new URL("./OrganizationAttendanceDashboard.svelte", import.meta.url), "utf8");
const attendanceView = readFileSync(new URL("./AttendanceViewContainer.svelte", import.meta.url), "utf8");

describe("attendance break UI parity", () => {
  it("preserves break controls, summaries, duration details, and timers alongside clock and punch history", () => {
    expect(attendanceActions).toContain('punch("clock_in")');
    expect(attendanceActions).toContain('punch("clock_out")');
    expect(attendanceActions).toContain('punch("break_start")');
    expect(attendanceActions).toContain('punch("break_end")');
    expect(attendanceActions).toContain("Break Summary");
    expect(attendanceActions).toContain("calculateBreakSummary");
    expect(attendanceActions).toContain("Attendance History & Punches");
    expect(attendanceActions).toContain("{#each punches as p}");
  });

  it("uses the shared personal attendance and organization dashboard views", () => {
    expect(attendanceView).toContain('<AttendanceActions canViewOthers={canViewOthers}');
    expect(attendanceView).toContain('activeTab === "personal"');
    expect(attendanceView).toContain('<OrganizationAttendanceDashboard userRoleKey={userRoleKey} />');
  });

  it("preserves organization break cards, filters, columns, and duration details alongside punch history", () => {
    expect(organizationDashboard).toContain("on_break");
    expect(organizationDashboard).toContain("Break Status");
    expect(organizationDashboard).toContain("Break Used");
    expect(organizationDashboard).toContain("Remaining");
    expect(organizationDashboard).toContain("Break Intervals");
    expect(organizationDashboard).toContain("Persisted Punches");
    expect(organizationDashboard).toContain("selectedRow.punches");
  });
});
