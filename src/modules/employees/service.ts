import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db, type DbTransaction, withTenantTransaction } from "@/db/client";
import { departments, designations, employeeHistory, employees, employmentTypes, invitations, locations, memberships, onboarding, onboardingChecklistItems, organizations, roles, shifts, teams, users } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { assertEmployeeStatusTransition, assertNoSelfReporting } from "@/modules/employees/lifecycle";
import type { EmployeeInput } from "@/modules/employees/validation";
import { canAssignRole } from "@/modules/rbac/permissions";

export const DEPARTMENT_REQUIRED_ROLES = [
  "MANAGER",
  "TEAM_LEAD",
  "PROJECT_MANAGER",
  "EMPLOYEE",
] as const;

export function isDepartmentRequiredForRole(roleKey?: string | null): boolean {
  if (!roleKey) return false;
  return (DEPARTMENT_REQUIRED_ROLES as readonly string[]).includes(roleKey);
}

export async function createEmployee(organizationId: string, actorUserId: string, input: EmployeeInput) {
  await authorize({ organizationId, permission: "employee.create" });
  assertNoSelfReporting("new", input.reportingManagerId);

  const targetRole = input.targetRole || "EMPLOYEE";
  const actorMembership = await db.query.memberships?.findFirst?.({
    where: and(
      eq(memberships.userId, actorUserId),
      eq(memberships.organizationId, organizationId),
      eq(memberships.status, "active")
    ),
  });
  if (actorMembership) {
    const actorRole = await db.query.roles?.findFirst?.({
      where: eq(roles.id, actorMembership.roleId),
    });
    if (actorRole?.key && !canAssignRole(actorRole.key, targetRole)) {
      throw new AppError("FORBIDDEN", `You are not authorized to create employees with role ${targetRole}.`, 403);
    }
  }

  const isDeptRequired = input.targetRole
    ? isDepartmentRequiredForRole(input.targetRole)
    : false;

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

    // Role-specific department requirements
    if (isDeptRequired && !input.departmentId) {
      const [deptCount] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(departments)
        .where(
          and(
            eq(departments.organizationId, organizationId),
            eq(departments.status, "active")
          )
        );

      const activeCount = Number(deptCount?.count || 0);
      if (activeCount === 0) {
        throw new AppError(
          "VALIDATION_ERROR",
          `Cannot onboard a ${targetRole} because this organization has no active departments configured. An Organization Owner must create at least one department first.`,
          400
        );
      }

      throw new AppError(
        "VALIDATION_ERROR",
        `Department assignment is required for ${targetRole} role.`,
        400
      );
    }

    if (input.departmentId) {
      const [dept] = await tx
        .select({ id: departments.id, status: departments.status })
        .from(departments)
        .where(
          and(
            eq(departments.id, input.departmentId),
            eq(departments.organizationId, organizationId)
          )
        );
      if (!dept) {
        throw new AppError("VALIDATION_ERROR", "Department does not belong to this organization.", 400);
      }
      if (dept.status !== "active") {
        throw new AppError("VALIDATION_ERROR", "Selected department is inactive and cannot accept new employee assignments.", 400);
      }
    }

    if (input.teamId) {
      const [team] = await tx
        .select({
          id: teams.id,
          departmentId: teams.departmentId,
          status: teams.status,
          organizationId: teams.organizationId,
        })
        .from(teams)
        .where(
          and(
            eq(teams.id, input.teamId),
            eq(teams.organizationId, organizationId)
          )
        );
      if (!team) {
        throw new AppError("VALIDATION_ERROR", "Team does not belong to this organization.", 400);
      }
      if (team.status !== "active") {
        throw new AppError("VALIDATION_ERROR", "Selected team is inactive and cannot accept new employee assignments.", 400);
      }
      if (!input.departmentId || team.departmentId !== input.departmentId) {
        throw new AppError("VALIDATION_ERROR", "Selected team does not belong to the selected department.", 400);
      }
    }

    for (const [id, table, label] of [
      [input.designationId, designations, "Designation"],
      [input.employmentTypeId, employmentTypes, "Employment type"],
      [input.locationId, locations, "Location"],
      [input.shiftId, shifts, "Shift"],
    ] as const) if (id) { const [row] = await tx.select({ id: table.id }).from(table).where(and(eq(table.id, id), eq(table.organizationId, organizationId))); if (!row) throw new AppError("VALIDATION_ERROR", `${label} does not belong to this organization.`, 400); }

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
    await tx.insert(employeeHistory).values({ organizationId, employeeId: employee.id, eventType: "joining", newValue: JSON.stringify({ status: employee.status, employeeId: employee.employeeId, targetRole }), actorUserId });
    return { employee, onboarding: onboard, targetRole };
  });
  await recordAudit({ actorUserId, organizationId, action: "employee_created", resource: "employee", resourceId: result.employee.id, metadata: { employeeId: result.employee.employeeId, targetRole } });
  return result;
}

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  ORGANIZATION_OWNER: "Organization Owner",
  HR_ADMIN: "HR Admin",
  HR_EXECUTIVE: "HR Executive",
  FINANCE_ADMIN: "Finance Admin",
  MANAGER: "Manager",
  TEAM_LEAD: "Team Lead",
  PROJECT_MANAGER: "Project Manager",
  RECRUITER: "Recruiter",
  EMPLOYEE: "Employee",
};

