import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import {
  deleteDepartmentTeam,
  updateDepartmentTeam,
} from "@/modules/departments/service";
import { departmentTeamUpdateSchema } from "@/modules/departments/validation";

export async function PATCH(
  request: Request,
  context: { params: { departmentId: string; teamId: string } }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { departmentId, teamId } = context.params;
    const body = await request.json();
    const validatedInput = departmentTeamUpdateSchema.parse(body);

    const team = await updateDepartmentTeam(
      tenant.organization.id,
      tenant.user.id,
      departmentId,
      teamId,
      validatedInput
    );

    return Response.json({ success: true, team });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { departmentId: string; teamId: string } }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { departmentId, teamId } = context.params;

    const result = await deleteDepartmentTeam(
      tenant.organization.id,
      tenant.user.id,
      departmentId,
      teamId
    );

    return Response.json({ ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
