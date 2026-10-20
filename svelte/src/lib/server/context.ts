import { createHash } from 'node:crypto';
import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import { error, isHttpError } from '@sveltejs/kit';
import { database } from './database';
import * as schema from './schema';
import { ALL_PERMISSION_KEYS, ROLE_PERMISSIONS } from '$lib/domain/rbac/permissions';
import type { Context } from '$lib/auth/policy';

// Authorization is resolved from the database for every request; never cache it across requests.
export async function resolveContext(token: string | undefined): Promise<Context | null> {
  if (!token) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');

  try {
    const db = database();
    const [row] = await db.select({
      id: schema.users.id,
      email: schema.users.email,
      fullName: schema.users.fullName,
      platformRole: schema.users.platformRole,
      mustChangePassword: schema.users.mustChangePassword,
      expiresAt: schema.sessions.expiresAt
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(
      eq(schema.sessions.tokenHash, tokenHash),
      gt(schema.sessions.expiresAt, new Date()),
      eq(schema.users.status, 'active')
    )).limit(1);

    if (!row) return null;

    const base: Context = {
      user: {
        id: row.id,
        email: row.email,
        fullName: row.fullName,
        platformRole: row.platformRole,
        mustChangePassword: row.mustChangePassword
      },
      organization: null,
      membership: null,
      role: null,
      permissions: [],
      isDepartmentManager: false
    };

    if (row.platformRole !== 'NONE') {
      return base;
    }

    // Consolidated single transaction with parallelized organizational queries
    const context = await db.transaction(async tx => {
      await tx.execute(sql`select set_config('app.current_user_id', ${row.id}, true)`);
      const [membership] = await tx.select()
        .from(schema.memberships)
        .where(and(eq(schema.memberships.userId, row.id), eq(schema.memberships.status, 'active')))
        .limit(1);

      if (!membership) error(403, 'You do not have access to an organization.');

      await tx.execute(sql`select set_config('app.current_organization_id', ${membership.organizationId}, true)`);

      // Parallelize remaining relational lookups concurrently within the active transaction
      const [[organization], [role], assigned, [manager]] = await Promise.all([
        tx.select({
          id: schema.organizations.id,
          name: schema.organizations.name,
          timezone: schema.organizations.timezone
        })
        .from(schema.organizations)
        .where(and(eq(schema.organizations.id, membership.organizationId), eq(schema.organizations.status, 'active')))
        .limit(1),

        tx.select({ id: schema.roles.id, key: schema.roles.key })
          .from(schema.roles)
          .where(eq(schema.roles.id, membership.roleId))
          .limit(1),

        tx.select({ key: schema.permissions.key })
          .from(schema.rolePermissions)
          .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
          .where(eq(schema.rolePermissions.roleId, membership.roleId)),

        tx.select({ id: schema.departments.id })
          .from(schema.departments)
          .innerJoin(schema.employees, eq(schema.employees.id, schema.departments.headEmployeeId))
          .where(and(
            eq(schema.departments.organizationId, membership.organizationId),
            eq(schema.departments.status, 'active'),
            eq(schema.employees.organizationId, membership.organizationId),
            eq(schema.employees.userId, row.id),
            inArray(schema.employees.status, ['active', 'probation', 'confirmed', 'notice_period'])
          )).limit(1)
      ]);

      if (!organization) error(403, 'Organization workspace is not available.');
      if (!role) error(403, 'Organization role is not available.');

      const resolved: Context = {
        ...base,
        organization,
        membership: { organizationId: membership.organizationId, status: membership.status },
        role,
        permissions: role.key === 'ORGANIZATION_OWNER'
          ? [...ALL_PERMISSION_KEYS]
          : assigned.length ? assigned.map(x => x.key) : [...(ROLE_PERMISSIONS[role.key] ?? [])],
        navigationPermissions: role.key === 'ORGANIZATION_OWNER'
          ? [...ALL_PERMISSION_KEYS]
          : [...(ROLE_PERMISSIONS[role.key] ?? [])],
        isDepartmentManager: Boolean(manager)
      };

      return resolved;
    });

    return context;
  } catch (cause) {
    if (isHttpError(cause)) throw cause;
    // Driver errors can contain connection information: never expose or log them.
    error(503, 'The session service is unavailable. Configure the isolated session database before using protected pages.');
  }
}
