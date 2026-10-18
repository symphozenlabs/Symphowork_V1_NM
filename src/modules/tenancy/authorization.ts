import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships, permissions, rolePermissions, roles } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { getSessionUser, requireSession } from "@/modules/identity/auth";
import { ALL_PERMISSION_KEYS, type Permission, ROLE_PERMISSIONS } from "@/modules/rbac/permissions";
import { getCachedTenantContext } from "@/modules/tenancy/context";

export const getRolePermissionSet = cache(async (roleId: string, knownRoleKey?: string): Promise<Set<string>> => {
  if (knownRoleKey === "ORGANIZATION_OWNER") {
    return new Set(ALL_PERMISSION_KEYS);
  }

  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  const set = new Set(rows.map((r) => r.key));

  let roleKey = knownRoleKey;
  if (!roleKey) {
    try {
      const cached = await getCachedTenantContext().catch(() => null);
      if (cached?.role?.id === roleId) {
        roleKey = cached.role.key;
      }
    } catch {
      // Ignore if cache lookup fails
    }
  }

  if (!roleKey) {
    try {
      const role = await db.query.roles?.findFirst?.({
        where: eq(roles.id, roleId),
      });
      roleKey = role?.key;
    } catch {
      // Ignore if roles table lookup fails in lightweight test mocks
    }
  }

  // Fall back to static ROLE_PERMISSIONS only if no database permissions are configured for this role
  if (set.size === 0 && roleKey && ROLE_PERMISSIONS[roleKey]) {
    for (const p of ROLE_PERMISSIONS[roleKey]) {
      set.add(p);
    }
  }

  return set;
});

export interface CanInput {
  userId: string;
  organizationId?: string;
  permission: Permission;
  user?: { id: string; platformRole: string } | null;
  membership?: { roleId: string; status: string; organizationId: string } | null;
  role?: { id: string; key: string } | null;
  permissions?: readonly string[] | Set<string> | null;
}

export async function can(input: CanInput) {
  let platformRole = input.user && input.user.id === input.userId ? input.user.platformRole : undefined;
  if (platformRole === undefined) {
    const sessionUser = await getSessionUser().catch(() => null);
    if (sessionUser && sessionUser.id === input.userId) {
      platformRole = sessionUser.platformRole;
    }
  }
  if (platformRole === undefined) {
    const user = await db.query.users.findFirst({ where: (table, { eq }) => eq(table.id, input.userId) });
    platformRole = user?.platformRole;
  }
  if (platformRole === "PLATFORM_OWNER") return true;
  if (!input.organizationId) return false;

  let membership = input.membership;
  let role = input.role;
  let permissions = input.permissions;

  // Enforce tenant boundary: do not accept a membership from another organization
  if (membership && input.organizationId && membership.organizationId !== input.organizationId) {
    membership = undefined;
    role = undefined;
    permissions = undefined;
  }

  // Re-use request-scoped tenant context if available for this organization
  if (!membership) {
    const cached = await getCachedTenantContext(input.organizationId).catch(() => null);
    if (
      cached &&
      cached.user.id === input.userId &&
      cached.organization?.id === input.organizationId &&
      cached.membership?.status === "active"
    ) {
      membership = cached.membership;
      role = role ?? cached.role;
      permissions = permissions ?? cached.permissions;
    }
  }

  if (!membership) {
    membership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, input.userId),
        eq(memberships.organizationId, input.organizationId),
        eq(memberships.status, "active")
      ),
    });
  }
  if (!membership) return false;

  // Organization Owners have unrestricted tenant permissions by policy
  if (role?.key === "ORGANIZATION_OWNER") {
    return true;
  }

  // If permissions list or Set was provided in context or cached, check it directly
  if (permissions) {
    const hasPerm =
      permissions instanceof Set
        ? permissions.has(input.permission)
        : permissions.includes(input.permission);
    if (hasPerm) return true;
  }

  // Fast-path: check static role permissions first without hitting role_permissions table
  if (role?.key && ROLE_PERMISSIONS[role.key]) {
    if (ROLE_PERMISSIONS[role.key].includes(input.permission)) {
      return true;
    }
  }

  const permSet = await getRolePermissionSet(membership.roleId, role?.key);
  return permSet.has(input.permission);
}

export interface AuthorizeInput {
  organizationId?: string;
  permission: Permission;
  context?: {
    user?: Awaited<ReturnType<typeof requireSession>> | { id: string; platformRole: string } | null;
    membership?: { roleId: string; status: string; organizationId: string } | null;
    role?: { id: string; key: string } | null;
    permissions?: readonly string[] | Set<string> | null;
  } | null;
}

