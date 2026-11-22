import{and,eq}from'drizzle-orm';import{employees,memberships,roles,invitations,employeeHistory}from'./schema';import type{database}from'./database';type Tx=Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];
export async function isOrganizationOwnerEmployee(
  organizationId: string,
  employeeId: string,
  executor: Tx
): Promise<boolean> {
  const client = executor;

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

