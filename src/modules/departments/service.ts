import { and, eq, inArray, isNotNull, lte, ne, sql } from "drizzle-orm";
import { db, type DbTransaction, withTenantTransaction } from "@/db/client";
import {
  atsRequisitions,
  attendanceRecords,
  departments,
  employees,
  expensePolicies,
  holidays,
  leaveApplications,
  organizations,
  teams,
  workingDays,
} from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { authorize, can } from "@/modules/tenancy/authorization";
import { getCachedTenantContext } from "@/modules/tenancy/context";
import { enrichEmployeesWithRoles, isActorPrivilegedForOwnerRecord } from "@/modules/employees/service";
import type {
  DepartmentDateContext,
  DepartmentDetails,
  DepartmentListItem,
  DepartmentManagerSummary,
  DepartmentTeamLeadSummary,
  DepartmentRosterMember,
  DepartmentTeamItem,
  DepartmentDeletionSafety,
  DepartmentInput,
  DepartmentTeamInput,
} from "./types";

export function getTodayInTimezone(timezone?: string): string {
  const tz = timezone || "UTC";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export { isHrDepartment } from "./validation";

export async function assertIsOrganizationOwner(
  organizationId: string,
  actorUserId: string,
  tx?: DbTransaction | typeof db
): Promise<boolean> {
  const isPrivileged = await isActorPrivilegedForOwnerRecord(organizationId, actorUserId, tx);
  if (isPrivileged) return true;
  const canManage = await can({ userId: actorUserId, organizationId, permission: "department.manage" });
  if (canManage) return true;
  throw new AppError(
    "FORBIDDEN",
    "Only the Organization Owner or HR Administrator can perform department management operations.",
    403
  );
}

export async function isAssignedDepartmentManager(
  organizationId: string,
  actorUserId: string,
  tx?: DbTransaction | typeof db
): Promise<boolean> {
  try {
    const client = tx ?? db;
    const activeStatuses = ["active", "probation", "confirmed", "notice_period"];
    const [row] = await client
      .select({ id: departments.id })
      .from(departments)
      .innerJoin(employees, eq(employees.id, departments.headEmployeeId))
      .where(
        and(
          eq(departments.organizationId, organizationId),
          eq(departments.status, "active"),
          eq(employees.organizationId, organizationId),
          eq(employees.userId, actorUserId),
          inArray(employees.status, activeStatuses as never)
        )
      )
      .limit(1);
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function getManagedDepartmentsForUser(
  organizationId: string,
  actorUserId: string,
  tx?: DbTransaction | typeof db
): Promise<(typeof departments.$inferSelect)[]> {
  try {
    const client = tx ?? db;
    const activeStatuses = ["active", "probation", "confirmed", "notice_period"];

    const rows = await client
      .select({
        id: departments.id,
        organizationId: departments.organizationId,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        headEmployeeId: departments.headEmployeeId,
        status: departments.status,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      })
      .from(departments)
      .innerJoin(employees, eq(employees.id, departments.headEmployeeId))
      .where(
        and(
          eq(departments.organizationId, organizationId),
          eq(departments.status, "active"),
          eq(employees.organizationId, organizationId),
          eq(employees.userId, actorUserId),
          inArray(employees.status, activeStatuses as never)
        )
      )
      .orderBy(departments.name);

    return rows;
  } catch {
    return [];
  }
}

export async function isManagerOfDepartment(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  tx?: DbTransaction | typeof db
): Promise<boolean> {
  try {
    const client = tx ?? db;
    const activeStatuses = ["active", "probation", "confirmed", "notice_period"];

    const [row] = await client
      .select({ id: departments.id })
      .from(departments)
      .innerJoin(employees, eq(employees.id, departments.headEmployeeId))
      .where(
        and(
          eq(departments.id, departmentId),
          eq(departments.organizationId, organizationId),
          eq(departments.status, "active"),
          eq(employees.organizationId, organizationId),
          eq(employees.userId, actorUserId),
          inArray(employees.status, activeStatuses as never)
        )
      )
      .limit(1);

    return Boolean(row);
  } catch {
    return false;
  }
}

export async function assertCanAccessDepartment(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  tx?: DbTransaction | typeof db
): Promise<{ isOwner: boolean }> {
  const isPrivileged = await isActorPrivilegedForOwnerRecord(organizationId, actorUserId, tx);
  if (isPrivileged) {
    return { isOwner: true };
  }

  const hasDeptManage =
    (await can({ userId: actorUserId, organizationId, permission: "department.manage" })) ||
    (await can({ userId: actorUserId, organizationId, permission: "department.create" }));
  if (hasDeptManage) {
    return { isOwner: true };
  }

  const isManager = await isManagerOfDepartment(organizationId, actorUserId, departmentId, tx);
  if (isManager) {
    return { isOwner: false };
  }

  throw new AppError(
    "FORBIDDEN",
    "You are not authorized to access this department.",
    403
  );
}

export async function assertCanManageDepartmentTeams(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  tx?: DbTransaction | typeof db
): Promise<{ isOwner: boolean }> {
  const isPrivileged = await isActorPrivilegedForOwnerRecord(organizationId, actorUserId, tx);
  if (isPrivileged) {
    return { isOwner: true };
  }

  const hasTeamManage =
    (await can({ userId: actorUserId, organizationId, permission: "team.manage" })) ||
    (await can({ userId: actorUserId, organizationId, permission: "department.manage" }));
  if (hasTeamManage) {
    return { isOwner: true };
  }

  const isManager = await isManagerOfDepartment(organizationId, actorUserId, departmentId, tx);
  if (isManager) {
    return { isOwner: false };
  }

  throw new AppError(
    "FORBIDDEN",
    "You are not authorized to manage teams in this department.",
    403
  );
}


export async function resolveDateContext(
  organizationId: string,
  timezone: string,
  dateStr?: string,
  tx?: DbTransaction | typeof db
): Promise<DepartmentDateContext> {
  const client = tx ?? db;
  const today = getTodayInTimezone(timezone);
  const selectedDate = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : today;

  // 1. Holiday check & 2. Working day check
  const dateObj = new Date(`${selectedDate}T12:00:00Z`);
  const dayOfWeek = dateObj.getUTCDay(); // 0 is Sunday, 6 is Saturday

  let holiday: { name: string } | undefined;
  let workingDayRow: { isWorkingDay: boolean } | undefined;

  if (!tx || tx === db) {
    const [holidayRes, workingDayRes] = await Promise.all([
      client
        .select({ name: holidays.name })
        .from(holidays)
        .where(
          and(
            eq(holidays.organizationId, organizationId),
            eq(holidays.holidayDate, selectedDate),
            eq(holidays.status, "active")
          )
        )
        .limit(1),
      client
        .select({ isWorkingDay: workingDays.isWorkingDay })
        .from(workingDays)
        .where(
          and(
            eq(workingDays.organizationId, organizationId),
            eq(workingDays.dayOfWeek, dayOfWeek)
          )
        )
        .limit(1),
    ]);
    holiday = holidayRes[0];
    workingDayRow = workingDayRes[0];
  } else {
    const [h] = await client
      .select({ name: holidays.name })
      .from(holidays)
      .where(
        and(
          eq(holidays.organizationId, organizationId),
          eq(holidays.holidayDate, selectedDate),
          eq(holidays.status, "active")
        )
      )
      .limit(1);
    holiday = h;

    const [w] = await client
      .select({ isWorkingDay: workingDays.isWorkingDay })
      .from(workingDays)
      .where(
        and(
          eq(workingDays.organizationId, organizationId),
          eq(workingDays.dayOfWeek, dayOfWeek)
        )
      )
      .limit(1);
    workingDayRow = w;
  }

  const isWorkingDay = workingDayRow ? workingDayRow.isWorkingDay : dayOfWeek !== 0 && dayOfWeek !== 6;

  return {
    date: selectedDate,
    timezone,
    isHoliday: Boolean(holiday),
    holidayName: holiday?.name ?? null,
    isWorkingDay,
    isPastDate: selectedDate < today,
    isToday: selectedDate === today,
    isFutureDate: selectedDate > today,
  };
}

export const DEFAULT_ELIGIBLE_MANAGER_ROLES = ["MANAGER", "HR_ADMIN", "FINANCE_ADMIN"] as const;

export async function validateManagerEmployee(
  organizationId: string,
  headEmployeeId: string | null | undefined,
  currentDepartmentId?: string,
  tx?: DbTransaction | typeof db
): Promise<typeof employees.$inferSelect | null> {
  if (!headEmployeeId) return null;

  const run = async (client: DbTransaction | typeof db) => {
    const [managerEmp] = await client
      .select()
      .from(employees)
      .where(and(eq(employees.id, headEmployeeId), eq(employees.organizationId, organizationId)))
      .limit(1);

    if (!managerEmp) {
      throw new AppError("VALIDATION_ERROR", "Assigned manager does not belong to this organization.", 400);
    }

    // Active status validation
    const activeStatuses = ["active", "probation", "confirmed"];
    if (!activeStatuses.includes(managerEmp.status)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Assigned manager has status "${managerEmp.status}". Only active employees can head a department.`,
        400
      );
    }

    // Role eligibility check
    const [enriched] = await enrichEmployeesWithRoles(organizationId, [managerEmp], client);
    const roleKey = enriched?.roleKey;
    if (roleKey === "ORGANIZATION_OWNER") {
      throw new AppError(
        "VALIDATION_ERROR",
        "Organization Owner cannot be assigned as a department manager.",
        400
      );
    }
    if (roleKey && !DEFAULT_ELIGIBLE_MANAGER_ROLES.includes(roleKey as typeof DEFAULT_ELIGIBLE_MANAGER_ROLES[number])) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Employee with role "${enriched.roleTitle || roleKey}" cannot be assigned as department manager. Eligible roles: Department Manager, HR Administrator, Finance Administrator.`,
        400
      );
    }

    // Enforce one department-manager assignment per employee across active departments
    const deptConditions = [
      eq(departments.organizationId, organizationId),
      eq(departments.headEmployeeId, headEmployeeId),
      eq(departments.status, "active"),
    ];
    if (currentDepartmentId) {
      deptConditions.push(ne(departments.id, currentDepartmentId));
    }

    const [otherActiveDept] = await client
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(and(...deptConditions))
      .limit(1);

    if (otherActiveDept) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Employee is already assigned as manager of active department "${otherActiveDept.name}". An employee can only manage one department at a time.`,
        400
      );
    }

    return managerEmp;
  };

  if (tx && tx !== db) {
    return run(tx);
  }
  if (typeof withTenantTransaction === "function") {
    return withTenantTransaction(organizationId, run);
  }
  return run(db);
}

export async function listEligibleManagers(
  organizationId: string,
  currentDepartmentId?: string,
  tx?: DbTransaction | typeof db
): Promise<DepartmentManagerSummary[]> {
  await authorize({ organizationId, permission: "department.read" });

  const run = async (client: DbTransaction | typeof db) => {
    // 1. Fetch managers already assigned to other active departments
    const activeDepts = await client
      .select({
        id: departments.id,
        headEmployeeId: departments.headEmployeeId,
      })
      .from(departments)
      .where(
        and(
          eq(departments.organizationId, organizationId),
          eq(departments.status, "active"),
          isNotNull(departments.headEmployeeId)
        )
      );

    const assignedOtherDeptManagers = new Set<string>();
    for (const dept of activeDepts) {
      if (dept.headEmployeeId && (!currentDepartmentId || dept.id !== currentDepartmentId)) {
        assignedOtherDeptManagers.add(dept.headEmployeeId);
      }
    }

    // 2. Fetch active employees in this organization
    const activeEmployees = await client
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          inArray(employees.status, ["active", "probation", "confirmed"])
        )
      )
      .orderBy(employees.displayName);

    const enriched = await enrichEmployeesWithRoles(organizationId, activeEmployees, client);

    return enriched
      .filter((emp) => {
        // Exclude Organization Owner from the dropdown by default
        if (emp.roleKey === "ORGANIZATION_OWNER") return false;
        // Exclude users already assigned as manager of another active department
        if (assignedOtherDeptManagers.has(emp.id)) return false;
        // Filter by eligible manager roles if role is assigned
        if (emp.roleKey && !DEFAULT_ELIGIBLE_MANAGER_ROLES.includes(emp.roleKey as typeof DEFAULT_ELIGIBLE_MANAGER_ROLES[number])) {
          return false;
        }
        return true;
      })
      .map((emp) => ({
        id: emp.id,
        displayName: emp.displayName,
        employeeId: emp.employeeId,
        workEmail: emp.workEmail,
        phone: emp.phone,
        roleKey: emp.roleKey,
        roleTitle: emp.roleTitle,
        status: emp.status,
      }));
  };

  if (tx && tx !== db) {
    return run(tx);
  }
  if (typeof withTenantTransaction === "function") {
    return withTenantTransaction(organizationId, run);
  }
  return run(db);
}

export const DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES = ["TEAM_LEAD"] as const;

export async function validateTeamLeadEmployee(
  organizationId: string,
  teamLeadEmployeeId: string | null | undefined,
  tx?: DbTransaction | typeof db
): Promise<typeof employees.$inferSelect | null> {
  if (!teamLeadEmployeeId) return null;

  const run = async (client: DbTransaction | typeof db) => {
    const [leadEmp] = await client
      .select()
      .from(employees)
      .where(and(eq(employees.id, teamLeadEmployeeId), eq(employees.organizationId, organizationId)))
      .limit(1);

    if (!leadEmp) {
      throw new AppError("VALIDATION_ERROR", "Selected team lead does not belong to this organization.", 400);
    }

    // Active status validation
    const activeStatuses = ["active", "probation", "confirmed"];
    if (!activeStatuses.includes(leadEmp.status)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Assigned team lead has status "${leadEmp.status}". Only active employees can lead a team.`,
        400
      );
    }

    // Role eligibility check
    const [enriched] = await enrichEmployeesWithRoles(organizationId, [leadEmp], client);
    const roleKey = enriched?.roleKey;
    if (roleKey === "ORGANIZATION_OWNER") {
      throw new AppError(
        "VALIDATION_ERROR",
        "Organization Owner cannot be assigned as a team lead.",
        400
      );
    }
    if (!roleKey || !DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES.includes(roleKey as typeof DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES[number])) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Employee with role "${enriched?.roleTitle || roleKey || "unassigned"}" cannot be assigned as team lead. Eligible role: Team Lead.`,
        400
      );
    }

    return leadEmp;
  };

  if (tx && tx !== db) {
    return run(tx);
  }
  if (typeof withTenantTransaction === "function") {
    return withTenantTransaction(organizationId, run);
  }
  return run(db);
}

export async function listEligibleTeamLeads(
  organizationId: string,
  _departmentId?: string,
  tx?: DbTransaction | typeof db
): Promise<DepartmentTeamLeadSummary[]> {
  await authorize({ organizationId, permission: "department.read" });

  const run = async (client: DbTransaction | typeof db) => {
    // Fetch active employees in this organization
    const activeEmployees = await client
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          inArray(employees.status, ["active", "probation", "confirmed"])
        )
      )
      .orderBy(employees.displayName);

    const enriched = await enrichEmployeesWithRoles(organizationId, activeEmployees, client);

    return enriched
      .filter((emp) => {
        // Exclude Organization Owner from team leads by default
        if (emp.roleKey === "ORGANIZATION_OWNER") return false;
        // Filter by active status
        if (!["active", "probation", "confirmed"].includes(emp.status)) return false;
        // Filter by eligible team lead roles: must have an eligible role (TEAM_LEAD)
        if (!emp.roleKey || !DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES.includes(emp.roleKey as typeof DEFAULT_ELIGIBLE_TEAM_LEAD_ROLES[number])) {
          return false;
        }
        return true;
      })
      .map((emp) => ({
        id: emp.id,
        displayName: emp.displayName,
        employeeId: emp.employeeId,
        workEmail: emp.workEmail,
        phone: emp.phone,
        roleKey: emp.roleKey,
        roleTitle: emp.roleTitle,
        status: emp.status,
      }));
  };

  if (tx && tx !== db) {
    return run(tx);
  }
  if (typeof withTenantTransaction === "function") {
    return withTenantTransaction(organizationId, run);
  }
  return run(db);
}


export async function listDepartmentsWithMetrics(
  organizationId: string,
  actorUserId: string,
  dateParam?: string
): Promise<{ items: DepartmentListItem[]; dateContext: DepartmentDateContext; totalCount: number }> {
  await authorize({ organizationId, permission: "department.read" });

  let timezone: string | undefined;
  let cachedContext: Awaited<ReturnType<typeof getCachedTenantContext>> = null;
  try {
    cachedContext = await getCachedTenantContext(organizationId);
    timezone = cachedContext?.organization?.timezone || undefined;
  } catch {
    // Ignore cache error
  }

  if (!timezone) {
    const [org] = await db
      .select({ timezone: organizations.timezone })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    timezone = org?.timezone || "UTC";
  }

  // 1. Fetch departments scoped to user permissions:
  // - Organization Owner and HR Admin (department.manage): see all departments in the organization.
  // - Assigned Department Manager: sees ONLY their assigned active department(s).
  // - Other roles: do not see departments by default.
  const isPrivileged =
    cachedContext?.user?.platformRole === "PLATFORM_OWNER" ||
    cachedContext?.role?.key === "ORGANIZATION_OWNER"
      ? true
      : await isActorPrivilegedForOwnerRecord(organizationId, actorUserId);

  const canManageAll =
    isPrivileged ||
    (cachedContext?.role?.key === "HR_ADMIN" ||
    (cachedContext?.permissions &&
      (Array.isArray(cachedContext.permissions)
        ? cachedContext.permissions.includes("department.manage")
        : (cachedContext.permissions as Set<string>).has?.("department.manage")))
      ? true
      : await can({ userId: actorUserId, organizationId, permission: "department.manage" }));

  // Run date context resolution and department query concurrently
  const [dateContext, deptRows] = await Promise.all([
    resolveDateContext(organizationId, timezone, dateParam),
    canManageAll
      ? db
          .select()
          .from(departments)
          .where(eq(departments.organizationId, organizationId))
          .orderBy(departments.name)
      : getManagedDepartmentsForUser(organizationId, actorUserId),
  ]);

  if (deptRows.length === 0) {
    return { items: [], dateContext, totalCount: 0 };
  }

  const deptIds = deptRows.map((d) => d.id);

  // 2. Fetch managers, 3. Count sub-teams, and 4. Fetch department employees concurrently
  const headIds = deptRows.map((d) => d.headEmployeeId).filter((id): id is string => Boolean(id));
  const activeEmployeeStatuses = ["active", "probation", "confirmed", "notice_period"];

  const [managerRows, teamCounts, departmentEmployees] = await Promise.all([
    headIds.length > 0
      ? db
          .select()
          .from(employees)
          .where(and(eq(employees.organizationId, organizationId), inArray(employees.id, headIds)))
      : Promise.resolve([]),
    db
      .select({
        departmentId: teams.departmentId,
        count: sql<number>`count(*)::int`,
      })
      .from(teams)
      .where(and(eq(teams.organizationId, organizationId), inArray(teams.departmentId, deptIds)))
      .groupBy(teams.departmentId),
    db
      .select({
        id: employees.id,
        departmentId: employees.departmentId,
        status: employees.status,
        joiningDate: employees.joiningDate,
      })
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          inArray(employees.departmentId, deptIds),
          inArray(employees.status, activeEmployeeStatuses as never)
        )
      ),
  ]);

  const managerMap = new Map<string, DepartmentManagerSummary>();
  if (managerRows.length > 0) {
    const enrichedManagers = await enrichEmployeesWithRoles(organizationId, managerRows);
    for (const m of enrichedManagers) {
      managerMap.set(m.id, {
        id: m.id,
        displayName: m.displayName,
        employeeId: m.employeeId,
        workEmail: m.workEmail,
        phone: m.phone,
        roleKey: m.roleKey,
        roleTitle: m.roleTitle,
        status: m.status,
      });
    }
  }

  const teamCountMap = new Map<string, number>();
  for (const tc of teamCounts) {
    if (tc.departmentId) teamCountMap.set(tc.departmentId, Number(tc.count));
  }

  const employeesByDept = new Map<string, typeof departmentEmployees>();
  for (const emp of departmentEmployees) {
    if (!emp.departmentId) continue;
    const list = employeesByDept.get(emp.departmentId) || [];
    list.push(emp);
    employeesByDept.set(emp.departmentId, list);
  }

  // 5. Query attendance records and 6. Query approved leaves concurrently
  const employeeIds = departmentEmployees.map((e) => e.id);
  const attendanceMap = new Map<string, typeof attendanceRecords.$inferSelect>();
  const leaveSet = new Set<string>();

  if (employeeIds.length > 0) {
    const [punchRecords, leaves] = await Promise.all([
      db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.organizationId, organizationId),
            eq(attendanceRecords.attendanceDate, dateContext.date),
            inArray(attendanceRecords.employeeId, employeeIds)
          )
        ),
      db
        .select({ employeeId: leaveApplications.employeeId })
        .from(leaveApplications)
        .where(
          and(
            eq(leaveApplications.organizationId, organizationId),
            eq(leaveApplications.status, "approved"),
            lte(leaveApplications.startDate, dateContext.date),
            sql`${leaveApplications.endDate} >= ${dateContext.date}`,
            inArray(leaveApplications.employeeId, employeeIds)
          )
        ),
    ]);

    for (const r of punchRecords) {
      attendanceMap.set(r.employeeId, r);
    }
    for (const l of leaves) {
      leaveSet.add(l.employeeId);
    }
  }

  // 7. Aggregate per department
  const items: DepartmentListItem[] = deptRows.map((dept) => {
    const emps = employeesByDept.get(dept.id) || [];
    let presentCount = 0;
    let absentCount = 0;
    let pendingCount = 0;
    let onLeaveCount = 0;

    for (const emp of emps) {
      // Exclude if joiningDate is strictly in the future relative to dateContext.date
      if (emp.joiningDate && emp.joiningDate > dateContext.date) {
        continue;
      }

      const punch = attendanceMap.get(emp.id);
      if (punch) {
        // Any confirmed punch or active in-shift punch counts as Present
        if (
          ["present", "late", "early_departure", "late_and_early", "regularized", "work_from_home", "missing_punch"].includes(
            punch.status
          )
        ) {
          presentCount++;
        } else if (punch.status === "absent") {
          absentCount++;
        }
      } else {
        // No attendance punch record
        if (leaveSet.has(emp.id)) {
          onLeaveCount++;
        } else if (dateContext.isHoliday || !dateContext.isWorkingDay) {
          // Non-working day or holiday: do NOT mark absent
          continue;
        } else if (dateContext.isToday) {
          // Current working day without punch yet -> Pending Arrival
          pendingCount++;
        } else if (dateContext.isPastDate) {
          // Past completed working day without punch and without approved leave -> Absent
          absentCount++;
        }
      }
    }

    return {
      id: dept.id,
      code: dept.code,
      name: dept.name,
      description: dept.description,
      headEmployeeId: dept.headEmployeeId,
      status: dept.status,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      manager: dept.headEmployeeId ? managerMap.get(dept.headEmployeeId) || null : null,
      totalEmployees: emps.length,
      presentCount,
      absentCount,
      pendingCount,
      onLeaveCount,
      subTeamsCount: teamCountMap.get(dept.id) || 0,
    };
  });

  return { items, dateContext, totalCount: items.length };
}

export async function getDepartmentDetails(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  dateParam?: string
): Promise<DepartmentDetails> {
  await authorize({ organizationId, permission: "department.read" });

  let timezone: string | undefined;
  let cachedContext: Awaited<ReturnType<typeof getCachedTenantContext>> = null;
  try {
    cachedContext = await getCachedTenantContext(organizationId);
    timezone = cachedContext?.organization?.timezone || undefined;
  } catch {
    // Ignore cache error
  }

  if (!timezone) {
    const [org] = await db
      .select({ timezone: organizations.timezone })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    timezone = org?.timezone || "UTC";
  }

  const [dateContext, [dept]] = await Promise.all([
    resolveDateContext(organizationId, timezone, dateParam),
    db
      .select()
      .from(departments)
      .where(and(eq(departments.id, departmentId), eq(departments.organizationId, organizationId)))
      .limit(1),
  ]);

  if (!dept) {
    throw new AppError("NOT_FOUND", "Department was not found in this organization.", 404);
  }

  // Enforce department access scope:
  // Organization Owner can access all departments.
  // Assigned department manager can access only their assigned active department.
  // Other users or managers attempting to access another department are rejected with 403 Forbidden.
  await assertCanAccessDepartment(organizationId, actorUserId, departmentId);

  // Manager details, assigned sub-teams, and department employee roster: run concurrently
  const [mgrEmpRow, teamRows, rawEmployees] = await Promise.all([
    dept.headEmployeeId
      ? db
          .select()
          .from(employees)
          .where(and(eq(employees.id, dept.headEmployeeId), eq(employees.organizationId, organizationId)))
          .then((r) => r[0] || null)
      : Promise.resolve(null),
    db
      .select()
      .from(teams)
      .where(and(eq(teams.departmentId, dept.id), eq(teams.organizationId, organizationId)))
      .orderBy(teams.name),
    db
      .select()
      .from(employees)
      .where(and(eq(employees.departmentId, dept.id), eq(employees.organizationId, organizationId)))
      .orderBy(employees.displayName),
  ]);

  let manager: DepartmentManagerSummary | null = null;
  if (mgrEmpRow) {
    const [enrichedMgr] = await enrichEmployeesWithRoles(organizationId, [mgrEmpRow]);
    manager = {
      id: enrichedMgr.id,
      displayName: enrichedMgr.displayName,
      employeeId: enrichedMgr.employeeId,
      workEmail: enrichedMgr.workEmail,
      phone: enrichedMgr.phone,
      roleKey: enrichedMgr.roleKey,
      roleTitle: enrichedMgr.roleTitle,
      status: enrichedMgr.status,
    };
  }

  const teamLeadIds = teamRows.map((t) => t.teamLeadEmployeeId).filter((id): id is string => Boolean(id));
  const [leads, enrichedEmployees] = await Promise.all([
    teamLeadIds.length > 0
      ? db
          .select({ id: employees.id, displayName: employees.displayName })
          .from(employees)
          .where(and(eq(employees.organizationId, organizationId), inArray(employees.id, teamLeadIds)))
      : Promise.resolve([]),
    enrichEmployeesWithRoles(organizationId, rawEmployees),
  ]);

  const leadNameMap = new Map<string, string>();
  for (const lead of leads) {
    leadNameMap.set(lead.id, lead.displayName);
  }

  const teamsList: DepartmentTeamItem[] = teamRows.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    description: t.description,
    status: t.status,
    teamLeadEmployeeId: t.teamLeadEmployeeId,
    teamLeadName: t.teamLeadEmployeeId ? leadNameMap.get(t.teamLeadEmployeeId) || null : null,
  }));

  const employeeIds = enrichedEmployees.map((e) => e.id);

  // Attendance punches & Leave applications: run concurrently
  const punchMap = new Map<string, typeof attendanceRecords.$inferSelect>();
  const leaveSet = new Set<string>();

  if (employeeIds.length > 0) {
    const [records, leaves] = await Promise.all([
      db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.organizationId, organizationId),
            eq(attendanceRecords.attendanceDate, dateContext.date),
            inArray(attendanceRecords.employeeId, employeeIds)
          )
        ),
      db
        .select({ employeeId: leaveApplications.employeeId })
        .from(leaveApplications)
        .where(
          and(
            eq(leaveApplications.organizationId, organizationId),
            eq(leaveApplications.status, "approved"),
            lte(leaveApplications.startDate, dateContext.date),
            sql`${leaveApplications.endDate} >= ${dateContext.date}`,
            inArray(leaveApplications.employeeId, employeeIds)
          )
        ),
    ]);

    for (const r of records) {
      punchMap.set(r.employeeId, r);
    }
    for (const l of leaves) {
      leaveSet.add(l.employeeId);
    }
  }

  let presentCount = 0;
  let absentCount = 0;
  let pendingCount = 0;
  let onLeaveCount = 0;

  const roster: DepartmentRosterMember[] = enrichedEmployees.map((emp) => {
    let punchStatus: DepartmentRosterMember["punchStatus"] = "pending_arrival";
    const punch = punchMap.get(emp.id);

    if (emp.joiningDate && emp.joiningDate > dateContext.date) {
      punchStatus = "not_joined";
    } else if (punch) {
      if (
        ["present", "late", "early_departure", "late_and_early", "regularized", "work_from_home", "missing_punch"].includes(
          punch.status
        )
      ) {
        punchStatus = punch.status as DepartmentRosterMember["punchStatus"];
        presentCount++;
      } else if (punch.status === "absent") {
        punchStatus = "absent";
        absentCount++;
      }
    } else {
      if (leaveSet.has(emp.id)) {
        punchStatus = "on_leave";
        onLeaveCount++;
      } else if (dateContext.isHoliday) {
        punchStatus = "holiday";
      } else if (!dateContext.isWorkingDay) {
        punchStatus = "weekend";
      } else if (dateContext.isPastDate) {
        punchStatus = "absent";
        absentCount++;
      } else {
        punchStatus = "pending_arrival";
        pendingCount++;
      }
    }

    return {
      id: emp.id,
      employeeId: emp.employeeId,
      displayName: emp.displayName,
      workEmail: emp.workEmail,
      phone: emp.phone,
      roleKey: emp.roleKey,
      roleTitle: emp.roleTitle,
      status: emp.status,
      joiningDate: emp.joiningDate,
      punchStatus,
      firstIn: punch?.actualFirstIn ?? null,
      lastOut: punch?.actualLastOut ?? null,
    };
  });

  return {
    id: dept.id,
    code: dept.code,
    name: dept.name,
    description: dept.description,
    headEmployeeId: dept.headEmployeeId,
    status: dept.status,
    createdAt: dept.createdAt,
    updatedAt: dept.updatedAt,
    manager,
    totalEmployees: roster.filter((e) => !["terminated", "exited", "inactive"].includes(e.status)).length,
    presentCount,
    absentCount,
    pendingCount,
    onLeaveCount,
    subTeamsCount: teamsList.length,
    teams: teamsList,
    roster,
    dateContext,
    canManageTeams: true,
  };
}

export async function createDepartment(
  organizationId: string,
  actorUserId: string,
  input: DepartmentInput
): Promise<typeof departments.$inferSelect> {
  await authorize({ organizationId, permission: "department.create" });

  const cleanCode = input.code.trim().toUpperCase();
  const cleanName = input.name.trim();

  return db.transaction(async (tx) => {
    // Validate unique code within organization
    const [existingCode] = await tx
      .select({ id: departments.id })
      .from(departments)
      .where(
        and(
          eq(departments.organizationId, organizationId),
          sql`upper(${departments.code}) = ${cleanCode}`
        )
      )
      .limit(1);

    if (existingCode) {
      throw new AppError(
        "VALIDATION_ERROR",
        `A department with code "${cleanCode}" already exists in this organization.`,
        409
      );
    }

    // Validate manager within transaction
    if (input.headEmployeeId) {
      await validateManagerEmployee(organizationId, input.headEmployeeId, undefined, tx);
    }

    const [created] = await tx
      .insert(departments)
      .values({
        organizationId,
        code: cleanCode,
        name: cleanName,
        description: input.description?.trim() || null,
        headEmployeeId: input.headEmployeeId || null,
        status: input.status || "active",
      })
      .returning();

    await recordAudit({
      actorUserId,
      organizationId,
      action: "department_created",
      resource: "department",
      resourceId: created.id,
      metadata: { code: created.code, name: created.name },
    });

    return created;
  });
}

export async function updateDepartment(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  input: Partial<DepartmentInput>
): Promise<typeof departments.$inferSelect> {
  await authorize({ organizationId, permission: "department.update" });

  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(departments)
      .where(and(eq(departments.id, departmentId), eq(departments.organizationId, organizationId)))
      .limit(1);

    if (!current) {
      throw new AppError("NOT_FOUND", "Department was not found in this organization.", 404);
    }

    const patch: Partial<typeof departments.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      patch.name = input.name.trim();
    }

    if (input.description !== undefined) {
      patch.description = input.description ? input.description.trim() : null;
    }

    if (input.status !== undefined) {
      patch.status = input.status;
    }

    if (input.code !== undefined) {
      const cleanCode = input.code.trim().toUpperCase();
      if (cleanCode !== current.code.toUpperCase()) {
        const [duplicate] = await tx
          .select({ id: departments.id })
          .from(departments)
          .where(
            and(
              eq(departments.organizationId, organizationId),
              sql`upper(${departments.code}) = ${cleanCode}`,
              ne(departments.id, departmentId)
            )
          )
          .limit(1);

        if (duplicate) {
          throw new AppError(
            "VALIDATION_ERROR",
            `A department with code "${cleanCode}" already exists in this organization.`,
            409
          );
        }
        patch.code = cleanCode;
      }
    }

    if (input.headEmployeeId !== undefined) {
      if (input.headEmployeeId) {
        await validateManagerEmployee(organizationId, input.headEmployeeId, departmentId, tx);
        patch.headEmployeeId = input.headEmployeeId;
      } else {
        patch.headEmployeeId = null;
      }
    }

    const [updated] = await tx
      .update(departments)
      .set(patch)
      .where(and(eq(departments.id, departmentId), eq(departments.organizationId, organizationId)))
      .returning();

    await recordAudit({
      actorUserId,
      organizationId,
      action: "department_updated",
      resource: "department",
      resourceId: departmentId,
      metadata: { changes: patch },
    });

    return updated;
  });
}

export async function checkDepartmentDeletionSafety(
  organizationId: string,
  departmentId: string
): Promise<DepartmentDeletionSafety> {
  const [empCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees)
    .where(
      and(
        eq(employees.departmentId, departmentId),
        eq(employees.organizationId, organizationId),
        sql`${employees.status} NOT IN ('terminated', 'exited')`
      )
    );

  const [teamCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teams)
    .where(
      and(
        eq(teams.departmentId, departmentId),
        eq(teams.organizationId, organizationId),
        eq(teams.status, "active")
      )
    );

  const [reqCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(atsRequisitions)
    .where(
      and(
        eq(atsRequisitions.departmentId, departmentId),
        eq(atsRequisitions.organizationId, organizationId),
        inArray(atsRequisitions.status, ["draft", "pending_approval", "approved", "open"])
      )
    );

  const [policyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(expensePolicies)
    .where(
      and(
        eq(expensePolicies.departmentId, departmentId),
        eq(expensePolicies.organizationId, organizationId),
        eq(expensePolicies.active, true)
      )
    );

  const activeEmployeesCount = Number(empCount?.count ?? 0);
  const activeTeamsCount = Number(teamCount?.count ?? 0);
  const activeRequisitionsCount = Number(reqCount?.count ?? 0);
  const activeExpensePoliciesCount = Number(policyCount?.count ?? 0);

  const reasons: string[] = [];
  if (activeEmployeesCount > 0) {
    reasons.push(
      `${activeEmployeesCount} active employee${activeEmployeesCount === 1 ? " is" : "s are"} currently assigned to this department.`
    );
  }
  if (activeTeamsCount > 0) {
    reasons.push(
      `${activeTeamsCount} active team${activeTeamsCount === 1 ? " is" : "s are"} mapped to this department.`
    );
  }
  if (activeRequisitionsCount > 0) {
    reasons.push(
      `${activeRequisitionsCount} active job requisition${activeRequisitionsCount === 1 ? " is" : "s are"} tagged with this department.`
    );
  }
  if (activeExpensePoliciesCount > 0) {
    reasons.push(
      `${activeExpensePoliciesCount} active expense polic${activeExpensePoliciesCount === 1 ? "y is" : "ies are"} scoped to this department.`
    );
  }

  return {
    safe: reasons.length === 0,
    activeEmployeesCount,
    activeTeamsCount,
    activeRequisitionsCount,
    activeExpensePoliciesCount,
    reasons,
  };
}

export async function deleteDepartment(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  forceSoft = false
): Promise<{ success: boolean; mode: "hard" | "soft" }> {
  await authorize({ organizationId, permission: "department.manage" });

  const [dept] = await db
    .select()
    .from(departments)
    .where(and(eq(departments.id, departmentId), eq(departments.organizationId, organizationId)))
    .limit(1);

  if (!dept) {
    throw new AppError("NOT_FOUND", "Department was not found in this organization.", 404);
  }

  if (forceSoft) {
    // Soft deactivation
    await db
      .update(departments)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(and(eq(departments.id, departmentId), eq(departments.organizationId, organizationId)));

    await recordAudit({
      actorUserId,
      organizationId,
      action: "department_deactivated",
      resource: "department",
      resourceId: departmentId,
      metadata: { code: dept.code, name: dept.name },
    });

    return { success: true, mode: "soft" };
  }

  // Pre-flight safety check
  const safety = await checkDepartmentDeletionSafety(organizationId, departmentId);
  if (!safety.safe) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Cannot delete department "${dept.name}". ${safety.reasons.join(" ")} Reassign these resources before deleting, or deactivate the department instead.`,
      409
    );
  }

  // Safe hard delete
  await db
    .delete(departments)
    .where(and(eq(departments.id, departmentId), eq(departments.organizationId, organizationId)));

  await recordAudit({
    actorUserId,
    organizationId,
    action: "department_deleted",
    resource: "department",
    resourceId: departmentId,
    metadata: { code: dept.code, name: dept.name },
  });

  return { success: true, mode: "hard" };
}

