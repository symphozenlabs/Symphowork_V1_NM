import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { createDepartment, listDepartmentsWithMetrics } from "@/modules/departments/service";
import { departmentInputSchema, departmentQuerySchema } from "@/modules/departments/validation";

export async function GET(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) {
      throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || undefined;
    const validatedQuery = departmentQuerySchema.parse({ date: dateParam });

    const result = await listDepartmentsWithMetrics(
      tenant.organization.id,
      tenant.user.id,
      validatedQuery.date
    );

    return NextResponse.json({ success: true, ...result });
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
      validatedInput
    );

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
