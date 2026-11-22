import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import {
  exportOrganizationAttendanceCsv,
  getOrganizationAttendanceDashboard,
} from "@/modules/attendance/organization-dashboard";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    // Server-side authorization check: attendance.read permission
    await authorize({
      organizationId: tenant.organization.id,
      permission: "attendance.read",
    });

    // Enforce role-based access: ORGANIZATION_OWNER, HR_ADMIN, or HR_EXECUTIVE
    const privilegedRoles = new Set(["ORGANIZATION_OWNER", "HR_ADMIN", "HR_EXECUTIVE"]);
    const callerRoleKey = tenant.role?.key;

    if (!callerRoleKey || !privilegedRoles.has(callerRoleKey)) {
      throw new AppError(
        "FORBIDDEN",
        "You are not authorized to view organization-wide attendance data.",
        403
      );
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const departmentId = url.searchParams.get("departmentId") || undefined;
    const shiftId = url.searchParams.get("shiftId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const page = url.searchParams.get("page") ? Number(url.searchParams.get("page")) : 1;
    const pageSize = url.searchParams.get("pageSize")
      ? Number(url.searchParams.get("pageSize"))
      : 25;
    const isExport =
      url.searchParams.get("export") === "true" ||
      url.searchParams.get("format") === "csv";

    // For CSV exports, get all records up to 1000
    const effectivePageSize = isExport ? 1000 : pageSize;

    const data = await getOrganizationAttendanceDashboard({
      organizationId: tenant.organization.id,
      actorRoleKey: callerRoleKey,
      date,
      search,
      departmentId,
      shiftId,
      status,
      page: isExport ? 1 : page,
      pageSize: effectivePageSize,
    });

    if (isExport) {
      const csv = exportOrganizationAttendanceCsv(data.employees, data.timezone);
      const filename = `attendance-${data.date}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