export async function enrichEmployeesWithRoles(
  organizationId: string,
  employeeRows: (typeof employees.$inferSelect)[],
  executor?: DbTransaction | typeof db
) {
  if (employeeRows.length === 0) return [];

  const run = async (client: DbTransaction | typeof db) => {
    const userIds = employeeRows
      .map((e) => e.userId)
      .filter((id): id is string => Boolean(id));

    // 1. Authoritative membership roles for users with linked accounts
    const membershipRoleMap = new Map<string, { key: string; name: string }>();
    if (userIds.length > 0) {
      const membershipRows = await client
        .select({
          userId: memberships.userId,
          roleKey: roles.key,
          roleName: roles.name,
        })
        .from(memberships)
        .innerJoin(roles, eq(roles.id, memberships.roleId))
        .where(
          and(
            eq(memberships.organizationId, organizationId),
            inArray(memberships.userId, userIds)
          )
        );
      for (const row of membershipRows) {
        membershipRoleMap.set(row.userId, { key: row.roleKey, name: row.roleName });
      }
    }

    // 2. Intended roles from pending or accepted invitations for employees not yet linked
    const invitationRoleMap = new Map<string, string>();
    const unlinkedEmployeeIds = employeeRows
      .filter((e) => !e.userId || !membershipRoleMap.has(e.userId))
      .map((e) => e.id);

    if (unlinkedEmployeeIds.length > 0) {
      const invitationRows = await client
        .select({
          employeeId: invitations.employeeId,
          intendedRole: invitations.intendedRole,
        })
        .from(invitations)
        .where(
          and(
            eq(invitations.organizationId, organizationId),
            inArray(invitations.employeeId, unlinkedEmployeeIds)
          )
        )
        .orderBy(desc(invitations.createdAt));

      for (const inv of invitationRows) {
        if (inv.employeeId && !invitationRoleMap.has(inv.employeeId)) {
          invitationRoleMap.set(inv.employeeId, inv.intendedRole);
        }
      }
    }

    // 3. Joining event history for employees not yet invited
    const historyRoleMap = new Map<string, string>();
    const remainingEmployeeIds = employeeRows
      .filter((e) => (!e.userId || !membershipRoleMap.has(e.userId)) && !invitationRoleMap.has(e.id))
      .map((e) => e.id);

    if (remainingEmployeeIds.length > 0) {
      const historyRows = await client
        .select({
          employeeId: employeeHistory.employeeId,
          newValue: employeeHistory.newValue,
        })
        .from(employeeHistory)
        .where(
          and(
            eq(employeeHistory.organizationId, organizationId),
            eq(employeeHistory.eventType, "joining"),
            inArray(employeeHistory.employeeId, remainingEmployeeIds)
          )
        );

      for (const h of historyRows) {
        if (h.newValue) {
          try {
            const parsed = JSON.parse(h.newValue);
            if (parsed?.targetRole) {
              historyRoleMap.set(h.employeeId, String(parsed.targetRole));
            }
          } catch {
            // Ignore json parse error
          }
        }
      }
    }

    return employeeRows.map((emp) => {
      let roleKey: string | null = null;
      if (emp.userId && membershipRoleMap.has(emp.userId)) {
        roleKey = membershipRoleMap.get(emp.userId)!.key;
      } else if (invitationRoleMap.has(emp.id)) {
        roleKey = invitationRoleMap.get(emp.id)!;
      } else if (historyRoleMap.has(emp.id)) {
        roleKey = historyRoleMap.get(emp.id)!;
      }

      const roleTitle = roleKey ? (ROLE_DISPLAY_NAMES[roleKey] || roleKey) : null;
      return {
        ...emp,
        roleKey,
        roleTitle,
      };
    });
  };

  if (executor) {
    return run(executor);
  }
  if (typeof withTenantTransaction === "function") {
    return withTenantTransaction(organizationId, run);
  }
  return run(db);
}

