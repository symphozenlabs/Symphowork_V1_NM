import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships, permissions, rolePermissions, roles } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { getSessionUser, requireSession } from "@/modules/identity/auth";
import { type Permission, ROLE_PERMISSIONS } from "@/modules/rbac/permissions";

export const getRolePermissionSet = cache(async (roleId: string): Promise<Set<string>> => {
  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  const set = new Set(rows.map((r) => r.key));

  try {
    const role = await db.query.roles?.findFirst?.({
      where: eq(roles.id, roleId),
    });
    if (role && role.key && ROLE_PERMISSIONS[role.key]) {
      for (const p of ROLE_PERMISSIONS[role.key]) {
        set.add(p);
      }
    }
  } catch {
    // Ignore if roles table lookup fails in lightweight test mocks
  }

  return set;
});

export interface CanInput {
  userId: string;
  organizationId?: string;
  permission: Permission;
  user?: { id: string; platformRole: string } | null;
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
  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, input.userId),
      eq(memberships.organizationId, input.organizationId),
      eq(memberships.status, "active")
    ),
  });
  if (!membership) return false;
  const permSet = await getRolePermissionSet(membership.roleId);
  return permSet.has(input.permission);
}

export async function authorize(input: { organizationId?: string; permission: Permission }) {
  const user = await requireSession();
  if (!(await can({ userId: user.id, organizationId: input.organizationId, permission: input.permission, user }))) {
    throw new AppError("FORBIDDEN", "You are not authorized to perform this action.", 403);
  }
  return user;
}

export interface CanAnyInput {
  userId: string;
  organizationId?: string;
  permissions: readonly Permission[];
  user?: { id: string; platformRole: string } | null;
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
  const membership = await db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, input.userId),
      eq(memberships.organizationId, input.organizationId),
      eq(memberships.status, "active")
    ),
  });
  if (!membership) return false;
  const permSet = await getRolePermissionSet(membership.roleId);
  return input.permissions.some((p) => permSet.has(p));
}

export async function authorizeAny(input: { organizationId?: string; permissions: readonly Permission[] }) {
  const user = await requireSession();
  if (!(await canAny({ userId: user.id, organizationId: input.organizationId, permissions: input.permissions, user }))) {
    throw new AppError("FORBIDDEN", "You are not authorized to perform this action.", 403);
  }
  return user;
}

