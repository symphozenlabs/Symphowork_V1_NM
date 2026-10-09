import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { employeeSalaryAssignments, employees, salaryStructures } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { assignSalaryStructure } from "@/modules/payroll/service";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => { try { return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); await authorize({ organizationId: tenant.organization.id, permission: "payroll.configure" }); return { success: true, assignments: await db.select({ assignment: employeeSalaryAssignments, employeeName: employees.displayName, structureName: salaryStructures.name }).from(employeeSalaryAssignments).innerJoin(employees, eq(employeeSalaryAssignments.employeeId, employees.id)).innerJoin(salaryStructures, eq(employeeSalaryAssignments.structureId, salaryStructures.id)).where(eq(employeeSalaryAssignments.organizationId, tenant.organization.id)).orderBy(desc(employeeSalaryAssignments.effectiveFrom)) }; })); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const body = await event.request.json() as { employeeId?: string; structureId?: string; effectiveFrom?: string; effectiveTo?: string; revisionReason?: string; notes?: string }; if (!body.employeeId || !body.structureId || !body.effectiveFrom) throw new AppError("VALIDATION_ERROR", "Employee, structure, and effective start date are required.", 400); return Response.json(await withSvelteRequestUser(event, async (user) => { const tenant = await resolveTenantContextForUser(user); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); return { success: true, assignment: await assignSalaryStructure({ organizationId: tenant.organization.id, userId: user.id, ...body } as Parameters<typeof assignSalaryStructure>[0]) }; }), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