export async function listDepartmentTeams(
  organizationId: string,
  actorUserId: string,
  departmentId: string
): Promise<DepartmentTeamItem[]> {
  await assertCanAccessDepartment(organizationId, actorUserId, departmentId);

  const teamRows = await db
    .select()
    .from(teams)
    .where(and(eq(teams.departmentId, departmentId), eq(teams.organizationId, organizationId)))
    .orderBy(teams.name);

  const teamLeadIds = teamRows.map((t) => t.teamLeadEmployeeId).filter((id): id is string => Boolean(id));
  const leadNameMap = new Map<string, string>();
  if (teamLeadIds.length > 0) {
    const leads = await db
      .select({ id: employees.id, displayName: employees.displayName })
      .from(employees)
      .where(and(eq(employees.organizationId, organizationId), inArray(employees.id, teamLeadIds)));
    for (const lead of leads) {
      leadNameMap.set(lead.id, lead.displayName);
    }
  }

  return teamRows.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    description: t.description,
    status: t.status,
    teamLeadEmployeeId: t.teamLeadEmployeeId,
    teamLeadName: t.teamLeadEmployeeId ? leadNameMap.get(t.teamLeadEmployeeId) || null : null,
  }));
}

export async function createDepartmentTeam(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  input: DepartmentTeamInput
): Promise<typeof teams.$inferSelect> {
  await assertCanManageDepartmentTeams(organizationId, actorUserId, departmentId);

  const [dept] = await db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(and(eq(departments.id, departmentId), eq(departments.organizationId, organizationId)))
    .limit(1);

  if (!dept) {
    throw new AppError("NOT_FOUND", "Department was not found in this organization.", 404);
  }

  const cleanName = input.name.trim();
  const cleanCode = input.code.trim().toUpperCase();

  const [existingCode] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(
      and(
        eq(teams.organizationId, organizationId),
        sql`upper(${teams.code}) = ${cleanCode}`
      )
    )
    .limit(1);

  if (existingCode) {
    throw new AppError(
      "VALIDATION_ERROR",
      `A team with code "${cleanCode}" already exists in this organization.`,
      409
    );
  }

  if (input.teamLeadEmployeeId) {
    await validateTeamLeadEmployee(organizationId, input.teamLeadEmployeeId, db);
  }

  const [created] = await db
    .insert(teams)
    .values({
      organizationId,
      departmentId,
      name: cleanName,
      code: cleanCode,
      description: input.description?.trim() || null,
      teamLeadEmployeeId: input.teamLeadEmployeeId || null,
      status: input.status || "active",
    })
    .returning();

  await recordAudit({
    actorUserId,
    organizationId,
    action: "team_created",
    resource: "team",
    resourceId: created.id,
    metadata: { code: created.code, name: created.name, departmentId },
  });

  return created;
}

