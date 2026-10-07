import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db, type DbTransaction } from "@/db/client";
import { departments, designations, employeeHistory, employees, employmentTypes, locations, memberships, onboarding, onboardingChecklistItems, organizations, roles, shifts, teams, users } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { assertEmployeeStatusTransition, assertNoSelfReporting } from "@/modules/employees/lifecycle";
import type { EmployeeInput } from "@/modules/employees/validation";

export async function createEmployee(organizationId: string, actorUserId: string, input: EmployeeInput) {
  await authorize({ organizationId, permission: "employee.create" });
  assertNoSelfReporting("new", input.reportingManagerId);
  const result = await db.transaction(async (tx) => {
    if (input.personalEmail && input.personalEmail.trim() !== "") {
      const emailToMatch = input.personalEmail.trim().toLowerCase();
      const [existing] = await tx
        .select({ id: employees.id })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organizationId),
            sql`lower(${employees.personalEmail}) = ${emailToMatch}`
          )
        );
      if (existing) {
        throw new AppError("VALIDATION_ERROR", "An employee with this email already exists in this organization.", 409);
      }
    }
    const [organization] = await tx.update(organizations).set({ employeeIdNext: sql`${organizations.employeeIdNext} + 1`, updatedAt: new Date() }).where(eq(organizations.id, organizationId)).returning({ prefix: organizations.employeeIdPrefix, next: organizations.employeeIdNext, padding: organizations.employeeIdPadding });
    if (!organization) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);
    if (input.reportingManagerId) { const [manager] = await tx.select({ id: employees.id }).from(employees).where(and(eq(employees.id, input.reportingManagerId), eq(employees.organizationId, organizationId))); if (!manager) throw new AppError("VALIDATION_ERROR", "Reporting manager does not belong to this organization.", 400); }
    for (const [id, table, label] of [[input.departmentId, departments, "Department"], [input.designationId, designations, "Designation"], [input.employmentTypeId, employmentTypes, "Employment type"], [input.locationId, locations, "Location"], [input.shiftId, shifts, "Shift"], [input.teamId, teams, "Team"]] as const) if (id) { const [row] = await tx.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.organizationId, organizationId))); if (!row) throw new AppError("VALIDATION_ERROR", `${label} does not belong to this organization.`, 400); }
    const number = organization.next - 1;
    const employeeId = `${organization.prefix}${String(number).padStart(organization.padding, "0")}`;
    const displayName = [input.firstName, input.middleName, input.lastName].filter(Boolean).join(" ");
    const [employee] = await tx.insert(employees).values({ organizationId, employeeId, firstName: input.firstName, middleName: input.middleName || undefined, lastName: input.lastName, displayName, personalEmail: input.personalEmail?.trim() || undefined, workEmail: input.workEmail?.trim() || undefined, phone: input.phone || undefined, joiningDate: input.joiningDate || undefined, employmentTypeId: input.employmentTypeId, departmentId: input.departmentId, designationId: input.designationId, reportingManagerId: input.reportingManagerId, teamId: input.teamId, locationId: input.locationId, shiftId: input.shiftId, status: input.status }).returning();
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

