import type { PunchType } from "$lib/domain/attendance/types";

export type ShiftWindow = { start: Date; end: Date };
export type Punch = { type: PunchType; at: Date };

export type AttendanceCalculationStatus =
  | "present"
  | "late"
  | "early_departure"
  | "late_and_early"
  | "missing_punch";

export function nextDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

export function previousDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  return prev.toISOString().slice(0, 10);
}

export function localDateInTimezone(timezone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function createDateInTimezone(
  dateStr: string,
  timeStr: string,
  timezone: string
): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const [hStr, mStr, sStr] = cleanTime.split(":");
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  const seconds = parseInt(sStr, 10);

  const guessUtc = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  let date = new Date(guessUtc);

  // Iteratively adjust using Intl.DateTimeFormat to lock in exact timezone offset
  for (let i = 0; i < 3; i++) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

    const tzYear = getPart("year");
    const tzMonth = getPart("month");
    const tzDay = getPart("day");
    let tzHour = getPart("hour");
    if (tzHour === 24) tzHour = 0;
    const tzMin = getPart("minute");
    const tzSec = getPart("second");

    const tzTimeAsUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, tzSec);
    const diff = guessUtc - tzTimeAsUtc;
    if (diff === 0) break;
    date = new Date(date.getTime() + diff);
  }

  return date;
}

export function shiftWindow(
  workDate: string,
  startTime: string,
  endTime: string,
  overnight: boolean,
  timezone?: string
): ShiftWindow {
  const endDateStr = overnight ? nextDate(workDate) : workDate;
  if (!timezone) {
    const start = new Date(`${workDate}T${startTime}Z`);
    const end = new Date(`${endDateStr}T${endTime}Z`);
    return { start, end };
  }
  const start = createDateInTimezone(workDate, startTime, timezone);
  const end = createDateInTimezone(endDateStr, endTime, timezone);
  return { start, end };
}

export function resolveShiftWindowAndWorkDate(params: {
  now: Date;
  timezone: string;
  shift: {
    startTime: string;
    endTime: string;
    overnight: boolean;
  };
}): {
  workDate: string;
  window: ShiftWindow;
  isWithinWindow: boolean;
  isBeforeStart: boolean;
  isAfterEnd: boolean;
} {
  const { now, timezone, shift } = params;
  const todayDateStr = localDateInTimezone(timezone, now);

  if (!shift.overnight) {
    const window = shiftWindow(todayDateStr, shift.startTime, shift.endTime, false, timezone);
    const isBeforeStart = now.getTime() < window.start.getTime();
    const isAfterEnd = now.getTime() > window.end.getTime();
    const isWithinWindow = !isBeforeStart && !isAfterEnd;
    return {
      workDate: todayDateStr,
      window,
      isWithinWindow,
      isBeforeStart,
      isAfterEnd,
    };
  }

  // Overnight shift: Check if now falls into yesterday's shift window
  const yesterdayDateStr = previousDate(todayDateStr);
  const yesterdayWindow = shiftWindow(yesterdayDateStr, shift.startTime, shift.endTime, true, timezone);

  if (now.getTime() >= yesterdayWindow.start.getTime() && now.getTime() <= yesterdayWindow.end.getTime()) {
    return {
      workDate: yesterdayDateStr,
      window: yesterdayWindow,
      isWithinWindow: true,
      isBeforeStart: false,
      isAfterEnd: false,
    };
  }

  // Check today's shift window
  const todayWindow = shiftWindow(todayDateStr, shift.startTime, shift.endTime, true, timezone);
  if (now.getTime() >= todayWindow.start.getTime() && now.getTime() <= todayWindow.end.getTime()) {
    return {
      workDate: todayDateStr,
      window: todayWindow,
      isWithinWindow: true,
      isBeforeStart: false,
      isAfterEnd: false,
    };
  }

  // Outside both windows: determine if closer to yesterday's completed window or today's upcoming window
  const distanceToYesterdayEnd = Math.abs(now.getTime() - yesterdayWindow.end.getTime());
  const distanceToTodayStart = Math.abs(todayWindow.start.getTime() - now.getTime());

  if (distanceToYesterdayEnd < distanceToTodayStart) {
    return {
      workDate: yesterdayDateStr,
      window: yesterdayWindow,
      isWithinWindow: false,
      isBeforeStart: false,
      isAfterEnd: true,
    };
  }

  return {
    workDate: todayDateStr,
    window: todayWindow,
    isWithinWindow: false,
    isBeforeStart: true,
    isAfterEnd: false,
  };
}

export function minutesBetween(start: Date | null, end: Date | null) {
  return start && end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : 0;
}

