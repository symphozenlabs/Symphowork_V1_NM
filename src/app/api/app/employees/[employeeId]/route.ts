import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employees } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { updateEmployee } from "@/modules/employees/service";
import { employeeInputSchema } from "@/modules/employees/validation";
export async function GET(_request: Request, context: { params: Promise<{ employeeId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { employeeId } = await context.params; const [employee] = await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.organizationId, tenant.organization.id))); if (!employee) throw new AppError("NOT_FOUND", "Employee was not found.", 404); return NextResponse.json({ success: true, employee }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, context: { params: Promise<{ employeeId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { employeeId } = await context.params; const changes = employeeInputSchema.partial().parse(await request.json()); const employee = await updateEmployee(tenant.organization.id, tenant.user.id, employeeId, changes); return NextResponse.json({ success: true, employee }); } catch (error) { return errorResponse(error); } }
