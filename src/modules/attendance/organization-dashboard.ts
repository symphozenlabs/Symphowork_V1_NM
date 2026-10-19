import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db/client";
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
import { AppError } from "@/lib/errors";
import {
  calculateBreakSummary,
  localDateInTimezone,
  shiftWindow,
  type BreakStatus,
} from "@/modules/attendance/calculator";

export interface OrganizationAttendanceRow {
  employee: {
    id: string;
    employeeId: string;
    displayName: string;
    firstName: string;
    lastName: string;
    workEmail: string | null;
  };
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  designation: {
    id: string;
    name: string;
    code: string;
  } | null;
  shift: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    overnight: boolean;
    breakMinutes: number;
    graceMinutes: number;
  } | null;
  isUnassignedShift: boolean;
  attendanceDate: string;
  recordId: string | null;
  clockIn: string | null;
  clockOut: string | null;
  clockInTimeFormatted: string | null;
  clockOutTimeFormatted: string | null;
  isClockOutPending: boolean;
  status:
    | "present"
    | "late"
    | "early_departure"
    | "late_and_early"
    | "absent"
    | "on_leave"
    | "missing_punch"
    | "scheduled"
    | "weekend"
    | "holiday"
    | "unassigned_shift";
  statusLabel: string;
  breakStatus: BreakStatus;
  totalBreakMinutes: number;
  remainingBreakMinutes: number;
  isBreakExceeded: boolean;
  exceededBreakMinutes: number;
  netWorkMinutes: number;
  totalWorkMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  potentialOvertimeMinutes: number;
  regularization: {
    id: string;
    status: string;
    reason: string;
    submittedAt: string;
  } | null;
  punches: Array<{
    id: string;
    punchType: string;
    punchedAt: string;
    punchedAtFormatted: string;
  }>;
  breakIntervals: Array<{
    start: string;
    end: string | null;
    durationMinutes: number;
  }>;
}

