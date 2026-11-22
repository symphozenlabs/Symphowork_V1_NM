import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { checkAndEnsureAttendanceReminder } from "@/modules/attendance/reminder";

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const result = await checkAndEnsureAttendanceReminder({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
