import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { departments } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { authorize } from "@/modules/tenancy/authorization";
import { createDepartment } from "@/modules/departments/service";
import { departmentInputSchema } from "@/modules/departments/validation";

export async function GET() {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) return NextResponse.json({ success: true, items: [] });
    await authorize({ organizationId: tenant.organization.id, permission: "department.read" });
    return NextResponse.json({
      success: true,
      items: await db.select().from(departments).where(eq(departments.organizationId, tenant.organization.id)),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const body = await request.json();
    const validatedInput = departmentInputSchema.parse(body);
    const item = await createDepartment(tenant.organization.id, tenant.user.id, validatedInput);
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

