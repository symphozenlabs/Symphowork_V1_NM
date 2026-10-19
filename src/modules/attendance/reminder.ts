import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  attendanceRecords,
  holidays,
  leaveApplications,
  memberships,
  organizations,
  roles,
  shifts,
  workingDays,
} from "@/db/schema";
import { resolveShiftWindowAndWorkDate } from "@/modules/attendance/calculator";
import { getOrEnsureEmployeeForUser } from "@/modules/employees/service";
import { createNotification } from "@/modules/notifications/service";

export interface AttendanceReminderCheckResult {
  eligible: boolean;
  completed?: boolean;
  required?: boolean;
  exempt?: boolean;
  reason?: string;
  holidayName?: string;
  workDate?: string;
  shift?: {
    id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    overnight: boolean;
  };
}

export async function checkAndEnsureAttendanceReminder(params: {
  organizationId: string;
  userId: string;
  checkTime?: Date;
}): Promise<AttendanceReminderCheckResult> {
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, params.organizationId));

  if (!organization) {
    return { eligible: false, reason: "org_not_found" };
  }

  // 1. Check user membership & role: Organization Owner is exempt from mandatory attendance punch reminders
  const [membershipRow] = await db
    .select({ roleKey: roles.key })
    .from(memberships)
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .where(
      and(
        eq(memberships.organizationId, params.organizationId),
        eq(memberships.userId, params.userId),
        eq(memberships.status, "active")
      )
    );

  if (!membershipRow) {
    return { eligible: false, reason: "no_active_membership" };
  }

  if (membershipRow.roleKey === "ORGANIZATION_OWNER") {
    return { eligible: false, reason: "organization_owner_exempt" };
  }

  // 2. Fetch employee profile and assigned shift
  const employee = await getOrEnsureEmployeeForUser(params.organizationId, params.userId).catch(() => null);
  if (!employee || (employee.status && employee.status !== "active")) {
    return { eligible: false, reason: "inactive_or_missing_employee" };
  }

  if (!employee.shiftId) {
    return { eligible: false, reason: "no_shift_assigned" };
  }

  const [assignedShift] = await db
    .select()
    .from(shifts)
    .where(
      and(
        eq(shifts.id, employee.shiftId),
        eq(shifts.organizationId, params.organizationId),
        eq(shifts.status, "active")
      )
    );

  if (!assignedShift) {
    return { eligible: false, reason: "no_active_shift" };
  }

  const timezone = organization.timezone || "UTC";
  const now = params.checkTime ?? new Date();

  // 3. Resolve workDate and shift timing
  const shiftTiming = resolveShiftWindowAndWorkDate({
    now,
    timezone,
    shift: {
      startTime: assignedShift.startTime,
      endTime: assignedShift.endTime,
      overnight: assignedShift.overnight,
    },
  });
  const workDate = shiftTiming.workDate;

  // 4. Check exemptions for workDate
  // a) Public or company holiday
  const [holiday] = await db
    .select({ name: holidays.name })
    .from(holidays)
    .where(
      and(
        eq(holidays.organizationId, params.organizationId),
        eq(holidays.holidayDate, workDate),
        eq(holidays.status, "active")
      )
    )
    .limit(1);

  if (holiday) {
    return { eligible: false, exempt: true, reason: "holiday", holidayName: holiday.name };
  }

  // b) Weekly rest day / weekend
  const dateObj = new Date(`${workDate}T12:00:00Z`);
  const dayOfWeek = dateObj.getUTCDay(); // 0: Sunday ... 6: Saturday
  const [workingDayRow] = await db
    .select({ isWorkingDay: workingDays.isWorkingDay })
    .from(workingDays)
    .where(
      and(
        eq(workingDays.organizationId, params.organizationId),
        eq(workingDays.dayOfWeek, dayOfWeek)
      )
    )
    .limit(1);

  if (workingDayRow && !workingDayRow.isWorkingDay) {
    return { eligible: false, exempt: true, reason: "weekly_off" };
  }

  // c) Approved leave covering workDate
  const [approvedLeave] = await db
    .select({ id: leaveApplications.id })
    .from(leaveApplications)
    .where(
      and(
        eq(leaveApplications.organizationId, params.organizationId),
        eq(leaveApplications.employeeId, employee.id),
        eq(leaveApplications.status, "approved"),
        lte(leaveApplications.startDate, workDate),
        gte(leaveApplications.endDate, workDate)
      )
    )
    .limit(1);

  if (approvedLeave) {
    return { eligible: false, exempt: true, reason: "approved_leave" };
  }

  // 5. Check attendance record for workDate
  const [record] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.organizationId, params.organizationId),
        eq(attendanceRecords.employeeId, employee.id),
        eq(attendanceRecords.attendanceDate, workDate)
      )
    )
    .limit(1);

  if (record?.actualFirstIn) {
    return { eligible: true, completed: true, workDate };
  }

  // 6. Attendance required and incomplete -> create/ensure persistent reminder notification
  const idempotencyKey = `attendance:daily_reminder:${employee.id}:${workDate}`;
  const shiftDisplay = `${assignedShift.startTime.slice(0, 5)} – ${assignedShift.endTime.slice(0, 5)}`;

  await createNotification({
    organizationId: params.organizationId,
    recipientUserId: params.userId,
    category: "attendance",
    type: "attendance.daily_reminder",
    title: "Daily Attendance Reminder",
    message: `You have not recorded attendance for your assigned shift today (${assignedShift.name}: ${shiftDisplay}). Please clock in to record your workday.`,
    actionUrl: "/app/attendance",
    idempotencyKey,
  });

  return {
    eligible: true,
    completed: false,
    required: true,
    workDate,
    shift: {
      id: assignedShift.id,
      name: assignedShift.name,
      code: assignedShift.code,
      startTime: assignedShift.startTime,
      endTime: assignedShift.endTime,
      overnight: assignedShift.overnight,
    },
  };
}
