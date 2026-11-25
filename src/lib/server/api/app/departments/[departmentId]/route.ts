import { withTenantTransaction } from "@/db/client";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import {
  deleteDepartment,
  getDepartmentDetails,
  updateDepartment,
} from "@/modules/departments/service";
import { departmentQuerySchema, departmentUpdateSchema } from "@/modules/departments/validation";
import { tenantApiRead } from "@/lib/server/tenant-api-read";

export async function GET(
  request: Request,
  context: { params: { departmentId: string } }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { departmentId } = context.params;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || undefined;
    const validatedQuery = departmentQuerySchema.parse({ date: dateParam });

    const organizationId = tenant.organization.id;
    const department = await tenantApiRead(tenant, (tx) => {
      if (tx) {
        return getDepartmentDetails(organizationId, tenant.user.id, departmentId, validatedQuery.date, tx);
      }
      return withTenantTransaction(organizationId, (transaction) =>
        getDepartmentDetails(organizationId, tenant.user.id, departmentId, validatedQuery.date, transaction)
      );
    });

    return Response.json({ success: true, department });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: { departmentId: string } }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { departmentId } = context.params;
    const body = await request.json();
    const validatedInput = departmentUpdateSchema.parse(body);

    const department = await updateDepartment(
      tenant.organization.id,
      tenant.user.id,
      departmentId,
      validatedInput
    );

    return Response.json({ success: true, department });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: { departmentId: string } }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { departmentId } = context.params;
    const { searchParams } = new URL(request.url);
    const forceSoft = searchParams.get("mode") === "soft";

    const result = await deleteDepartment(
      tenant.organization.id,
      tenant.user.id,
      departmentId,
      forceSoft
    );

    return Response.json({ ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
