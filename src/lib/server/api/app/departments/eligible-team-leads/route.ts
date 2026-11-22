import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { listEligibleTeamLeads } from "@/modules/departments/service";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId") || undefined;

    const teamLeads = await listEligibleTeamLeads(tenant.organization.id, departmentId);
    return NextResponse.json({ success: true, teamLeads, leads: teamLeads });
  } catch (error) {
    return errorResponse(error);
  }
}