export async function authorize(input: AuthorizeInput) {
  let context = input.context;
  if (!context) {
    context = await getCachedTenantContext(input.organizationId).catch(() => null);
  }
  const user = (context?.user?.id ? context.user : await requireSession()) as Awaited<ReturnType<typeof requireSession>>;
  if (
    !(await can({
      userId: user.id,
      organizationId: input.organizationId,
      permission: input.permission,
      user,
      membership: context?.membership,
      role: context?.role,
      permissions: context?.permissions,
    }))
  ) {
    throw new AppError("FORBIDDEN", "You are not authorized to perform this action.", 403);
  }

  return user;
}

export interface CanAnyInput {
  userId: string;
  organizationId?: string;
  permissions: readonly Permission[];
  user?: { id: string; platformRole: string } | null;
  membership?: { roleId: string; status: string; organizationId: string } | null;
  role?: { id: string; key: string } | null;
  contextPermissions?: readonly string[] | Set<string> | null;
}

export async function canAny(input: CanAnyInput): Promise<boolean> {
  let platformRole = input.user && input.user.id === input.userId ? input.user.platformRole : undefined;
  if (platformRole === undefined) {
    const sessionUser = await getSessionUser().catch(() => null);
    if (sessionUser && sessionUser.id === input.userId) {
      platformRole = sessionUser.platformRole;
    }
  }
  if (platformRole === undefined) {
    const user = await db.query.users.findFirst({ where: (table, { eq }) => eq(table.id, input.userId) });
    platformRole = user?.platformRole;
  }
  if (platformRole === "PLATFORM_OWNER") return true;
  if (!input.organizationId) return false;

  let membership = input.membership;
  let role = input.role;
  let contextPermissions = input.contextPermissions;

  // Enforce tenant boundary: do not accept a membership from another organization
  if (membership && input.organizationId && membership.organizationId !== input.organizationId) {
    membership = undefined;
    role = undefined;
    contextPermissions = undefined;
  }

  if (!membership) {
    const cached = await getCachedTenantContext(input.organizationId).catch(() => null);
    if (
      cached &&
      cached.user.id === input.userId &&
      cached.organization?.id === input.organizationId &&
      cached.membership?.status === "active"
    ) {
      membership = cached.membership;
      role = role ?? cached.role;
      contextPermissions = contextPermissions ?? cached.permissions;
    }
  }

  if (!membership) {
    membership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, input.userId),
        eq(memberships.organizationId, input.organizationId),
        eq(memberships.status, "active")
      ),
    });
  }
  if (!membership) return false;

  if (role?.key === "ORGANIZATION_OWNER") {
    return true;
  }

  if (contextPermissions) {
    const hasAny =
      contextPermissions instanceof Set
        ? input.permissions.some((p) => (contextPermissions as Set<string>).has(p))
        : input.permissions.some((p) => (contextPermissions as readonly string[]).includes(p));
    if (hasAny) return true;
  }

  if (role?.key && ROLE_PERMISSIONS[role.key]) {
    const staticPerms = ROLE_PERMISSIONS[role.key];
    if (input.permissions.some((p) => staticPerms.includes(p))) {
      return true;
    }
  }

  const permSet = await getRolePermissionSet(membership.roleId, role?.key);
  return input.permissions.some((p) => permSet.has(p));
}

export interface AuthorizeAnyInput {
  organizationId?: string;
  permissions: readonly Permission[];
  context?: {
    user?: Awaited<ReturnType<typeof requireSession>> | { id: string; platformRole: string } | null;
    membership?: { roleId: string; status: string; organizationId: string } | null;
    role?: { id: string; key: string } | null;
    permissions?: readonly string[] | Set<string> | null;
  } | null;
}

export async function authorizeAny(input: AuthorizeAnyInput) {
  let context = input.context;
  if (!context) {
    context = await getCachedTenantContext(input.organizationId).catch(() => null);
  }
  const user = (context?.user?.id ? context.user : await requireSession()) as Awaited<ReturnType<typeof requireSession>>;
  if (
    !(await canAny({
      userId: user.id,
      organizationId: input.organizationId,
      permissions: input.permissions,
      user,
      membership: context?.membership,
      role: context?.role,
      contextPermissions: context?.permissions,
    }))
  ) {
    throw new AppError("FORBIDDEN", "You are not authorized to perform this action.", 403);
  }

  return user;
}



