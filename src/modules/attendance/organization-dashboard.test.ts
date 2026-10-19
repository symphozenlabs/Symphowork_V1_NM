/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportOrganizationAttendanceCsv,
  formatTimeInTimezone,
  getOrganizationAttendanceDashboard,
} from "@/modules/attendance/organization-dashboard";
import {
  attendancePunches,
  attendanceRecords,
  attendanceRegularizationRequests,
  departments,
  designations,
  employees,
  holidays,
  leaveApplications,
  organizations,
  shifts,
  workingDays,
} from "@/db/schema";
import { db } from "@/db/client";

// Mock DB
vi.mock("@/db/client", () => {
  const mockDb = {
    select: vi.fn(),
  };
  return { db: mockDb };
});

describe("Organization Attendance Dashboard — Enterprise Verification", () => {
  const orgId = "org-test-123";
  const orgTimezone = "Asia/Kolkata";

  const mockOrg = {
    id: orgId,
    name: "Naresh Technologies",
    timezone: orgTimezone,
  };

  const shift1 = {
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

  const shift2 = {
    id: "shift-2-eve",
    organizationId: orgId,
    name: "Evening Shift",
    code: "SHIFT_2_EVENING",
    startTime: "18:00:00",
    endTime: "02:00:00",
    overnight: true,
    breakMinutes: 45,
    graceMinutes: 15,
  };

  const deptEng = { id: "dept-eng", organizationId: orgId, name: "Engineering", code: "ENG" };
  const deptHr = { id: "dept-hr", organizationId: orgId, name: "Human Resources", code: "HR" };

  const desgDev = { id: "desg-dev", organizationId: orgId, name: "Software Engineer", code: "SWE" };
  const desgLead = { id: "desg-lead", organizationId: orgId, name: "Tech Lead", code: "TL" };

  const emp1 = {
    id: "emp-1",
    organizationId: orgId,
    employeeId: "EMP001",
    displayName: "Amit Patel",
    firstName: "Amit",
    lastName: "Patel",
    workEmail: "amit.employee@dev.local",
    departmentId: "dept-eng",
    designationId: "desg-dev",
    shiftId: "shift-1-gds",
    status: "active",
  };

  const emp2 = {
    id: "emp-2",
    organizationId: orgId,
    employeeId: "EMP002",
    displayName: "Kavita Menon",
    firstName: "Kavita",
    lastName: "Menon",
    workEmail: "kavita.hr.exec@dev.local",
    departmentId: "dept-hr",
    designationId: "desg-lead",
    shiftId: "shift-1-gds",
    status: "active",
  };

  const emp3 = {
    id: "emp-3",
    organizationId: orgId,
    employeeId: "EMP003",
    displayName: "Vikram Mehta",
    firstName: "Vikram",
    lastName: "Mehta",
    workEmail: "vikram.lead@dev.local",
    departmentId: "dept-eng",
    designationId: "desg-lead",
    shiftId: "shift-2-eve", // Overnight shift
    status: "active",
  };

  const emp4Unassigned = {
    id: "emp-4",
    organizationId: orgId,
    employeeId: "EMP004",
    displayName: "Rahul Sharma",
    firstName: "Rahul",
    lastName: "Sharma",
    workEmail: "rahul.unassigned@dev.local",
    departmentId: "dept-eng",
    designationId: "desg-dev",
    shiftId: null, // Unassigned shift
    status: "active",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupMockDb(overrides?: {
    records?: any[];
    punches?: any[];
    leaves?: any[];
    holidays?: any[];
    workingDays?: any[];
  }) {
    const recordsList = overrides?.records ?? [];
    const punchesList = overrides?.punches ?? [];
    const leavesList = overrides?.leaves ?? [];
    const holidaysList = overrides?.holidays ?? [];
    const workingDaysList = overrides?.workingDays ?? [
      { dayOfWeek: 1, isWorkingDay: true },
      { dayOfWeek: 2, isWorkingDay: true },
      { dayOfWeek: 3, isWorkingDay: true },
      { dayOfWeek: 4, isWorkingDay: true },
      { dayOfWeek: 5, isWorkingDay: true },
      { dayOfWeek: 6, isWorkingDay: false },
      { dayOfWeek: 0, isWorkingDay: false },
    ];

    (db.select as any).mockImplementation(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn().mockImplementation(() => {
          const ret = {
            orderBy: vi.fn().mockImplementation(() => {
              if (table === employees) {
                return Promise.resolve([emp1, emp2, emp3, emp4Unassigned]);
              }
              if (table === attendancePunches) {
                return Promise.resolve(punchesList);
              }
              if (table === attendanceRegularizationRequests) {
                return Promise.resolve([]);
              }
              return Promise.resolve([]);
            }),
            then: (resolve: any) => {
              if (table === organizations) return resolve([mockOrg]);
              if (table === shifts) return resolve([shift1, shift2]);
              if (table === departments) return resolve([deptEng, deptHr]);
              if (table === designations) return resolve([desgDev, desgLead]);
              if (table === workingDays) return resolve(workingDaysList);
              if (table === holidays) return resolve(holidaysList);
              if (table === employees) return resolve([emp1, emp2, emp3, emp4Unassigned]);
              if (table === leaveApplications) return resolve(leavesList);
              if (table === attendanceRecords) return resolve(recordsList);
              if (table === attendancePunches) return resolve(punchesList);
              if (table === attendanceRegularizationRequests) return resolve([]);
              return resolve([]);
            },
          };
          return ret;
        }),
      })),
    }));
  }

  it("1. ORGANIZATION_OWNER can access organization-wide attendance dashboard", async () => {
    setupMockDb();
    const result = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
    });

    expect(result.success).toBe(true);
    expect(result.summary.totalActive).toBe(4);
    expect(result.employees).toHaveLength(4);
    expect(result.userPermissions.canManageAttendance).toBe(true);
    expect(result.userPermissions.canApproveRegularization).toBe(true);
  });

  it("2. HR_ADMIN can access dashboard and manage attendance", async () => {
    setupMockDb();
    const result = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "HR_ADMIN",
      date: "2026-10-19",
    });

    expect(result.success).toBe(true);
    expect(result.userPermissions.canManageAttendance).toBe(true);
  });

  it("3. HR_EXECUTIVE can view dashboard, but cannot manage attendance or process absences", async () => {
    setupMockDb();
    const result = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "HR_EXECUTIVE",
      date: "2026-10-19",
    });

    expect(result.success).toBe(true);
    expect(result.userPermissions.canManageAttendance).toBe(false);
    expect(result.userPermissions.canApproveRegularization).toBe(false);
  });

  it("4. EMPLOYEE is strictly denied access with 403 Forbidden", async () => {
    setupMockDb();
    await expect(
      getOrganizationAttendanceDashboard({
        organizationId: orgId,
        actorRoleKey: "EMPLOYEE",
        date: "2026-10-19",
      })
    ).rejects.toThrowError(/not authorized/i);
  });

  it("5. Correctly handles Unassigned Shift employees without crashing", async () => {
    setupMockDb();
    const result = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
    });

    expect(result.summary.unassignedShift).toBe(1);
    const unassignedRow = result.employees.find((e) => e.employee.id === "emp-4");
    expect(unassignedRow?.isUnassignedShift).toBe(true);
    expect(unassignedRow?.shift).toBeNull();
    expect(unassignedRow?.status).toBe("unassigned_shift");
  });

  it("6. Active shift with clock-in is classified as Present or Late, NOT Missing Punch", async () => {
    const recordEmp1 = {
      id: "rec-1",
      organizationId: orgId,
      employeeId: "emp-1",
      attendanceDate: "2026-10-19",
      shiftId: "shift-1-gds",
      scheduledStart: new Date("2026-10-19T03:30:00Z"), // 09:00 IST
      scheduledEnd: new Date("2026-10-19T12:30:00Z"), // 18:00 IST
      actualFirstIn: new Date("2026-10-19T03:40:00Z"), // 09:10 IST (within 15m grace)
      actualLastOut: null, // Active shift!
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      netWorkMinutes: 120,
      status: "present",
    };

    const punchesEmp1 = [
      {
        id: "p-1",
        attendanceId: "rec-1",
        organizationId: orgId,
        punchType: "clock_in",
        punchedAt: new Date("2026-10-19T03:40:00Z"),
      },
    ];

    setupMockDb({ records: [recordEmp1], punches: punchesEmp1 });

    const result = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
      now: new Date("2026-10-19T06:00:00Z"), // 11:30 AM IST (during active 09:00 - 18:00 shift)
    });

    const emp1Row = result.employees.find((e) => e.employee.id === "emp-1");
    expect(emp1Row?.status).toBe("present");
    expect(emp1Row?.isClockOutPending).toBe(true);
    expect(emp1Row?.clockInTimeFormatted).toBeTruthy();
  });

  it("7. Active break state and break duration calculate accurately in table", async () => {
    const recordEmp1 = {
      id: "rec-1",
      organizationId: orgId,
      employeeId: "emp-1",
      attendanceDate: "2026-10-19",
      shiftId: "shift-1-gds",
      scheduledStart: new Date("2026-10-19T03:30:00Z"),
      scheduledEnd: new Date("2026-10-19T12:30:00Z"),
      actualFirstIn: new Date("2026-10-19T03:30:00Z"),
      actualLastOut: null,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      netWorkMinutes: 60,
      status: "present",
    };

    // Emp 1 took a 15 min break, then started an active break
    const punchesEmp1 = [
      { id: "p-1", attendanceId: "rec-1", organizationId: orgId, punchType: "clock_in", punchedAt: new Date("2026-10-19T03:30:00Z") },
      { id: "p-2", attendanceId: "rec-1", organizationId: orgId, punchType: "break_start", punchedAt: new Date("2026-10-19T05:00:00Z") },
      { id: "p-3", attendanceId: "rec-1", organizationId: orgId, punchType: "break_end", punchedAt: new Date("2026-10-19T05:15:00Z") },
      { id: "p-4", attendanceId: "rec-1", organizationId: orgId, punchType: "break_start", punchedAt: new Date("2026-10-19T06:00:00Z") }, // Active
    ];

    setupMockDb({ records: [recordEmp1], punches: punchesEmp1 });

    const result = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
      now: new Date("2026-10-19T06:10:00Z"), // 11:40 AM IST (10 min into active break)
    });

    const emp1Row = result.employees.find((e) => e.employee.id === "emp-1");
    expect(emp1Row?.breakStatus).toBe("on_break");
    expect(result.summary.onBreak).toBe(1);
    expect(emp1Row?.remainingBreakMinutes).toBeLessThanOrEqual(45);
  });

  it("8. Approved leave reflects as on_leave and prevents incorrect absent marking", async () => {
    const leave = {
      id: "leave-1",
      organizationId: orgId,
      employeeId: "emp-2",
      startDate: "2026-10-19",
      endDate: "2026-10-21",
      status: "approved",
    };

    setupMockDb({ leaves: [leave] });

    const result = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
    });

    const emp2Row = result.employees.find((e) => e.employee.id === "emp-2");
    expect(emp2Row?.status).toBe("on_leave");
    expect(result.summary.onLeave).toBe(1);
  });

  it("9. Overnight shift (Shift 2) is recognized and formatted", async () => {
    setupMockDb();
    const result = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
    });

    const emp3Row = result.employees.find((e) => e.employee.id === "emp-3");
    expect(emp3Row?.shift?.overnight).toBe(true);
    expect(emp3Row?.shift?.code).toBe("SHIFT_2_EVENING");
  });

  it("10. Search and combined filters filter employee rows correctly", async () => {
    setupMockDb();

    // Filter by name
    const searchRes = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
      search: "Kavita",
    });
    expect(searchRes.employees).toHaveLength(1);
    expect(searchRes.employees[0].employee.displayName).toBe("Kavita Menon");

    // Filter by department
    const deptRes = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
      departmentId: "dept-hr",
    });
    expect(deptRes.employees).toHaveLength(1);
    expect(deptRes.employees[0].department?.code).toBe("HR");

    // Filter by unassigned shift
    const unassignedRes = await getOrganizationAttendanceDashboard({
      organizationId: orgId,
      actorRoleKey: "ORGANIZATION_OWNER",
      date: "2026-10-19",
      shiftId: "unassigned",
    });
    expect(unassignedRes.employees).toHaveLength(1);
    expect(unassignedRes.employees[0].employee.employeeId).toBe("EMP004");
  });

  it("11. exportOrganizationAttendanceCsv exports valid CSV with all required headers", () => {
    const sampleRow: any = {
      employee: { employeeId: "EMP001", displayName: "Amit Patel" },
      department: { name: "Engineering" },
      designation: { name: "Developer" },
      shift: { name: "General Day Shift", startTime: "09:00:00", endTime: "18:00:00", overnight: false },
      clockInTimeFormatted: "09:12 AM",
      clockOutTimeFormatted: "06:05 PM",
      statusLabel: "Present",
      breakStatus: "completed",
      totalBreakMinutes: 45,
      remainingBreakMinutes: 15,
      netWorkMinutes: 488,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      regularization: null,
    };

    const csv = exportOrganizationAttendanceCsv([sampleRow], "Asia/Kolkata");
    expect(csv).toContain("Employee ID,Employee Name,Department");
    expect(csv).toContain('"EMP001","Amit Patel","Engineering"');
    expect(csv).toContain('"09:12 AM"');
  });

  it("12. formatTimeInTimezone formats UTC date strings into configured organization timezone", () => {
    // 03:30:00 UTC = 09:00:00 in Asia/Kolkata (UTC + 5:30)
    const formatted = formatTimeInTimezone(new Date("2026-10-19T03:30:00Z"), "Asia/Kolkata");
    expect(formatted).toMatch(/9:00:00\s*AM/i);
  });
});