export function calculateAttendance(input: {
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  punches: Punch[];
  gracePeriodMinutes: number;
  earlyDepartureThresholdMinutes: number;
  now?: Date;
}) {
  const ordered = [...input.punches].sort((a, b) => a.at.getTime() - b.at.getTime());
  const firstIn = ordered.find((p) => p.type === "clock_in")?.at ?? null;
  const lastOut = [...ordered].reverse().find((p) => p.type === "clock_out")?.at ?? null;
  let breakMinutes = 0;
  let breakStart: Date | null = null;
  for (const punch of ordered) {
    if (punch.type === "break_start" && !breakStart) breakStart = punch.at;
    if (punch.type === "break_end" && breakStart) {
      breakMinutes += minutesBetween(breakStart, punch.at);
      breakStart = null;
    }
  }
  const totalWorkMinutes = minutesBetween(firstIn, lastOut);
  const netWorkMinutes = Math.max(0, totalWorkMinutes - breakMinutes);
  const lateMinutes =
    input.scheduledStart && firstIn
      ? Math.max(0, minutesBetween(input.scheduledStart, firstIn) - input.gracePeriodMinutes)
      : 0;
  const earlyDepartureMinutes =
    input.scheduledEnd && lastOut
      ? Math.max(0, minutesBetween(lastOut, input.scheduledEnd) - input.earlyDepartureThresholdMinutes)
      : 0;

  const now = input.now ?? new Date();
  const isShiftEnded = input.scheduledEnd ? now.getTime() > input.scheduledEnd.getTime() : false;

  let status: AttendanceCalculationStatus;
  if (!firstIn) {
    status = "missing_punch";
  } else if (lastOut) {
    if (lateMinutes > 0 && earlyDepartureMinutes > 0) {
      status = "late_and_early";
    } else if (lateMinutes > 0) {
      status = "late";
    } else if (earlyDepartureMinutes > 0) {
      status = "early_departure";
    } else {
      status = "present";
    }
  } else {
    // Clock-in recorded, but clock-out has not occurred yet
    if (isShiftEnded) {
      // The scheduled shift window has ended and clock-out is genuinely missing
      status = "missing_punch";
    } else {
      // Shift is still active: classify punctuality based on arrival and grace period
      status = lateMinutes > 0 ? "late" : "present";
    }
  }

  const scheduledDurationMinutes =
    input.scheduledStart && input.scheduledEnd
      ? minutesBetween(input.scheduledStart, input.scheduledEnd)
      : 0;

  // Potential Overtime (Pending Approval): actual work performed after scheduled shift end
  const potentialOvertimeMinutes =
    input.scheduledEnd && lastOut && lastOut.getTime() > input.scheduledEnd.getTime()
      ? minutesBetween(input.scheduledEnd, lastOut)
      : 0;

  return {
    firstIn,
    lastOut,
    breakMinutes,
    totalWorkMinutes,
    netWorkMinutes,
    lateMinutes,
    earlyDepartureMinutes,
    scheduledDurationMinutes,
    potentialOvertimeMinutes,
    status,
  };
}

export interface BreakInterval {
  start: Date;
  end: Date | null;
  durationMinutes: number;
}

export type BreakStatus = "not_started" | "on_break" | "completed";

export interface BreakSummary {
  allowedMinutes: number;
  completedMinutes: number;
  activeMinutes: number;
  activeElapsedSeconds: number;
  totalUsedMinutes: number;
  remainingMinutes: number;
  isExceeded: boolean;
  exceededMinutes: number;
  status: BreakStatus;
  activeBreakStart: Date | null;
  intervals: BreakInterval[];
}

export function calculateBreakSummary(input: {
  punches: Array<{
    type?: string;
    punchType?: string;
    at?: Date | string;
    punchedAt?: Date | string;
  }>;
  allowedBreakMinutes: number;
  now?: Date;
}): BreakSummary {
  const now = input.now ?? new Date();
  const allowedMinutes = Math.max(0, input.allowedBreakMinutes ?? 0);

  // Normalize and sort punches chronologically
  const normalized = (input.punches || [])
    .map((p) => {
      const type = (p.punchType || p.type || "") as PunchType;
      const rawAt = p.punchedAt || p.at;
      const at = rawAt instanceof Date ? rawAt : rawAt ? new Date(rawAt) : null;
      return { type, at };
    })
    .filter((p): p is { type: PunchType; at: Date } => p.at !== null && !isNaN(p.at.getTime()))
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const intervals: BreakInterval[] = [];
  let completedMinutes = 0;
  let currentBreakStart: Date | null = null;

  for (const punch of normalized) {
    if (punch.type === "break_start") {
      if (!currentBreakStart) {
        currentBreakStart = punch.at;
      }
    } else if (punch.type === "break_end") {
      if (currentBreakStart) {
        const duration = minutesBetween(currentBreakStart, punch.at);
        intervals.push({
          start: currentBreakStart,
          end: punch.at,
          durationMinutes: duration,
        });
        completedMinutes += duration;
        currentBreakStart = null;
      }
    }
  }

  let activeBreakStart: Date | null = null;
  let activeMinutes = 0;
  let activeElapsedSeconds = 0;

  if (currentBreakStart) {
    activeBreakStart = currentBreakStart;
    activeElapsedSeconds = Math.max(0, Math.floor((now.getTime() - currentBreakStart.getTime()) / 1000));
    activeMinutes = minutesBetween(currentBreakStart, now);
    intervals.push({
      start: currentBreakStart,
      end: null,
      durationMinutes: activeMinutes,
    });
  }

  const totalUsedMinutes = completedMinutes + activeMinutes;
  const remainingMinutes = Math.max(0, allowedMinutes - totalUsedMinutes);
  const isExceeded = totalUsedMinutes > allowedMinutes;
  const exceededMinutes = Math.max(0, totalUsedMinutes - allowedMinutes);

  let status: BreakStatus = "not_started";
  if (activeBreakStart !== null) {
    status = "on_break";
  } else if (completedMinutes > 0) {
    status = "completed";
  }

  return {
    allowedMinutes,
    completedMinutes,
    activeMinutes,
    activeElapsedSeconds,
    totalUsedMinutes,
    remainingMinutes,
    isExceeded,
    exceededMinutes,
    status,
    activeBreakStart,
    intervals,
  };
}
