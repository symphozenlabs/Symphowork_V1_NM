import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import {
  createDepartmentTeam,
  listDepartmentTeams,
} from "@/modules/departments/service";
import { departmentTeamInputSchema } from "@/modules/departments/validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ departmentId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { departmentId } = await context.params;
    const teams = await listDepartmentTeams(
      tenant.organization.id,
      tenant.user.id,
      departmentId
    );

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ departmentId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { departmentId } = await context.params;
    const body = await request.json();
    const validatedInput = departmentTeamInputSchema.parse(body);

    const team = await createDepartmentTeam(
      tenant.organization.id,
      tenant.user.id,
      departmentId,
      validatedInput
    );

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
