import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { departments, designations, employeeHistory, employees, employmentTypes, locations, onboarding, onboardingChecklistItems, organizations, shifts, teams } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { assertEmployeeStatusTransition, assertNoSelfReporting } from "@/modules/employees/lifecycle";
import type { EmployeeInput } from "@/modules/employees/validation";

export async function createEmployee(organizationId: string, actorUserId: string, input: EmployeeInput) {
  await authorize({ organizationId, permission: "employee.create" });
  assertNoSelfReporting("new", input.reportingManagerId);
  const result = await db.transaction(async (tx) => {
    const [organization] = await tx.update(organizations).set({ employeeIdNext: sql`${organizations.employeeIdNext} + 1`, updatedAt: new Date() }).where(eq(organizations.id, organizationId)).returning({ prefix: organizations.employeeIdPrefix, next: organizations.employeeIdNext, padding: organizations.employeeIdPadding });
    if (!organization) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);
    if (input.reportingManagerId) { const [manager] = await tx.select({ id: employees.id }).from(employees).where(and(eq(employees.id, input.reportingManagerId), eq(employees.organizationId, organizationId))); if (!manager) throw new AppError("VALIDATION_ERROR", "Reporting manager does not belong to this organization.", 400); }
    for (const [id, table, label] of [[input.departmentId, departments, "Department"], [input.designationId, designations, "Designation"], [input.employmentTypeId, employmentTypes, "Employment type"], [input.locationId, locations, "Location"], [input.shiftId, shifts, "Shift"], [input.teamId, teams, "Team"]] as const) if (id) { const [row] = await tx.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.organizationId, organizationId))); if (!row) throw new AppError("VALIDATION_ERROR", `${label} does not belong to this organization.`, 400); }
    const number = organization.next - 1;
    const employeeId = `${organization.prefix}${String(number).padStart(organization.padding, "0")}`;
    const displayName = [input.firstName, input.middleName, input.lastName].filter(Boolean).join(" ");
    const [employee] = await tx.insert(employees).values({ organizationId, employeeId, firstName: input.firstName, middleName: input.middleName || undefined, lastName: input.lastName, displayName, personalEmail: input.personalEmail || undefined, workEmail: input.workEmail || undefined, phone: input.phone || undefined, joiningDate: input.joiningDate || undefined, employmentTypeId: input.employmentTypeId, departmentId: input.departmentId, designationId: input.designationId, reportingManagerId: input.reportingManagerId, teamId: input.teamId, locationId: input.locationId, shiftId: input.shiftId, status: input.status }).returning();
    const [onboard] = await tx.insert(onboarding).values({ organizationId, employeeId: employee.id, status: input.status === "invited" ? "invited" : "not_started" }).returning();
    await tx.insert(onboardingChecklistItems).values([
      { organizationId, onboardingId: onboard.id, title: "Complete profile", sortOrder: 1 },
      { organizationId, onboardingId: onboard.id, title: "Verify contact details", sortOrder: 2 },
      { organizationId, onboardingId: onboard.id, title: "HR review", sortOrder: 3 },
    ]);
    await tx.insert(employeeHistory).values({ organizationId, employeeId: employee.id, eventType: "joining", newValue: JSON.stringify({ status: employee.status, employeeId: employee.employeeId }), actorUserId });
    return { employee, onboarding: onboard };
  });
  await recordAudit({ actorUserId, organizationId, action: "employee_created", resource: "employee", resourceId: result.employee.id, metadata: { employeeId: result.employee.employeeId } });
  return result;
}

export async function listEmployees(organizationId: string, query: { search?: string; status?: string; page?: number; pageSize?: number }) {
  await authorize({ organizationId, permission: "employee.read" });
  const page = Math.max(query.page ?? 1, 1); const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 100); const filters = [eq(employees.organizationId, organizationId)];
  if (query.status) filters.push(eq(employees.status, query.status as typeof employees.status.enumValues[number]));
  if (query.search) filters.push(or(ilike(employees.employeeId, `%${query.search}%`), ilike(employees.displayName, `%${query.search}%`), ilike(employees.workEmail, `%${query.search}%`))!);
  const rows = await db.select().from(employees).where(and(...filters)).orderBy(desc(employees.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  return { rows, page, pageSize };
}

export async function updateEmployee(organizationId: string, actorUserId: string, employeeId: string, changes: Partial<EmployeeInput>) {
  await authorize({ organizationId, permission: "employee.update" });
  const [current] = await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.organizationId, organizationId)));
  if (!current) throw new AppError("NOT_FOUND", "Employee was not found.", 404);
  if (changes.reportingManagerId !== undefined) { assertNoSelfReporting(employeeId, changes.reportingManagerId); if (changes.reportingManagerId) { const [manager] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.id, changes.reportingManagerId), eq(employees.organizationId, organizationId))); if (!manager) throw new AppError("VALIDATION_ERROR", "Reporting manager does not belong to this organization.", 400); } }
  if (changes.status && changes.status !== current.status) assertEmployeeStatusTransition(current.status, changes.status);
  const displayName = changes.firstName || changes.middleName || changes.lastName ? [changes.firstName ?? current.firstName, changes.middleName ?? current.middleName, changes.lastName ?? current.lastName].filter(Boolean).join(" ") : current.displayName;
  const [updated] = await db.update(employees).set({ ...changes, displayName, updatedAt: new Date() }).where(eq(employees.id, employeeId)).returning();
  await db.insert(employeeHistory).values({ organizationId, employeeId, eventType: "employee_updated", previousValue: JSON.stringify(current), newValue: JSON.stringify(updated), actorUserId });
  await recordAudit({ actorUserId, organizationId, action: "employee_updated", resource: "employee", resourceId: employeeId });
  return updated;
}