export async function updateDepartmentTeam(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  teamId: string,
  input: Partial<DepartmentTeamInput>
): Promise<typeof teams.$inferSelect> {
  await assertCanManageDepartmentTeams(organizationId, actorUserId, departmentId);

  const [current] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.organizationId, organizationId)))
    .limit(1);

  if (!current) {
    throw new AppError("NOT_FOUND", "Team was not found in this organization.", 404);
  }

  if (current.departmentId !== departmentId) {
    throw new AppError("FORBIDDEN", "Team does not belong to this department.", 403);
  }

  const patch: Partial<typeof teams.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    patch.name = input.name.trim();
  }

  if (input.description !== undefined) {
    patch.description = input.description ? input.description.trim() : null;
  }

  if (input.status !== undefined) {
    patch.status = input.status;
  }

  if (input.code !== undefined) {
    const cleanCode = input.code.trim().toUpperCase();
    if (cleanCode !== current.code.toUpperCase()) {
      const [duplicate] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(
          and(
            eq(teams.organizationId, organizationId),
            sql`upper(${teams.code}) = ${cleanCode}`,
            sql`${teams.id} != ${teamId}`
          )
        )
        .limit(1);

      if (duplicate) {
        throw new AppError(
          "VALIDATION_ERROR",
          `A team with code "${cleanCode}" already exists in this organization.`,
          409
        );
      }
      patch.code = cleanCode;
    }
  }

  if (input.teamLeadEmployeeId !== undefined) {
    if (input.teamLeadEmployeeId) {
      await validateTeamLeadEmployee(organizationId, input.teamLeadEmployeeId, db);
      patch.teamLeadEmployeeId = input.teamLeadEmployeeId;
    } else {
      patch.teamLeadEmployeeId = null;
    }
  }

  const [updated] = await db
    .update(teams)
    .set(patch)
    .where(and(eq(teams.id, teamId), eq(teams.organizationId, organizationId)))
    .returning();

  await recordAudit({
    actorUserId,
    organizationId,
    action: "team_updated",
    resource: "team",
    resourceId: teamId,
    metadata: { changes: patch, departmentId },
  });

  return updated;
}

export async function deleteDepartmentTeam(
  organizationId: string,
  actorUserId: string,
  departmentId: string,
  teamId: string
): Promise<{ success: boolean }> {
  await assertCanManageDepartmentTeams(organizationId, actorUserId, departmentId);

  const [current] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.organizationId, organizationId)))
    .limit(1);

  if (!current) {
    throw new AppError("NOT_FOUND", "Team was not found in this organization.", 404);
  }

  if (current.departmentId !== departmentId) {
    throw new AppError("FORBIDDEN", "Team does not belong to this department.", 403);
  }

  await db
    .update(teams)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(and(eq(teams.id, teamId), eq(teams.organizationId, organizationId)));

  await recordAudit({
    actorUserId,
    organizationId,
    action: "team_deactivated",
    resource: "team",
    resourceId: teamId,
    metadata: { code: current.code, name: current.name, departmentId },
  });

  return { success: true };
}

