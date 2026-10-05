import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships, permissions, rolePermissions } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import type { Permission } from "@/modules/rbac/permissions";

export const getRolePermissionSet = cache(async (roleId: string): Promise<Set<string>> => {
  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  return new Set(rows.map((r) => r.key));
});

export async function can(input: { userId: string; organizationId?: string; permission: Permission }) {
  const user = await db.query.users.findFirst({ where: (table, { eq }) => eq(table.id, input.userId) });
  if (user?.platformRole === "PLATFORM_OWNER") return true;
  if (!input.organizationId) return false;
  const membership = await db.query.memberships.findFirst({ where: and(eq(memberships.userId, input.userId), eq(memberships.organizationId, input.organizationId), eq(memberships.status, "active")) });
  if (!membership) return false;
  const permSet = await getRolePermissionSet(membership.roleId);
  return permSet.has(input.permission);
}

export async function authorize(input: { organizationId?: string; permission: Permission }) {
  const user = await requireSession();
  if (!(await can({ userId: user.id, organizationId: input.organizationId, permission: input.permission }))) throw new AppError("FORBIDDEN", "You are not authorized to perform this action.", 403);
  return user;
}