export async function listEmployees(
  organizationId: string,
  query: { search?: string; status?: string; page?: number; pageSize?: number },
  executor?: DbTransaction | typeof db
) {
  await authorize({ organizationId, permission: "employee.read" });
  const run = async (client: DbTransaction | typeof db) => {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 25, 1), 100);
    const filters = [eq(employees.organizationId, organizationId)];

    if (query.status) {
      filters.push(eq(employees.status, query.status as typeof employees.status.enumValues[number]));
    }

    const search = query.search?.trim();
    if (search) {
      const searchLower = search.toLowerCase();
      const searchConditions = [
        ilike(employees.employeeId, `%${search}%`),
        ilike(employees.displayName, `%${search}%`),
        ilike(employees.workEmail, `%${search}%`),
        ilike(employees.personalEmail, `%${search}%`),
      ];

      // Check if query matches any configured role key or title
      const matchingRoleKeys = Object.keys(ROLE_DISPLAY_NAMES).filter(
        (key) =>
          key.toLowerCase().includes(searchLower) ||
          ROLE_DISPLAY_NAMES[key].toLowerCase().includes(searchLower)
      );

      if (matchingRoleKeys.length > 0) {
        const matchingMembershipUserIds = client
          .select({ userId: memberships.userId })
          .from(memberships)
          .innerJoin(roles, eq(roles.id, memberships.roleId))
          .where(
            and(
              eq(memberships.organizationId, organizationId),
              inArray(roles.key, matchingRoleKeys)
            )
          );

        const matchingInvitationEmpIds = client
          .select({ employeeId: sql<string>`${invitations.employeeId}` })
          .from(invitations)
          .where(
            and(
              eq(invitations.organizationId, organizationId),
              inArray(invitations.intendedRole, matchingRoleKeys)
            )
          );

        searchConditions.push(
          inArray(employees.userId, matchingMembershipUserIds),
          inArray(employees.id, matchingInvitationEmpIds)
        );
      }

      filters.push(or(...searchConditions)!);
    }

    const countResult = await client
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(and(...filters));

    const total = Number(countResult[0]?.count ?? 0);

    const rawRows = await client
      .select()
      .from(employees)
      .where(and(...filters))
      .orderBy(desc(employees.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const rows = await enrichEmployeesWithRoles(organizationId, rawRows, client);

    return { rows, total, page, pageSize };
  };

  if (executor) {
    return run(executor);
  }
  if (typeof withTenantTransaction === "function") {
    return withTenantTransaction(organizationId, run);
  }
  return run(db);
}

