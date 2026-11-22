import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { attendancePunches, attendanceRecords, employees, shifts } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { getOrEnsureEmployeeForUser } from "@/modules/employees/service";
import { calculateBreakSummary } from "@/modules/attendance/calculator";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "attendance.read" });
    const callerEmployee = await getOrEnsureEmployeeForUser(tenant.organization.id, tenant.user.id);
    const url = new URL(request.url);
    const targetEmployeeId = url.searchParams.get("employeeId");
    const date = url.searchParams.get("date");

    let effectiveEmployee = callerEmployee;
    if (targetEmployeeId && targetEmployeeId !== callerEmployee.id && targetEmployeeId !== callerEmployee.employeeId) {
      const isPrivileged =
        tenant.role?.key === "ORGANIZATION_OWNER" ||
        tenant.role?.key === "HR_ADMIN" ||
        tenant.role?.key === "HR_EXECUTIVE";

      if (!isPrivileged) {
        throw new AppError("FORBIDDEN", "You are not authorized to view attendance records for other employees.", 403);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetEmployeeId);
      const matchCondition = isUuid
        ? or(eq(employees.id, targetEmployeeId), eq(employees.employeeId, targetEmployeeId))
        : eq(employees.employeeId, targetEmployeeId);

      const [targetEmp] = await db
        .select()
        .from(employees)
        .where(
          and(
            matchCondition,
            eq(employees.organizationId, tenant.organization.id)
          )
        );

      if (!targetEmp) {
        throw new AppError("NOT_FOUND", "Employee not found in this organization.", 404);
      }
      effectiveEmployee = targetEmp;
    }

    const records = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.organizationId, tenant.organization.id),
          eq(attendanceRecords.employeeId, effectiveEmployee.id),
          ...(date ? [eq(attendanceRecords.attendanceDate, date)] : [])
        )
      )
      .orderBy(desc(attendanceRecords.attendanceDate))
      .limit(50);

    const now = new Date();
    const updatedRecords = await Promise.all(
      records.map(async (rec) => {
        if (
          rec.actualFirstIn &&
          !rec.actualLastOut &&
          rec.scheduledEnd &&
          now.getTime() <= rec.scheduledEnd.getTime() &&
          rec.status === "missing_punch"
        ) {
          const activeStatus = rec.lateMinutes > 0 ? "late" : "present";
          await db
            .update(attendanceRecords)
            .set({ status: activeStatus, updatedAt: new Date() })
            .where(eq(attendanceRecords.id, rec.id));
          return { ...rec, status: activeStatus };
        }
        return rec;
      })
    );

    const punches = updatedRecords[0]
      ? await db
          .select()
          .from(attendancePunches)
          .where(eq(attendancePunches.attendanceId, updatedRecords[0].id))
          .orderBy(attendancePunches.punchedAt)
      : [];

    const [assignedShift] = effectiveEmployee.shiftId
      ? await db
          .select()
          .from(shifts)
          .where(
            and(
              eq(shifts.id, effectiveEmployee.shiftId),
              eq(shifts.organizationId, tenant.organization.id)
            )
          )
      : [];

    const breakSummary = calculateBreakSummary({
      punches,
      allowedBreakMinutes: assignedShift?.breakMinutes ?? 0,
      now,
    });

    const recordsWithMetrics = updatedRecords.map((rec) => {
      const scheduledDurationMinutes =
        rec.scheduledStart && rec.scheduledEnd
          ? Math.max(0, Math.round((new Date(rec.scheduledEnd).getTime() - new Date(rec.scheduledStart).getTime()) / 60000))
          : 0;
      const potentialOvertimeMinutes =
        rec.scheduledEnd && rec.actualLastOut && new Date(rec.actualLastOut).getTime() > new Date(rec.scheduledEnd).getTime()
          ? Math.max(0, Math.round((new Date(rec.actualLastOut).getTime() - new Date(rec.scheduledEnd).getTime()) / 60000))
          : 0;

      return {
        ...rec,
        scheduledDurationMinutes,
        potentialOvertimeMinutes,
      };
    });

    return NextResponse.json({
      success: true,
      records: recordsWithMetrics,
      punches,
      breakSummary,
      timezone: tenant.organization.timezone || "UTC",
      hasShift: Boolean(assignedShift),
      shift: assignedShift
        ? {
            id: assignedShift.id,
            name: assignedShift.name,
            code: assignedShift.code,
            startTime: assignedShift.startTime,
            endTime: assignedShift.endTime,
            overnight: assignedShift.overnight,
            breakMinutes: assignedShift.breakMinutes,
            graceMinutes: assignedShift.graceMinutes,
          }
        : null,
      employee: {
        id: effectiveEmployee.id,
        displayName: effectiveEmployee.displayName,
        employeeId: effectiveEmployee.employeeId,
        shiftId: effectiveEmployee.shiftId,
        isSelf: effectiveEmployee.id === callerEmployee.id,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

