import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { updatePresence, getPresenceForEmployees } from "@/modules/collaboration/service";
import { parseBody, updatePresenceSchema } from "@/modules/collaboration/validation";

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }
    const body = parseBody(updatePresenceSchema, await request.json().catch(() => ({})));

    const presence = await updatePresence({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      status: body.status,
    });

    return NextResponse.json({
      success: true,
      presence,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }
    const url = new URL(request.url);
    const employeeIdsParam = url.searchParams.get("employeeIds");
    const employeeIds = employeeIdsParam
      ? employeeIdsParam.split(",").map((id) => id.trim()).filter(Boolean)
      : [];

    const presence = await getPresenceForEmployees({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      employeeIds,
    });

    return NextResponse.json({
      success: true,
      presence,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
