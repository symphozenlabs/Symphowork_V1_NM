import type { PunchType } from "@/modules/attendance/types";
export type ShiftWindow = { start: Date; end: Date };
export type Punch = { type: PunchType; at: Date };
type AttendanceCalculationStatus = "present" | "late" | "early_departure" | "late_and_early" | "missing_punch";
export function shiftWindow(workDate: string, startTime: string, endTime: string, overnight: boolean): ShiftWindow { const start = new Date(`${workDate}T${startTime}Z`); const end = new Date(`${overnight || endTime <= startTime ? nextDate(workDate) : workDate}T${endTime}Z`); return { start, end }; }
function nextDate(date: string) { const next = new Date(`${date}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1); return next.toISOString().slice(0, 10); }
export function minutesBetween(start: Date | null, end: Date | null) { return start && end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : 0; }
export function calculateAttendance(input: { scheduledStart: Date | null; scheduledEnd: Date | null; punches: Punch[]; gracePeriodMinutes: number; earlyDepartureThresholdMinutes: number }) {
  const ordered = [...input.punches].sort((a, b) => a.at.getTime() - b.at.getTime());
  const firstIn = ordered.find((p) => p.type === "clock_in")?.at ?? null;
  const lastOut = [...ordered].reverse().find((p) => p.type === "clock_out")?.at ?? null;
  let breakMinutes = 0; let breakStart: Date | null = null;
  for (const punch of ordered) { if (punch.type === "break_start" && !breakStart) breakStart = punch.at; if (punch.type === "break_end" && breakStart) { breakMinutes += minutesBetween(breakStart, punch.at); breakStart = null; } }
  const totalWorkMinutes = minutesBetween(firstIn, lastOut); const netWorkMinutes = Math.max(0, totalWorkMinutes - breakMinutes); const lateMinutes = input.scheduledStart && firstIn ? Math.max(0, minutesBetween(input.scheduledStart, firstIn) - input.gracePeriodMinutes) : 0; const earlyDepartureMinutes = input.scheduledEnd && lastOut ? Math.max(0, minutesBetween(lastOut, input.scheduledEnd) - input.earlyDepartureThresholdMinutes) : 0;
  const status: AttendanceCalculationStatus = !firstIn ? "missing_punch" : !lastOut ? "missing_punch" : lateMinutes > 0 && earlyDepartureMinutes > 0 ? "late_and_early" : lateMinutes > 0 ? "late" : earlyDepartureMinutes > 0 ? "early_departure" : "present";
  return { firstIn, lastOut, breakMinutes, totalWorkMinutes, netWorkMinutes, lateMinutes, earlyDepartureMinutes, status };
}
