import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { assertIsOrganizationOwner, checkDepartmentDeletionSafety } from "@/modules/departments/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ departmentId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    await assertIsOrganizationOwner(tenant.organization.id, tenant.user.id);
    const { departmentId } = await context.params;

    const safety = await checkDepartmentDeletionSafety(tenant.organization.id, departmentId);
    return NextResponse.json({ success: true, ...safety });
  } catch (error) {
    return errorResponse(error);
  }
}