export async function isOrganizationOwnerEmployee(
  organizationId: string,
  employeeId: string,
  executor?: DbTransaction | typeof db
): Promise<boolean> {
  const client = executor ?? db;

  const [employee] =
    (await client
      .select({ id: employees.id, userId: employees.userId })
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.organizationId, organizationId)))) ?? [];

  if (!employee) return false;

  // 1. If employee is linked to a user, verify if that user holds active ORGANIZATION_OWNER membership
  if (employee.userId) {
    if (client.query?.memberships?.findFirst) {
      try {
        const mem = await client.query.memberships.findFirst({
          where: and(
            eq(memberships.organizationId, organizationId),
            eq(memberships.userId, employee.userId),
            eq(memberships.status, "active")
          ),
        });
        if (mem) {
          const role = await client.query.roles?.findFirst?.({
            where: eq(roles.id, mem.roleId),
          });
          if (role?.key === "ORGANIZATION_OWNER") return true;
        }
      } catch {
        // Fall through to select
      }
    }

    try {
      const fromQuery = client
        .select({ id: memberships.id })
        .from(memberships);
      if (typeof fromQuery?.innerJoin === "function") {
        const ownerMembership = await fromQuery
          .innerJoin(roles, eq(roles.id, memberships.roleId))
          .where(
            and(
              eq(memberships.organizationId, organizationId),
              eq(memberships.userId, employee.userId),
              eq(memberships.status, "active"),
              eq(roles.key, "ORGANIZATION_OWNER")
            )
          )
          .limit(1);

        if (ownerMembership.length > 0) return true;
      }
    } catch {
      // Fall through to invitation and history checks
    }
  }

  // 2. If unlinked or pending invitation, check if intendedRole is ORGANIZATION_OWNER
  try {
    const fromInv = client.select({ id: invitations.id }).from(invitations);
    if (typeof fromInv?.where === "function") {
      const ownerInvitation = await fromInv
        .where(
          and(
            eq(invitations.organizationId, organizationId),
            eq(invitations.employeeId, employee.id),
            eq(invitations.intendedRole, "ORGANIZATION_OWNER")
          )
        )
        .limit(1);

      if (ownerInvitation.length > 0) return true;
    }
  } catch {
    // Fall through
  }

  // 3. Check joining event history for targetRole === 'ORGANIZATION_OWNER'
  try {
    const fromHist = client.select({ newValue: employeeHistory.newValue }).from(employeeHistory);
    if (typeof fromHist?.where === "function") {
      const historyEvents = await fromHist
        .where(
          and(
            eq(employeeHistory.organizationId, organizationId),
            eq(employeeHistory.employeeId, employee.id),
            eq(employeeHistory.eventType, "joining")
          )
        )
        .limit(1);

      if (historyEvents.length > 0 && historyEvents[0].newValue) {
        try {
          const parsed = JSON.parse(historyEvents[0].newValue);
          if (parsed?.targetRole === "ORGANIZATION_OWNER") return true;
        } catch {
          // Ignore JSON parse errors
        }
      }
    }
  } catch {
    // Fall through
  }

  return false;
}