export async function getOrEnsureEmployeeForUser(
  organizationId: string,
  userId: string,
  executor?: DbTransaction | typeof db,
  context?: { user?: typeof users.$inferSelect; roleKey?: string; membership?: typeof memberships.$inferSelect }
) {
  const client = executor ?? db;

  // 1. Direct match by organizationId and userId
  const [existing] = (await client
    .select()
    .from(employees)
    .where(and(eq(employees.organizationId, organizationId), eq(employees.userId, userId)))) ?? [];
  if (existing) return existing;

  // 2. Fetch user identity
  const user = context?.user ?? (await client.query.users?.findFirst({ where: eq(users.id, userId) })) ?? (await client.select().from(users).where(eq(users.id, userId)))[0];
  if (!user) throw new AppError("NOT_FOUND", "User was not found.", 404);

  // 3. Fetch active membership
  const membership = context?.membership ?? (await client.query.memberships?.findFirst({
    where: and(
      eq(memberships.organizationId, organizationId),
      eq(memberships.userId, userId),
      eq(memberships.status, "active")
    ),
  })) ?? (await client.select().from(memberships).where(
    and(
      eq(memberships.organizationId, organizationId),
      eq(memberships.userId, userId),
      eq(memberships.status, "active")
    )
  ))[0];
  if (!membership) throw new AppError("FORBIDDEN", "User does not have an active membership in this organization.", 403);

  // 4. Check if an unlinked employee record exists with matching email
  const [byEmail] = await client
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, organizationId),
        or(eq(employees.workEmail, user.email), eq(employees.personalEmail, user.email)),
        isNull(employees.userId)
      )
    );
  if (byEmail) {
    const [linked] = await client
      .update(employees)
      .set({ userId: user.id, status: "active", updatedAt: new Date() })
      .where(eq(employees.id, byEmail.id))
      .returning();
    return linked;
  }

  // 5. Verify if role is eligible for auto-provisioning (ORGANIZATION_OWNER)
  let roleKey = context?.roleKey;
  if (!roleKey) {
    const role = (await client.query.roles?.findFirst({ where: eq(roles.id, membership.roleId) })) ?? (await client.select().from(roles).where(eq(roles.id, membership.roleId)))[0];
    roleKey = role?.key;
  }
  const isOwner = roleKey === "ORGANIZATION_OWNER";

  if (!isOwner) {
    throw new AppError("NOT_FOUND", "Your employee profile is not linked.", 404);
  }

  // 6. Safe creation using organization counter
  const runCreation = async (tx: DbTransaction | typeof db) => {
    // Re-check in case another request concurrently created it
    const [raceExisting] = await tx
      .select()
      .from(employees)
      .where(and(eq(employees.organizationId, organizationId), eq(employees.userId, userId)));
    if (raceExisting) return raceExisting;

    const [organization] = await tx
      .update(organizations)
      .set({ employeeIdNext: sql`${organizations.employeeIdNext} + 1`, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))
      .returning({
        prefix: organizations.employeeIdPrefix,
        next: organizations.employeeIdNext,
        padding: organizations.employeeIdPadding,
      });
    if (!organization) throw new AppError("ORG_NOT_FOUND", "Organization was not found.", 404);

    const number = organization.next - 1;
    const employeeId = `${organization.prefix}${String(number).padStart(organization.padding, "0")}`;
    const nameParts = (user.fullName || "Admin User").trim().split(/\s+/);
    const firstName = nameParts[0] || "Admin";
    const lastName = nameParts.slice(1).join(" ") || "User";
    const displayName = user.fullName?.trim() || `${firstName} ${lastName}`;

    const [created] = await tx
      .insert(employees)
      .values({
        organizationId,
        userId: user.id,
        employeeId,
        firstName,
        lastName,
        displayName,
        workEmail: user.email,
        status: "active",
      })
      .returning();

    const [onboard] = await tx
      .insert(onboarding)
      .values({
        organizationId,
        employeeId: created.id,
        status: "completed",
        completedAt: new Date(),
      })
      .returning();

    await tx.insert(onboardingChecklistItems).values([
      { organizationId, onboardingId: onboard.id, title: "Complete profile", status: "completed", completedAt: new Date(), sortOrder: 1 },
      { organizationId, onboardingId: onboard.id, title: "Verify contact details", status: "completed", completedAt: new Date(), sortOrder: 2 },
      { organizationId, onboardingId: onboard.id, title: "HR review", status: "completed", completedAt: new Date(), sortOrder: 3 },
    ]);

    await tx.insert(employeeHistory).values({
      organizationId,
      employeeId: created.id,
      eventType: "admin_provisioned",
      newValue: JSON.stringify({ status: created.status, employeeId: created.employeeId }),
      actorUserId: user.id,
    });

    await recordAudit({
      actorUserId: user.id,
      organizationId,
      action: "employee_profile_auto_provisioned",
      resource: "employee",
      resourceId: created.id,
      metadata: { role: roleKey, employeeId: created.employeeId },
    });

    return created;
  };

  if (executor) {
    return runCreation(executor);
  }
  return db.transaction(runCreation);
}
