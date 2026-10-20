import type{BreakStatus}from'./calculator';
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