export interface OrganizationAttendanceSummary {
  totalActive: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  onBreak: number;
  missingPunch: number;
  unassignedShift: number;
  scheduled: number;
  isWorkingDay: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

export interface GetOrganizationAttendanceInput {
  organizationId: string;
  actorRoleKey?: string;
  date?: string;
  search?: string;
  departmentId?: string;
  shiftId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  now?: Date;
}

export function formatTimeInTimezone(
  date: Date | string | null | undefined,
  timezone: string
): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

export async function getOrganizationAttendanceDashboard(input: GetOrganizationAttendanceInput) {
  // 1. Verify caller privilege: ORGANIZATION_OWNER, HR_ADMIN, or HR_EXECUTIVE
  const privilegedRoles = new Set(["ORGANIZATION_OWNER", "HR_ADMIN", "HR_EXECUTIVE"]);
  if (input.actorRoleKey && !privilegedRoles.has(input.actorRoleKey)) {
    throw new AppError(
      "FORBIDDEN",
      "You are not authorized to view organization-wide attendance records.",
      403
    );
  }

  // 2. Fetch organization configuration
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, input.organizationId));
  if (!organization) {
    throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);
  }

  const timezone = organization.timezone || "UTC";
  const now = input.now ?? new Date();
  const targetDate = input.date ?? localDateInTimezone(timezone, now);

  // 3. Fetch Master Data: shifts, departments, designations
  const [allShifts, allDepartments, allDesignations] = await Promise.all([
    db.select().from(shifts).where(eq(shifts.organizationId, input.organizationId)),
    db.select().from(departments).where(eq(departments.organizationId, input.organizationId)),
    db.select().from(designations).where(eq(designations.organizationId, input.organizationId)),
  ]);

  const shiftById = new Map(allShifts.map((s) => [s.id, s]));
  const departmentById = new Map(allDepartments.map((d) => [d.id, d]));
  const designationById = new Map(allDesignations.map((d) => [d.id, d]));

  // 4. Check Calendar: Working days & Holidays for targetDate
  const dayOfWeek = new Date(`${targetDate}T00:00:00Z`).getUTCDay();
  const workingDayRows = await db
    .select()
    .from(workingDays)
    .where(eq(workingDays.organizationId, input.organizationId));
  const workingDayMap = new Map(workingDayRows.map((r) => [r.dayOfWeek, r.isWorkingDay]));
  const isWorkingDay = workingDayMap.size > 0 ? (workingDayMap.get(dayOfWeek) ?? true) : true;

  const holidayRows = await db
    .select()
    .from(holidays)
    .where(
      and(
        eq(holidays.organizationId, input.organizationId),
        eq(holidays.holidayDate, targetDate),
        eq(holidays.status, "active")
      )
    );
  const isHoliday = holidayRows.length > 0;
  const holidayName = isHoliday ? holidayRows[0].name : undefined;

  // 5. Fetch Active Employees
  const activeEmployees = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, input.organizationId),
        inArray(employees.status, ["active", "probation", "confirmed", "notice_period"])
      )
    )
    .orderBy(asc(employees.displayName));

  // 6. Fetch approved leaves for targetDate
  const approvedLeaves = await db
    .select()
    .from(leaveApplications)
    .where(
      and(
        eq(leaveApplications.organizationId, input.organizationId),
        eq(leaveApplications.status, "approved"),
        lte(leaveApplications.startDate, targetDate),
        gte(leaveApplications.endDate, targetDate)
      )
    );
  const leaveByEmployeeId = new Map(approvedLeaves.map((l) => [l.employeeId, l]));

  // 7. Fetch attendance records for targetDate
  const records = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.organizationId, input.organizationId),
        eq(attendanceRecords.attendanceDate, targetDate)
      )
    );
  const recordByEmployeeId = new Map(records.map((r) => [r.employeeId, r]));

  // 8. Fetch punches for these records
  const recordIds = records.map((r) => r.id);
  const punches =
    recordIds.length > 0
      ? await db
          .select()
          .from(attendancePunches)
          .where(
            and(
              eq(attendancePunches.organizationId, input.organizationId),
              inArray(attendancePunches.attendanceId, recordIds)
            )
          )
          .orderBy(asc(attendancePunches.punchedAt))
      : [];

  const punchesByRecordId = new Map<string, typeof punches>();
  for (const p of punches) {
    const list = punchesByRecordId.get(p.attendanceId) ?? [];
    list.push(p);
    punchesByRecordId.set(p.attendanceId, list);
  }

  // 9. Fetch regularization requests for these records
  const regularizations =
    recordIds.length > 0
      ? await db
          .select()
          .from(attendanceRegularizationRequests)
          .where(
            and(
              eq(attendanceRegularizationRequests.organizationId, input.organizationId),
              inArray(attendanceRegularizationRequests.attendanceId, recordIds)
            )
          )
          .orderBy(desc(attendanceRegularizationRequests.submittedAt))
      : [];
  const regularizationByRecordId = new Map(regularizations.map((r) => [r.attendanceId, r]));

  // 10. Process each active employee into a comprehensive row
  const rows: OrganizationAttendanceRow[] = activeEmployees.map((emp) => {
    const dept = emp.departmentId ? departmentById.get(emp.departmentId) : null;
    const desg = emp.designationId ? designationById.get(emp.designationId) : null;
    const shift = emp.shiftId ? shiftById.get(emp.shiftId) : null;
    const isUnassignedShift = !shift;

    const record = recordByEmployeeId.get(emp.id) ?? null;
    const empPunches = record ? (punchesByRecordId.get(record.id) ?? []) : [];
    const regularization = record ? (regularizationByRecordId.get(record.id) ?? null) : null;
    const hasApprovedLeave = leaveByEmployeeId.has(emp.id);

    // Calculate break summary from persisted punches
    const breakSummary = calculateBreakSummary({
      punches: empPunches,
      allowedBreakMinutes: shift?.breakMinutes ?? 0,
      now,
    });

    // Shift timing & window analysis
    let isShiftEnded = false;
    let isShiftActive = false;
    let shiftWindowEnd: Date | null = null;
    if (shift) {
      const window = shiftWindow(targetDate, shift.startTime, shift.endTime, shift.overnight, timezone);
      shiftWindowEnd = window.end;
      isShiftEnded = now.getTime() > window.end.getTime();
      isShiftActive = now.getTime() >= window.start.getTime() && now.getTime() <= window.end.getTime();
    }

    // Determine attendance status
    let status: OrganizationAttendanceRow["status"];
    let statusLabel: string;

    const hasClockIn = Boolean(record?.actualFirstIn);
    const hasClockOut = Boolean(record?.actualLastOut);
    const isClockOutPending = hasClockIn && !hasClockOut && !isShiftEnded;

    if (hasClockIn) {
      if (hasClockOut) {
        if (record && record.lateMinutes > 0 && record.earlyDepartureMinutes > 0) {
          status = "late_and_early";
          statusLabel = "Late & Early Departure";
        } else if (record && record.lateMinutes > 0) {
          status = "late";
          statusLabel = "Late Arrival";
        } else if (record && record.earlyDepartureMinutes > 0) {
          status = "early_departure";
          statusLabel = "Early Departure";
        } else {
          status = "present";
          statusLabel = "Present";
        }
      } else {
        // Clocked in, clock-out not recorded yet
        if (isShiftEnded) {
          status = "missing_punch";
          statusLabel = "Missing Punch";
        } else {
          // Shift is active
          if (record && record.lateMinutes > 0) {
            status = "late";
            statusLabel = "Late (Active)";
          } else {
            status = "present";
            statusLabel = "Present (Active)";
          }
        }
      }
    } else {
      // Not clocked in
      if (hasApprovedLeave) {
        status = "on_leave";
        statusLabel = "On Leave";
      } else if (record?.status === "absent") {
        status = "absent";
        statusLabel = "Absent";
      } else if (!isWorkingDay) {
        status = "weekend";
        statusLabel = "Weekly Off";
      } else if (isHoliday) {
        status = "holiday";
        statusLabel = `Holiday (${holidayName || "Public"})`;
      } else if (isUnassignedShift) {
        status = "unassigned_shift";
        statusLabel = "Unassigned Shift";
      } else if (isShiftEnded) {
        // Shift window completed on working day without punch or leave
        status = "absent";
        statusLabel = "Absent (No Show)";
      } else {
        // Shift is upcoming or currently running but not yet ended
        status = "scheduled";
        statusLabel = isShiftActive ? "Shift Active (Not Clocked In)" : "Scheduled";
      }
    }

    return {
      employee: {
        id: emp.id,
        employeeId: emp.employeeId,
        displayName: emp.displayName,
        firstName: emp.firstName,
        lastName: emp.lastName,
        workEmail: emp.workEmail,
      },
      department: dept ? { id: dept.id, name: dept.name, code: dept.code } : null,
      designation: desg ? { id: desg.id, name: desg.name, code: desg.code } : null,
      shift: shift
        ? {
            id: shift.id,
            name: shift.name,
            code: shift.code,
            startTime: shift.startTime,
            endTime: shift.endTime,
            overnight: shift.overnight,
            breakMinutes: shift.breakMinutes,
            graceMinutes: shift.graceMinutes,
          }
        : null,
      isUnassignedShift,
      attendanceDate: targetDate,
      recordId: record?.id ?? null,
      clockIn: record?.actualFirstIn ? record.actualFirstIn.toISOString() : null,
      clockOut: record?.actualLastOut ? record.actualLastOut.toISOString() : null,
      clockInTimeFormatted: formatTimeInTimezone(record?.actualFirstIn, timezone),
      clockOutTimeFormatted: formatTimeInTimezone(record?.actualLastOut, timezone),
      isClockOutPending,
      status,
      statusLabel,
      breakStatus: breakSummary.status,
      totalBreakMinutes: breakSummary.totalUsedMinutes,
      remainingBreakMinutes: breakSummary.remainingMinutes,
      isBreakExceeded: breakSummary.isExceeded,
      exceededBreakMinutes: breakSummary.exceededMinutes,
      netWorkMinutes: record?.netWorkMinutes ?? 0,
      totalWorkMinutes: record?.totalWorkMinutes ?? 0,
      lateMinutes: record?.lateMinutes ?? 0,
      earlyDepartureMinutes: record?.earlyDepartureMinutes ?? 0,
      potentialOvertimeMinutes:
        record?.actualLastOut && shiftWindowEnd && record.actualLastOut.getTime() > shiftWindowEnd.getTime()
          ? Math.max(0, Math.round((record.actualLastOut.getTime() - shiftWindowEnd.getTime()) / 60000))
          : 0,
      regularization: regularization
        ? {
            id: regularization.id,
            status: regularization.status,
            reason: regularization.reason,
            submittedAt: regularization.submittedAt.toISOString(),
          }
        : null,
      punches: empPunches.map((p) => ({
        id: p.id,
        punchType: p.punchType,
        punchedAt: p.punchedAt.toISOString(),
        punchedAtFormatted: formatTimeInTimezone(p.punchedAt, timezone) || "",
      })),
      breakIntervals: breakSummary.intervals.map((iv) => ({
        start: iv.start.toISOString(),
        end: iv.end ? iv.end.toISOString() : null,
        durationMinutes: iv.durationMinutes,
      })),
    };
  });

  // 11. Compute non-overlapping Summary Counts
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let onLeaveCount = 0;
  let onBreakCount = 0;
  let missingPunchCount = 0;
  let unassignedShiftCount = 0;
  let scheduledCount = 0;

  for (const row of rows) {
    if (row.isUnassignedShift) {
      unassignedShiftCount++;
    }
    if (row.breakStatus === "on_break") {
      onBreakCount++;
    }

    switch (row.status) {
      case "present":
      case "early_departure":
        presentCount++;
        break;
      case "late":
      case "late_and_early":
        lateCount++;
        break;
      case "absent":
        absentCount++;
        break;
      case "on_leave":
        onLeaveCount++;
        break;
      case "missing_punch":
        missingPunchCount++;
        break;
      case "scheduled":
      case "weekend":
      case "holiday":
        scheduledCount++;
        break;
    }
  }

  const summary: OrganizationAttendanceSummary = {
    totalActive: activeEmployees.length,
    present: presentCount,
    late: lateCount,
    absent: absentCount,
    onLeave: onLeaveCount,
    onBreak: onBreakCount,
    missingPunch: missingPunchCount,
    unassignedShift: unassignedShiftCount,
    scheduled: scheduledCount,
    isWorkingDay,
    isHoliday,
    holidayName,
  };

  // 12. Apply Search & Filters
  let filteredRows = [...rows];

  if (input.search && input.search.trim()) {
    const q = input.search.trim().toLowerCase();
    filteredRows = filteredRows.filter(
      (r) =>
        r.employee.displayName.toLowerCase().includes(q) ||
        r.employee.employeeId.toLowerCase().includes(q) ||
        r.employee.workEmail?.toLowerCase().includes(q)
    );
  }

  if (input.departmentId && input.departmentId !== "all") {
    filteredRows = filteredRows.filter((r) => r.department?.id === input.departmentId);
  }

  if (input.shiftId && input.shiftId !== "all") {
    if (input.shiftId === "unassigned") {
      filteredRows = filteredRows.filter((r) => r.isUnassignedShift);
    } else {
      filteredRows = filteredRows.filter((r) => r.shift?.id === input.shiftId);
    }
  }

  if (input.status && input.status !== "all") {
    const s = input.status.toLowerCase();
    if (s === "on_break") {
      filteredRows = filteredRows.filter((r) => r.breakStatus === "on_break");
    } else if (s === "late") {
      filteredRows = filteredRows.filter((r) => r.status === "late" || r.status === "late_and_early");
    } else if (s === "present") {
      filteredRows = filteredRows.filter(
        (r) => r.status === "present" || r.status === "early_departure"
      );
    } else {
      filteredRows = filteredRows.filter((r) => r.status === s);
    }
  }

  // 13. Pagination
  const page = Math.max(1, Number(input.page ?? 1));
  const pageSize = Math.max(1, Math.min(100, Number(input.pageSize ?? 25)));
  const total = filteredRows.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return {
    success: true,
    summary,
    employees: paginatedRows,
    shifts: allShifts.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      startTime: s.startTime,
      endTime: s.endTime,
      overnight: s.overnight,
      breakMinutes: s.breakMinutes,
      graceMinutes: s.graceMinutes,
    })),
    departments: allDepartments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    timezone,
    date: targetDate,
    userPermissions: {
      canManageAttendance: input.actorRoleKey === "ORGANIZATION_OWNER" || input.actorRoleKey === "HR_ADMIN",
      canApproveRegularization: input.actorRoleKey === "ORGANIZATION_OWNER" || input.actorRoleKey === "HR_ADMIN",
      role: input.actorRoleKey ?? "UNKNOWN",
    },
  };
}

