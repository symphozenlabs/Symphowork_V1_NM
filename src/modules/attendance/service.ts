import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  attendancePolicies,
  attendancePunches,
  attendanceRecords,
  employees,
  holidays,
  leaveApplications,
  notifications,
  organizations,
  shifts,
  workingDays,
} from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorizeAny } from "@/modules/tenancy/authorization";
import {
  calculateAttendance,
  localDateInTimezone,
  resolveShiftWindowAndWorkDate,
  shiftWindow,
} from "@/modules/attendance/calculator";
import type { PunchType } from "@/modules/attendance/types";
import { getOrEnsureEmployeeForUser } from "@/modules/employees/service";

async function employeeForUser(organizationId: string, userId: string) {
  return getOrEnsureEmployeeForUser(organizationId, userId);
}

export async function recordPunch(input: {
  organizationId: string;
  userId: string;
  type: PunchType;
  employeeId?: string;
  punchTime?: Date;
}) {
  const permission =
    input.type === "clock_in"
      ? "attendance.clockin"
      : input.type === "clock_out"
        ? "attendance.clockout"
        : "attendance.break";

  await authorizeAny({
    organizationId: input.organizationId,
    permissions: [permission, "attendance.manage"],
  });

  const [employee, [organization]] = await Promise.all([
    employeeForUser(input.organizationId, input.userId),
    db.select().from(organizations).where(eq(organizations.id, input.organizationId)),
  ]);

  if (!organization) {
    throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);
  }

  if (employee && employee.status && employee.status !== "active") {
    throw new AppError("FORBIDDEN", "Active employee profile is required to record attendance.", 403);
  }

  if (input.employeeId && employee && input.employeeId !== employee.id) {
    throw new AppError("FORBIDDEN", "You are not authorized to record attendance punches for other employees.", 403);
  }

  const now = input.punchTime ?? new Date();
  const timezone = organization.timezone || "UTC";

  return db.transaction(async (tx) => {
    const [employeeShift] = employee?.shiftId
      ? await tx
          .select()
          .from(shifts)
          .where(
            and(
              eq(shifts.id, employee.shiftId),
              eq(shifts.organizationId, input.organizationId)
            )
          )
      : [];

    if (!employeeShift) {
      throw new AppError("VALIDATION_ERROR", "No shift is assigned to your employee profile.", 422);
    }

    const shiftTiming = resolveShiftWindowAndWorkDate({
      now,
      timezone,
      shift: {
        startTime: employeeShift.startTime,
        endTime: employeeShift.endTime,
        overnight: employeeShift.overnight,
      },
    });

    const shiftDisplay = `${employeeShift.startTime.slice(0, 5)} – ${employeeShift.endTime.slice(0, 5)}`;

    // 1. Look up today's record for this employee
    let [record] = await tx
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.organizationId, input.organizationId),
          eq(attendanceRecords.employeeId, employee.id),
          eq(attendanceRecords.attendanceDate, shiftTiming.workDate)
        )
      );

    // If no record exists for that workDate and this is a non-clock_in punch, check for an open record
    if (!record && input.type !== "clock_in") {
      [record] = await tx
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.organizationId, input.organizationId),
            eq(attendanceRecords.employeeId, employee.id),
            isNull(attendanceRecords.actualLastOut)
          )
        )
        .orderBy(desc(attendanceRecords.attendanceDate))
        .limit(1);
    }

    // Validation 1: Clock in timing and duplicate rules
    if (input.type === "clock_in") {
      if (record?.actualFirstIn) {
        throw new AppError("VALIDATION_ERROR", "You are already clocked in for this work date.", 409);
      }

      if (shiftTiming.isBeforeStart) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Cannot clock in before shift start time (${employeeShift.startTime.slice(0, 5)}). Assigned shift window is ${shiftDisplay}.`,
          400
        );
      }

      if (shiftTiming.isAfterEnd) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Cannot clock in after shift end time (${employeeShift.endTime.slice(0, 5)}). Assigned shift window is ${shiftDisplay}.`,
          400
        );
      }

      if (!shiftTiming.isWithinWindow) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Cannot clock in outside your assigned shift window (${shiftDisplay}).`,
          400
        );
      }
    }

    // Validation 2: Actions when not clocked in yet or already clocked out
    if (input.type !== "clock_in") {
      if (!record || !record.actualFirstIn) {
        if (input.type === "clock_out") {
          throw new AppError("VALIDATION_ERROR", "Clock in before clocking out.", 400);
        }
        if (input.type === "break_start") {
          throw new AppError("VALIDATION_ERROR", "Clock in before starting a break.", 400);
        }
        if (input.type === "break_end") {
          throw new AppError("VALIDATION_ERROR", "There is no active break.", 400);
        }
      }

      // Validation 3: Actions after shift is already completed
      if (record?.actualLastOut) {
        if (input.type === "clock_out") {
          throw new AppError("VALIDATION_ERROR", "You are already clocked out.", 409);
        }
        throw new AppError("VALIDATION_ERROR", "Shift attendance is already completed.", 400);
      }
    }

    const punches = record
      ? await tx
          .select()
          .from(attendancePunches)
          .where(eq(attendancePunches.attendanceId, record.id))
          .orderBy(asc(attendancePunches.punchedAt))
      : [];

    // Authoritative break state calculation from ordered punch events
    let activeBreak = false;
    for (const p of punches) {
      if (p.punchType === "break_start") activeBreak = true;
      else if (p.punchType === "break_end") activeBreak = false;
    }

    if (input.type !== "clock_in") {
      // Validation 4: Break sequence rules
      if (input.type === "break_start" && activeBreak) {
        throw new AppError("VALIDATION_ERROR", "A break is already active.", 400);
      }
      if (input.type === "break_end" && !activeBreak) {
        throw new AppError("VALIDATION_ERROR", "There is no active break.", 400);
      }

      // Validation 5: Prevent clocking out while an active break is ongoing
      if (input.type === "clock_out" && activeBreak) {
        throw new AppError("VALIDATION_ERROR", "End active break before clocking out.", 400);
      }

      // Timing validation for non-clock_in actions against shift window
      const effectiveWindowStart = record?.scheduledStart ?? shiftTiming.window.start;
      const effectiveWindowEnd = record?.scheduledEnd ?? shiftTiming.window.end;

      if (now.getTime() < effectiveWindowStart.getTime()) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Cannot record ${input.type.replaceAll("_", " ")} before shift start time (${employeeShift.startTime.slice(0, 5)}). Assigned shift window is ${shiftDisplay}.`,
          400
        );
      }

      // Permit clock_out and ending an active break after scheduled shift end.
      // Break start is restricted to within the assigned shift window.
      if (now.getTime() > effectiveWindowEnd.getTime()) {
        if (input.type === "break_start") {
          throw new AppError(
            "VALIDATION_ERROR",
            `Cannot record break start outside assigned shift window (${shiftDisplay}). Shift ended.`,
            400
          );
        }
      }
    }

    if (!record) {
      [record] = await tx
        .insert(attendanceRecords)
        .values({
          organizationId: input.organizationId,
          employeeId: employee.id,
          attendanceDate: shiftTiming.workDate,
          shiftId: employeeShift.id,
          scheduledStart: shiftTiming.window.start,
          scheduledEnd: shiftTiming.window.end,
          status: "scheduled",
        })
        .returning();
    }

    await tx.insert(attendancePunches).values({
      organizationId: input.organizationId,
      employeeId: employee.id,
      attendanceId: record.id,
      punchType: input.type,
      punchedAt: now,
    });

    const allPunches = [
      ...punches,
      { punchType: input.type, punchedAt: now },
    ].map((p) => ({
      type: p.punchType as PunchType,
      at: p.punchedAt,
    }));

    const [policy] = await tx
      .select()
      .from(attendancePolicies)
      .where(
        and(
          eq(attendancePolicies.organizationId, input.organizationId),
          eq(attendancePolicies.active, true)
        )
      );

    const calculated = calculateAttendance({
      scheduledStart: record.scheduledStart,
      scheduledEnd: record.scheduledEnd,
      punches: allPunches,
      gracePeriodMinutes: policy?.gracePeriodMinutes ?? 0,
      earlyDepartureThresholdMinutes: policy?.earlyDepartureThresholdMinutes ?? 0,
      now,
    });

    const [updated] = await tx
      .update(attendanceRecords)
      .set({
        actualFirstIn: calculated.firstIn,
        actualLastOut: calculated.lastOut,
        totalWorkMinutes: calculated.totalWorkMinutes,
        totalBreakMinutes: calculated.breakMinutes,
        netWorkMinutes: calculated.netWorkMinutes,
        lateMinutes: calculated.lateMinutes,
        earlyDepartureMinutes: calculated.earlyDepartureMinutes,
        status: calculated.status,
        updatedAt: new Date(),
      })
      .where(eq(attendanceRecords.id, record.id))
      .returning();

    // If clock_in, resolve any daily attendance reminder notification for this employee and work date
    if (input.type === "clock_in") {
      await tx
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.organizationId, input.organizationId),
            eq(notifications.recipientUserId, input.userId),
            eq(notifications.idempotencyKey, `attendance:daily_reminder:${employee.id}:${shiftTiming.workDate}`),
            isNull(notifications.readAt)
          )
        );
    }

    await recordAudit({
      actorUserId: input.userId,
      organizationId: input.organizationId,
      action: input.type,
      resource: "attendance_record",
      resourceId: record.id,
    });

    return updated;
  });
}

