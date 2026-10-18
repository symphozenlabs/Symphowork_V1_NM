import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { attendancePolicies, attendancePunches, attendanceRecords, organizations, shifts } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorizeAny } from "@/modules/tenancy/authorization";
import { calculateAttendance, shiftWindow } from "@/modules/attendance/calculator";
import type { PunchType } from "@/modules/attendance/types";
import { getOrEnsureEmployeeForUser } from "@/modules/employees/service";

function localDateInTimezone(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function employeeForUser(organizationId: string, userId: string) {
  return getOrEnsureEmployeeForUser(organizationId, userId);
}

export async function recordPunch(input: {
  organizationId: string;
  userId: string;
  type: PunchType;
  employeeId?: string;
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

  const now = new Date();
  const workDate = localDateInTimezone(organization.timezone);

  return db.transaction(async (tx) => {
    // 1. Look up today's record for this employee
    let [record] = await tx
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.organizationId, input.organizationId),
          eq(attendanceRecords.employeeId, employee.id),
          eq(attendanceRecords.attendanceDate, workDate)
        )
      );

    // If no record exists for today and this is a non-clock_in punch, check for an open overnight shift record
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

    // Validation 1: Prevent duplicate clock in for the same work date
    if (input.type === "clock_in" && record?.actualFirstIn) {
      throw new AppError("VALIDATION_ERROR", "You are already clocked in for this work date.", 409);
    }

    // Validation 2: Actions when not clocked in yet
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

    const [employeeShift] = employee.shiftId
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

    if (!record) {
      const window = shiftWindow(
        workDate,
        employeeShift.startTime,
        employeeShift.endTime,
        employeeShift.overnight
      );
      [record] = await tx
        .insert(attendanceRecords)
        .values({
          organizationId: input.organizationId,
          employeeId: employee.id,
          attendanceDate: workDate,
          shiftId: employeeShift.id,
          scheduledStart: window.start,
          scheduledEnd: window.end,
          status: "scheduled",
        })
        .returning();
    }

    const punches = await tx
      .select()
      .from(attendancePunches)
      .where(eq(attendancePunches.attendanceId, record.id))
      .orderBy(asc(attendancePunches.punchedAt));

    // Authoritative break state calculation from ordered punch events
    let activeBreak = false;
    for (const p of punches) {
      if (p.punchType === "break_start") activeBreak = true;
      else if (p.punchType === "break_end") activeBreak = false;
    }

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
