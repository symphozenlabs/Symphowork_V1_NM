import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { processDailyAttendanceAbsences } from "@/modules/attendance/service";

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);

    let date: string | undefined;
    try {
      const body = (await request.json()) as { date?: string };
      date = body?.date;
    } catch {
      // Body is optional
    }

    const result = await processDailyAttendanceAbsences({
      organizationId: tenant.organization.id,
      actorUserId: tenant.user.id,
      targetDate: date,
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