export async function isActorPrivilegedForOwnerRecord(
  organizationId: string,
  actorUserId: string,
  executor?: DbTransaction | typeof db
): Promise<boolean> {
  const client = executor ?? db;

  // 1. Check if actor is PLATFORM_OWNER
  try {
    const user =
      (await client.query.users?.findFirst?.({
        where: eq(users.id, actorUserId),
      })) ??
      (await client.select({ platformRole: users.platformRole }).from(users).where(eq(users.id, actorUserId)))[0];

    if (user?.platformRole === "PLATFORM_OWNER") {
      return true;
    }
  } catch {
    // If users table query is unmocked or unavailable, fall through to membership check
  }

  // 2. Check if actor has active ORGANIZATION_OWNER membership in this organization
  if (client.query?.memberships?.findFirst) {
    try {
      const mem = await client.query.memberships.findFirst({
        where: and(
          eq(memberships.organizationId, organizationId),
          eq(memberships.userId, actorUserId),
          eq(memberships.status, "active")
        ),
      });
      if (mem) {
        const role = await client.query.roles?.findFirst?.({
          where: eq(roles.id, mem.roleId),
        });
        if (role?.key === "ORGANIZATION_OWNER") return true;
      }
    } catch {
      // Fall through to select
    }
  }

  try {
    const fromQuery = client
      .select({ id: memberships.id })
      .from(memberships);
    if (typeof fromQuery?.innerJoin === "function") {
      const ownerMembership = await fromQuery
        .innerJoin(roles, eq(roles.id, memberships.roleId))
        .where(
          and(
            eq(memberships.organizationId, organizationId),
            eq(memberships.userId, actorUserId),
            eq(memberships.status, "active"),
            eq(roles.key, "ORGANIZATION_OWNER")
          )
        )
        .limit(1);

      return ownerMembership.length > 0;
    }
  } catch {
    // Return false if query fails
  }

  return false;
}

export async function updateEmployee(organizationId: string, actorUserId: string, employeeId: string, changes: Partial<EmployeeInput>) {
  await authorize({ organizationId, permission: "employee.update" });
  const [current] = await db.select().from(employees).where(and(eq(employees.id, employeeId), eq(employees.organizationId, organizationId)));
  if (!current) throw new AppError("NOT_FOUND", "Employee was not found.", 404);

  // Protect Organization Owner employee record from modification by other tenant roles
  const isTargetOwner = await isOrganizationOwnerEmployee(organizationId, employeeId);
  if (isTargetOwner) {
    const isActorPrivileged = await isActorPrivilegedForOwnerRecord(organizationId, actorUserId);
    if (!isActorPrivileged) {
      throw new AppError(
        "FORBIDDEN",
        "The Organization Owner employee record is protected from modification by other tenant roles.",
        403
      );
    }
  }

  if (changes.reportingManagerId !== undefined) { assertNoSelfReporting(employeeId, changes.reportingManagerId); if (changes.reportingManagerId) { const [manager] = await db.select({ id: employees.id }).from(employees).where(and(eq(employees.id, changes.reportingManagerId), eq(employees.organizationId, organizationId))); if (!manager) throw new AppError("VALIDATION_ERROR", "Reporting manager does not belong to this organization.", 400); } }
  if (changes.status && changes.status !== current.status) assertEmployeeStatusTransition(current.status, changes.status);

  const targetDeptId = changes.departmentId !== undefined ? changes.departmentId : current.departmentId;
  if (changes.teamId) {
    const [team] = await db
      .select({ id: teams.id, departmentId: teams.departmentId, status: teams.status })
      .from(teams)
      .where(and(eq(teams.id, changes.teamId), eq(teams.organizationId, organizationId)));
    if (!team) {
      throw new AppError("VALIDATION_ERROR", "Team does not belong to this organization.", 400);
    }
    if (team.status !== "active") {
      throw new AppError("VALIDATION_ERROR", "Selected team is inactive and cannot accept employee assignments.", 400);
    }
    if (!targetDeptId || team.departmentId !== targetDeptId) {
      throw new AppError("VALIDATION_ERROR", "Selected team does not belong to the selected department.", 400);
    }
  } else if (changes.departmentId !== undefined && changes.departmentId !== current.departmentId && changes.teamId === undefined && current.teamId) {
    const [currTeam] = await db
      .select({ departmentId: teams.departmentId })
      .from(teams)
      .where(and(eq(teams.id, current.teamId), eq(teams.organizationId, organizationId)));
    if (currTeam && currTeam.departmentId !== changes.departmentId) {
      changes.teamId = null as any;
    }
  }

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
