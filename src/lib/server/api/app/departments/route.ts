import { withTenantTransaction } from "@/db/client";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { createDepartment, listDepartmentsWithMetrics } from "@/modules/departments/service";
import { departmentInputSchema, departmentQuerySchema } from "@/modules/departments/validation";
import { tenantApiRead } from "@/lib/server/tenant-api-read";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || undefined;
    const validatedQuery = departmentQuerySchema.parse({ date: dateParam });

    const organizationId = tenant.organization.id;
    const result = await tenantApiRead(tenant, (tx) => {
      if (tx) {
        return listDepartmentsWithMetrics(organizationId, tenant.user.id, validatedQuery.date, tx);
      }
      return withTenantTransaction(organizationId, (transaction) =>
        listDepartmentsWithMetrics(organizationId, tenant.user.id, validatedQuery.date, transaction)
      );
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const body = await request.json();
    const validatedInput = departmentInputSchema.parse(body);

    const department = await createDepartment(
      tenant.organization.id,
      tenant.user.id,
      validatedInput as import("@/modules/departments/types").DepartmentInput
    );

    return Response.json({ success: true, department }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
