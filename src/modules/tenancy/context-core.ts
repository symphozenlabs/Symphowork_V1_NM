import { and, eq } from "drizzle-orm";
import { db, withTenantTransaction } from "@/db/client";
import { memberships, organizations, roles, users } from "@/db/schema";
import { AppError } from "@/lib/errors";

type AuthenticatedUser = typeof users.$inferSelect;

export async function resolveTenantContextForUser(user: AuthenticatedUser, organizationId?: string) {
  if (user.platformRole === "PLATFORM_OWNER") return { user, organization: null, membership: null, role: null, permissions: [] as string[] };
  const membership = await db.query.memberships.findFirst({ where: and(eq(memberships.userId, user.id), eq(memberships.status, "active")) });
  if (!membership || (organizationId && membership.organizationId !== organizationId)) throw new AppError("ORG_ACCESS_DENIED", "You do not have access to this organization.", 403);
  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, membership.organizationId) });
  const role = await withTenantTransaction(membership.organizationId, (tx) => tx.query.roles.findFirst({ where: eq(roles.id, membership.roleId) }));
  if (!organization || organization.status !== "active" || !role) throw new AppError("ORG_NOT_FOUND", "Organization workspace is not available.", 404);
  return { user, organization, membership, role, permissions: [] as string[] };
}
