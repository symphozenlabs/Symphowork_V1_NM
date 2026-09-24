import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { attendancePolicies, attendancePunches, attendanceRecords, employees, organizations, shifts } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { calculateAttendance, shiftWindow } from "@/modules/attendance/calculator";
import type { PunchType } from "@/modules/attendance/types";

function localDateInTimezone(timezone: string) { return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
async function employeeForUser(organizationId: string, userId: string) { const [employee] = await db.select().from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.userId, userId))); if (!employee) throw new AppError("NOT_FOUND", "Your employee profile is not linked.", 404); return employee; }

export async function recordPunch(input: { organizationId: string; userId: string; type: PunchType }) {
  const permission = input.type === "clock_in" ? "attendance.clockin" : input.type === "clock_out" ? "attendance.clockout" : "attendance.break";
  await authorize({ organizationId: input.organizationId, permission });
  const employee = await employeeForUser(input.organizationId, input.userId); const [organization] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)); if (!organization) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);
  const now = new Date(); const workDate = localDateInTimezone(organization.timezone);
  return db.transaction(async (tx) => {
    let [record] = input.type === "clock_in" ? await tx.select().from(attendanceRecords).where(and(eq(attendanceRecords.organizationId, input.organizationId), eq(attendanceRecords.employeeId, employee.id), eq(attendanceRecords.attendanceDate, workDate))) : await tx.select().from(attendanceRecords).where(and(eq(attendanceRecords.organizationId, input.organizationId), eq(attendanceRecords.employeeId, employee.id), isNull(attendanceRecords.actualLastOut))).orderBy(desc(attendanceRecords.attendanceDate)).limit(1);
    if (input.type === "clock_in" && record?.actualFirstIn) throw new AppError("VALIDATION_ERROR", "You are already clocked in for this work date.", 409);
    if (input.type === "clock_out" && (!record || !record.actualFirstIn)) throw new AppError("VALIDATION_ERROR", "Clock in before clocking out.", 400);
    const [employeeShift] = employee.shiftId ? await tx.select().from(shifts).where(and(eq(shifts.id, employee.shiftId), eq(shifts.organizationId, input.organizationId))) : [];
    if (!employeeShift) throw new AppError("VALIDATION_ERROR", "No shift is assigned to your employee profile.", 422);
    if (!record) { const window = shiftWindow(workDate, employeeShift.startTime, employeeShift.endTime, employeeShift.overnight); [record] = await tx.insert(attendanceRecords).values({ organizationId: input.organizationId, employeeId: employee.id, attendanceDate: workDate, shiftId: employeeShift.id, scheduledStart: window.start, scheduledEnd: window.end, status: "scheduled" }).returning(); }
    const punches = await tx.select().from(attendancePunches).where(eq(attendancePunches.attendanceId, record.id)).orderBy(asc(attendancePunches.punchedAt));
    const activeBreak = punches.some((p) => p.punchType === "break_start") && !punches.some((p) => p.punchType === "break_end");
    if (input.type === "break_start" && (!record.actualFirstIn || activeBreak)) throw new AppError("VALIDATION_ERROR", activeBreak ? "A break is already active." : "Clock in before starting a break.", 400);
    if (input.type === "break_end" && !activeBreak) throw new AppError("VALIDATION_ERROR", "There is no active break.", 400);
    if (input.type === "clock_out" && record.actualLastOut) throw new AppError("VALIDATION_ERROR", "You are already clocked out.", 409);
    await tx.insert(attendancePunches).values({ organizationId: input.organizationId, employeeId: employee.id, attendanceId: record.id, punchType: input.type, punchedAt: now });
    const allPunches = [...punches, { punchType: input.type, punchedAt: now }].map((p) => ({ type: p.punchType, at: p.punchedAt }));
    const [policy] = await tx.select().from(attendancePolicies).where(and(eq(attendancePolicies.organizationId, input.organizationId), eq(attendancePolicies.active, true)));
    const calculated = calculateAttendance({ scheduledStart: record.scheduledStart, scheduledEnd: record.scheduledEnd, punches: allPunches, gracePeriodMinutes: policy?.gracePeriodMinutes ?? 0, earlyDepartureThresholdMinutes: policy?.earlyDepartureThresholdMinutes ?? 0 });
    const [updated] = await tx.update(attendanceRecords).set({ actualFirstIn: calculated.firstIn, actualLastOut: calculated.lastOut, totalWorkMinutes: calculated.totalWorkMinutes, totalBreakMinutes: calculated.breakMinutes, netWorkMinutes: calculated.netWorkMinutes, lateMinutes: calculated.lateMinutes, earlyDepartureMinutes: calculated.earlyDepartureMinutes, status: calculated.status, updatedAt: new Date() }).where(eq(attendanceRecords.id, record.id)).returning();
    await recordAudit({ actorUserId: input.userId, organizationId: input.organizationId, action: input.type, resource: "attendance_record", resourceId: record.id }); return updated;
  });
}