export function exportOrganizationAttendanceCsv(
  rows: OrganizationAttendanceRow[],
  timezone: string
): string {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "Shift Name",
    "Shift Timing",
    "Clock In",
    "Clock Out",
    "Attendance Status",
    "Break Status",
    "Break Used (min)",
    "Remaining Break (min)",
    "Net Work (min)",
    "Late (min)",
    "Early Departure (min)",
    "Regularization Status",
    "Timezone",
  ];

  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [headers.join(",")];

  for (const r of rows) {
    const shiftTiming = r.shift
      ? `${r.shift.startTime.slice(0, 5)} - ${r.shift.endTime.slice(0, 5)}${r.shift.overnight ? " (Overnight)" : ""}`
      : "Unassigned";

    const clockOutStr = r.clockOutTimeFormatted
      ? r.clockOutTimeFormatted
      : r.isClockOutPending
      ? "In Progress"
      : "";

    lines.push(
      [
        escapeCsv(r.employee.employeeId),
        escapeCsv(r.employee.displayName),
        escapeCsv(r.department?.name || "—"),
        escapeCsv(r.designation?.name || "—"),
        escapeCsv(r.shift?.name || "Unassigned Shift"),
        escapeCsv(shiftTiming),
        escapeCsv(r.clockInTimeFormatted || "—"),
        escapeCsv(clockOutStr || "—"),
        escapeCsv(r.statusLabel),
        escapeCsv(r.breakStatus === "on_break" ? "On Break" : r.breakStatus === "completed" ? "Completed" : "Not Started"),
        escapeCsv(r.totalBreakMinutes),
        escapeCsv(r.remainingBreakMinutes),
        escapeCsv(r.netWorkMinutes),
        escapeCsv(r.lateMinutes),
        escapeCsv(r.earlyDepartureMinutes),
        escapeCsv(r.regularization ? r.regularization.status.toUpperCase() : "—"),
        escapeCsv(timezone || "UTC"),
      ].join(",")
    );
  }

  return lines.join("\r\n");
}
