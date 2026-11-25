import { getRequestEvent } from "$app/server";
import { memoizeRequest, getRequestCacheStore } from '@/lib/server/request-cache';
import { and, eq } from "drizzle-orm";
import { db, withPlatformTransaction, withTenantTransaction, withUserTransaction } from "@/db/client";
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

// Request-scoped WeakMap cache keyed on the immutable RequestEvent cookies object
const requestContextCache = new WeakMap<object, TenantContext>();

export async function getCachedTenantContext(organizationId?: string): Promise<TenantContext | null> {
  const store = getRequestCacheStore?.();
  if (store) {
    const svelteContext = store.sharedData.get("svelteContext");
    if (svelteContext) {
      if (svelteContext.user.platformRole === "PLATFORM_OWNER") {
        return {
          user: svelteContext.user,
          organization: null,
          membership: null,
          role: null,
          permissions: [],
        };
      }
      if (!organizationId || (svelteContext.organization && svelteContext.organization.id === organizationId)) {
        if (svelteContext.organization && svelteContext.membership && svelteContext.role) {
          return {
            user: svelteContext.user,
            organization: svelteContext.organization,
            membership: { ...svelteContext.membership, roleId: svelteContext.role.id },
            role: svelteContext.role,
            permissions: svelteContext.permissions ?? [],
          } as TenantContext;
        }
      }
    }
    const cached = store.sharedData.get("tenantContext");
    if (cached) {
      if (cached.user.platformRole === "PLATFORM_OWNER") return cached;
      if (!organizationId || (cached.organization && cached.organization.id === organizationId)) {
        return cached;
      }
    }
  }

  try {
    const cookieStore = getRequestEvent().cookies;
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
  const store = getRequestCacheStore?.();
  if (store) {
    store.sharedData.set("tenantContext", context);
  }
  requestContextCache.set(cookieStore, context);
}

export function clearCachedTenantContext(cookieStore: object): void {
  const store = getRequestCacheStore?.();
  if (store) {
    store.sharedData.delete("tenantContext");
  }
  requestContextCache.delete(cookieStore);
}

export const resolveTenantContext = memoizeRequest(async (organizationId?: string) => {
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
      const cookieStore = getRequestEvent().cookies;
      if (cookieStore && typeof cookieStore === "object") {
        setCachedTenantContext(cookieStore, platformResult);
      }
    } catch {
      // Ignore in non-HTTP or test contexts
    }
    return platformResult;
  }

  let membership: typeof memberships.$inferSelect | undefined;
  let organization: typeof organizations.$inferSelect | undefined;
  let role: typeof roles.$inferSelect | undefined;

  try {
    const rows = await db
      .select({
        membership: memberships,
        organization: organizations,
        role: roles,
      })
      .from(memberships)
      .innerJoin(organizations, and(eq(organizations.id, memberships.organizationId), eq(organizations.status, "active")))
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .where(
        organizationId
          ? and(eq(memberships.userId, user.id), eq(memberships.organizationId, organizationId), eq(memberships.status, "active"))
          : and(eq(memberships.userId, user.id), eq(memberships.status, "active"))
      )
      .limit(1);

    if (rows[0]) {
      membership = rows[0].membership;
      organization = rows[0].organization;
      role = rows[0].role;
    }
  } catch {
    // Fall back to query api if select is mocked differently in tests
  }

  if (!membership || !organization || !role) {
    const findMembership = async (targetDb: { query: { memberships: { findFirst: typeof db.query.memberships.findFirst } } }) =>
      targetDb.query.memberships.findFirst({
        where: organizationId
          ? and(eq(memberships.userId, user.id), eq(memberships.organizationId, organizationId), eq(memberships.status, "active"))
          : and(eq(memberships.userId, user.id), eq(memberships.status, "active")),
      });

    membership = typeof withUserTransaction === "function"
      ? await withUserTransaction(user.id, (tx) => findMembership(tx))
      : await findMembership(db);

    if (!membership && typeof withPlatformTransaction === "function") {
      membership = await withPlatformTransaction((tx) => findMembership(tx));
    }

    if (!membership || (organizationId && membership.organizationId !== organizationId)) {
      throw new AppError("ORG_ACCESS_DENIED", "You do not have access to this organization.", 403);
    }

    const orgFound = await db.query.organizations.findFirst({ where: eq(organizations.id, membership.organizationId) });
    if (!orgFound || orgFound.status !== "active") {
      throw new AppError("ORG_NOT_FOUND", "Organization workspace is not available.", 404);
    }
    organization = orgFound;

    const roleFound = await withTenantTransaction(membership.organizationId, (tx) =>
      tx.query.roles.findFirst({ where: eq(roles.id, membership!.roleId) })
    );
    if (!roleFound) {
      throw new AppError("ORG_NOT_FOUND", "Organization workspace is not available.", 404);
    }
    role = roleFound;
  }

  const permissions = (
    role.key === "ORGANIZATION_OWNER"
      ? Array.from(ALL_PERMISSION_KEYS)
      : role.key && ROLE_PERMISSIONS[role.key]
        ? Array.from(ROLE_PERMISSIONS[role.key])
        : []
  ) as string[];

  const result: TenantContext = { user, organization, membership, role, permissions };

  // Store in request-scoped cache for subsequent authorize() calls in the same request
  try {
    const cookieStore = getRequestEvent().cookies;
    if (cookieStore && typeof cookieStore === "object") {
      setCachedTenantContext(cookieStore, result);
    }
  } catch {
    // Ignore in non-HTTP or test contexts
  }

  const store = getRequestCacheStore?.();
  if (store) {
    store.sharedData.set("tenantContext", result);
  }

  return result;
});
