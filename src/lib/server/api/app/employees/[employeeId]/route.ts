import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { getEmployeeDetails, updateEmployee } from "@/modules/employees/service";
import { employeeInputSchema } from "@/modules/employees/validation";
import { tenantApiRead } from "@/lib/server/tenant-api-read";
import { tenantApiWrite } from "@/lib/server/tenant-api-write";

export async function GET(_request: Request, context: { params: { employeeId: string } }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    await authorize({ organizationId: tenant.organization.id, permission: "employee.read" });
    const { employeeId } = context.params;
    const organizationId = tenant.organization.id;
    const employee = await tenantApiRead(tenant, (tx) => getEmployeeDetails(organizationId, employeeId, tx));
    if (!employee) throw new AppError("NOT_FOUND", "Employee was not found.", 404);
    return Response.json({ success: true, employee });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: { employeeId: string } }) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const { employeeId } = context.params;
    const changes = employeeInputSchema.partial().parse(await request.json());
    const employee = await tenantApiWrite(tenant, (tx) =>
      updateEmployee(tenant.organization!.id, tenant.user.id, employeeId, changes, tx)
    );
    return Response.json({ success: true, employee });
  } catch (error) {
    return errorResponse(error);
  }
}