export async function processDailyAttendanceAbsences(input: {
  organizationId: string;
  actorUserId: string;
  targetDate?: string;
}) {
  await authorizeAny({
    organizationId: input.organizationId,
    permissions: ["attendance.manage"],
  });

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, input.organizationId));
  if (!organization) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);

  const timezone = organization.timezone || "UTC";
  const now = new Date();
  const dateToProcess = input.targetDate ?? localDateInTimezone(timezone, now);

  // 1. Check if dateToProcess is a working day
  const dayOfWeek = new Date(`${dateToProcess}T00:00:00Z`).getUTCDay();
  const workingDayRows = await db
    .select()
    .from(workingDays)
    .where(eq(workingDays.organizationId, input.organizationId));
  const workingDayMap = new Map(workingDayRows.map((r) => [r.dayOfWeek, r.isWorkingDay]));
  if (workingDayMap.size > 0 && workingDayMap.get(dayOfWeek) === false) {
    return {
      success: true,
      processedDate: dateToProcess,
      status: "skipped_weekend",
      message: `${dateToProcess} is configured as a non-working day.`,
      absentCount: 0,
      missingPunchCount: 0,
      totalChecked: 0,
    };
  }

  // 2. Check if dateToProcess is a holiday
  const holidayRows = await db
    .select()
    .from(holidays)
    .where(
      and(
        eq(holidays.organizationId, input.organizationId),
        eq(holidays.holidayDate, dateToProcess),
        eq(holidays.status, "active")
      )
    );
  if (holidayRows.length > 0) {
    return {
      success: true,
      processedDate: dateToProcess,
      status: "skipped_holiday",
      message: `${dateToProcess} is a designated company holiday (${holidayRows[0].name}).`,
      absentCount: 0,
      missingPunchCount: 0,
      totalChecked: 0,
    };
  }

  // 3. Get active employees in this organization
  const activeEmployees = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, input.organizationId),
        inArray(employees.status, ["active", "probation", "confirmed", "notice_period"])
      )
    );

  // 4. Get shifts for this organization
  const allShifts = await db
    .select()
    .from(shifts)
    .where(eq(shifts.organizationId, input.organizationId));
  const shiftById = new Map(allShifts.map((s) => [s.id, s]));

  // 5. Get approved leaves covering dateToProcess
  const approvedLeaves = await db
    .select()
    .from(leaveApplications)
    .where(
      and(
        eq(leaveApplications.organizationId, input.organizationId),
        eq(leaveApplications.status, "approved"),
        lte(leaveApplications.startDate, dateToProcess),
        gte(leaveApplications.endDate, dateToProcess)
      )
    );
  const employeeLeaveSet = new Set(approvedLeaves.map((l) => l.employeeId));

  let absentCount = 0;
  let missingPunchCount = 0;
  let skippedShiftNotEndedCount = 0;
  let skippedAlreadyRecordedCount = 0;
  let skippedOnLeaveCount = 0;

  for (const emp of activeEmployees) {
    // If employee is on approved leave, skip (do not mark absent)
    if (employeeLeaveSet.has(emp.id)) {
      skippedOnLeaveCount++;
      continue;
    }

    // Determine shift
    const shift = emp.shiftId ? shiftById.get(emp.shiftId) : allShifts[0];
    if (!shift) continue;

    // Check shift end time for dateToProcess in organization timezone
    const window = shiftWindow(dateToProcess, shift.startTime, shift.endTime, shift.overnight, timezone);

    // CRITICAL SAFETY RULE: Never mark employees absent before their applicable shift has ended!
    if (now.getTime() < window.end.getTime()) {
      skippedShiftNotEndedCount++;
      continue;
    }

    // Check existing attendance record for (emp.id, dateToProcess)
    const [existingRecord] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.organizationId, input.organizationId),
          eq(attendanceRecords.employeeId, emp.id),
          eq(attendanceRecords.attendanceDate, dateToProcess)
        )
      );

    if (existingRecord) {
      // If employee clocked in:
      if (existingRecord.actualFirstIn) {
        if (!existingRecord.actualLastOut && existingRecord.status !== "missing_punch") {
          // Incomplete punch after shift end -> update to missing_punch
          await db
            .update(attendanceRecords)
            .set({ status: "missing_punch", updatedAt: new Date() })
            .where(eq(attendanceRecords.id, existingRecord.id));
          missingPunchCount++;
        } else {
          skippedAlreadyRecordedCount++;
        }
        continue;
      }

      // If record exists with no actualFirstIn (e.g. "scheduled")
      if (existingRecord.status !== "absent") {
        await db
          .update(attendanceRecords)
          .set({
            status: "absent",
            totalWorkMinutes: 0,
            netWorkMinutes: 0,
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            updatedAt: new Date(),
          })
          .where(eq(attendanceRecords.id, existingRecord.id));
        absentCount++;
      } else {
        skippedAlreadyRecordedCount++;
      }
    } else {
      // No attendance record at all -> insert absent record
      await db.insert(attendanceRecords).values({
        organizationId: input.organizationId,
        employeeId: emp.id,
        attendanceDate: dateToProcess,
        shiftId: shift.id,
        scheduledStart: window.start,
        scheduledEnd: window.end,
        totalWorkMinutes: 0,
        netWorkMinutes: 0,
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        status: "absent",
      });
      absentCount++;
    }
  }

  await recordAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: "attendance_absences_processed",
    resource: "attendance_record",
    metadata: {
      date: dateToProcess,
      absentCount,
      missingPunchCount,
      skippedShiftNotEndedCount,
      skippedOnLeaveCount,
      totalChecked: activeEmployees.length,
    },
  });

  return {
    success: true,
    processedDate: dateToProcess,
    totalChecked: activeEmployees.length,
    absentCount,
    missingPunchCount,
    skippedShiftNotEndedCount,
    skippedOnLeaveCount,
    skippedAlreadyRecordedCount,
  };
}
