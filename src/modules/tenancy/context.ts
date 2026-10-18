import { cookies } from "next/headers";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db, withTenantTransaction, withUserTransaction } from "@/db/client";
import { memberships, organizations, roles } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { ALL_PERMISSION_KEYS, ROLE_PERMISSIONS } from "@/modules/rbac/permissions";

export type TenantContext =
  | {
      user: Awaited<ReturnType<typeof requireSession>>;
      organization: null;
      membership: null;
      role: null;
      permissions: string[];
    }
  | {
      user: Awaited<ReturnType<typeof requireSession>>;
      organization: typeof organizations.$inferSelect;
      membership: typeof memberships.$inferSelect;
      role: typeof roles.$inferSelect;
      permissions: string[];
    };


// Request-scoped WeakMap cache keyed on the immutable ReadonlyRequestCookies object
const requestContextCache = new WeakMap<object, TenantContext>();

export async function getCachedTenantContext(organizationId?: string): Promise<TenantContext | null> {
  try {
    const cookieStore = await cookies();
    if (!cookieStore || typeof cookieStore !== "object") return null;
    const cached = requestContextCache.get(cookieStore);
    if (!cached) return null;
    if (cached.user.platformRole === "PLATFORM_OWNER") {
      return cached;
    }
    if (organizationId && (!cached.organization || cached.organization.id !== organizationId)) {
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

export function setCachedTenantContext(cookieStore: object, context: TenantContext): void {
  requestContextCache.set(cookieStore, context);
}

export function clearCachedTenantContext(cookieStore: object): void {
  requestContextCache.delete(cookieStore);
}

export const resolveTenantContext = cache(async (organizationId?: string) => {
  // Check request-scoped cache first if available for the requested organization
  const cached = await getCachedTenantContext(organizationId);
  if (cached) {
    return cached;
  }

  const user = await requireSession();
  if (user.platformRole === "PLATFORM_OWNER") {
    const platformResult: TenantContext = {
      user,
      organization: null,
      membership: null,
      role: null,
      permissions: [] as string[],
    };
    try {
      const cookieStore = await cookies();
      if (cookieStore && typeof cookieStore === "object") {
        requestContextCache.set(cookieStore, platformResult);
      }
    } catch {
      // Ignore in non-HTTP or test contexts
    }
    return platformResult;
  }

  const findMembership = async (targetDb: { query: { memberships: { findFirst: typeof db.query.memberships.findFirst } } }) =>
    targetDb.query.memberships.findFirst({
      where: organizationId
        ? and(eq(memberships.userId, user.id), eq(memberships.organizationId, organizationId), eq(memberships.status, "active"))
        : and(eq(memberships.userId, user.id), eq(memberships.status, "active")),
    });

  const membership = typeof withUserTransaction === "function"
    ? await withUserTransaction(user.id, (tx) => findMembership(tx))
    : await findMembership(db);

  if (!membership || (organizationId && membership.organizationId !== organizationId)) {
    throw new AppError("ORG_ACCESS_DENIED", "You do not have access to this organization.", 403);
  }

  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, membership.organizationId) });
  if (!organization || organization.status !== "active") {
    throw new AppError("ORG_NOT_FOUND", "Organization workspace is not available.", 404);
  }

  const role = await withTenantTransaction(membership.organizationId, (tx) =>
    tx.query.roles.findFirst({ where: eq(roles.id, membership.roleId) })
  );
  if (!role) {
    throw new AppError("ORG_NOT_FOUND", "Organization workspace is not available.", 404);
  }

  const permissions = (
    role.key === "ORGANIZATION_OWNER"
      ? Array.from(ALL_PERMISSION_KEYS)
      : role.key && ROLE_PERMISSIONS[role.key]
        ? Array.from(ROLE_PERMISSIONS[role.key])
        : []
  ) as string[];

  const result = { user, organization, membership, role, permissions };

  // Store in request-scoped cache for subsequent authorize() calls in the same request
  try {
    const cookieStore = await cookies();
    if (cookieStore && typeof cookieStore === "object") {
      requestContextCache.set(cookieStore, result);
    }
  } catch {
    // Ignore in non-HTTP or test contexts
  }

  return result;
});



