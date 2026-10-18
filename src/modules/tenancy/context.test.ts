import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookies, cookies } = vi.hoisted(() => {
  let store: object | null = {};
  return {
    mockCookies: {
      getStore: () => store,
      setStore: (s: object | null) => {
        store = s;
      },
    },
    cookies: vi.fn(async () => {
      if (store === null) throw new Error("cookies() called outside request scope");
      return store;
    }),
  };
});

const requireSession = vi.fn();
const withTenantTransaction = vi.fn();
const withUserTransaction = vi.fn(async (_userId: string, cb: (tx: unknown) => Promise<unknown>) => cb(db));

const db = {
  query: {
    memberships: {
      findFirst: vi.fn(),
    },
    organizations: {
      findFirst: vi.fn(),
    },
  },
};

vi.mock("next/headers", () => ({ cookies }));
vi.mock("@/modules/identity/auth", () => ({ requireSession }));
vi.mock("@/db/client", () => ({ db, withTenantTransaction, withUserTransaction }));

const {
  resolveTenantContext,
  getCachedTenantContext,
  setCachedTenantContext,
  clearCachedTenantContext,
} = await import("@/modules/tenancy/context");

describe("tenant context resolution", () => {
  beforeEach(() => {
    mockCookies.setStore({});
    vi.clearAllMocks();
  });

  describe("session validation", () => {
    it("propagates UNAUTHORIZED when session is missing", async () => {
      requireSession.mockRejectedValueOnce({
        code: "UNAUTHORIZED",
        message: "Authentication required.",
        status: 401,
      });

      await expect(resolveTenantContext("org-1")).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        status: 401,
      });
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });

    it("propagates SESSION_EXPIRED when session has expired", async () => {
      requireSession.mockRejectedValueOnce({
        code: "SESSION_EXPIRED",
        message: "Your session has expired.",
        status: 401,
      });

      await expect(resolveTenantContext("org-1")).rejects.toMatchObject({
        code: "SESSION_EXPIRED",
        status: 401,
      });
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("platform owner resolution and caching", () => {
    it("returns null organization and empty permissions for PLATFORM_OWNER", async () => {
      requireSession.mockResolvedValueOnce({
        id: "platform-owner-id",
        email: "owner@platform.local",
        platformRole: "PLATFORM_OWNER",
      });

      const context = await resolveTenantContext();

      expect(context.user.id).toBe("platform-owner-id");
      expect(context.organization).toBeNull();
      expect(context.membership).toBeNull();
      expect(context.role).toBeNull();
      expect(context.permissions).toEqual([]);
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });

    it("caches PLATFORM_OWNER within the same request to avoid duplicate requireSession calls", async () => {
      requireSession.mockResolvedValueOnce({
        id: "platform-owner-id",
        email: "owner@platform.local",
        platformRole: "PLATFORM_OWNER",
      });

      const ctx1 = await resolveTenantContext();
      expect(ctx1.user.platformRole).toBe("PLATFORM_OWNER");
      expect(requireSession).toHaveBeenCalledTimes(1);

      // Second resolution within the same request reuses cached context
      const ctx2 = await resolveTenantContext();
      expect(ctx2).toBe(ctx1);
      expect(requireSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("organization membership and tenant validation", () => {
    it("resolves full tenant context for active organization member", async () => {
      const user = { id: "user-1", email: "user1@org.local", platformRole: "NONE" };
      const membership = { id: "mem-1", userId: "user-1", organizationId: "org-1", roleId: "role-1", status: "active" };
      const organization = { id: "org-1", name: "Acme Corp", status: "active" };
      const role = { id: "role-1", organizationId: "org-1", key: "ORGANIZATION_OWNER" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);
      db.query.organizations.findFirst.mockResolvedValueOnce(organization);
      withTenantTransaction.mockImplementationOnce(async (_orgId: string, cb: (tx: unknown) => Promise<unknown>) => {
        const tx = { query: { roles: { findFirst: vi.fn().mockResolvedValue(role) } } };
        return cb(tx);
      });

      const context = await resolveTenantContext();

      expect(context.user.id).toBe("user-1");
      expect(context.organization).toEqual(organization);
      expect(context.membership).toEqual(membership);
      expect(context.role).toEqual(role);
    });

    it("throws ORG_ACCESS_DENIED when user has no active membership", async () => {
      requireSession.mockResolvedValueOnce({ id: "user-no-mem", platformRole: "NONE" });
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      await expect(resolveTenantContext()).rejects.toMatchObject({
        code: "ORG_ACCESS_DENIED",
        message: "You do not have access to this organization.",
        status: 403,
      });
    });

    it("throws ORG_ACCESS_DENIED when user membership is for a different organization", async () => {
      const user = { id: "user-other", platformRole: "NONE" };
      // User has membership in org-alpha, but requested org-beta
      const membership = { id: "mem-other", userId: "user-other", organizationId: "org-alpha", roleId: "role-1", status: "active" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);

      await expect(resolveTenantContext("org-beta")).rejects.toMatchObject({
        code: "ORG_ACCESS_DENIED",
        status: 403,
      });
      expect(db.query.organizations.findFirst).not.toHaveBeenCalled();
      expect(withTenantTransaction).not.toHaveBeenCalled();
    });

    it("throws ORG_NOT_FOUND without calling withTenantTransaction when organization is pending or not active", async () => {
      const user = { id: "user-pending", platformRole: "NONE" };
      const membership = { id: "mem-pending", userId: "user-pending", organizationId: "org-pending", roleId: "role-1", status: "active" };
      const organization = { id: "org-pending", name: "Pending Org", status: "pending" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);
      db.query.organizations.findFirst.mockResolvedValueOnce(organization);

      await expect(resolveTenantContext()).rejects.toMatchObject({
        code: "ORG_NOT_FOUND",
        message: "Organization workspace is not available.",
        status: 404,
      });
      // Early exit avoids running withTenantTransaction for inactive organizations
      expect(withTenantTransaction).not.toHaveBeenCalled();
    });

    it("throws ORG_NOT_FOUND without calling withTenantTransaction when organization is suspended", async () => {
      const user = { id: "user-suspended", platformRole: "NONE" };
      const membership = { id: "mem-suspended", userId: "user-suspended", organizationId: "org-suspended", roleId: "role-1", status: "active" };
      const organization = { id: "org-suspended", name: "Suspended Org", status: "suspended" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);
      db.query.organizations.findFirst.mockResolvedValueOnce(organization);

      await expect(resolveTenantContext()).rejects.toMatchObject({
        code: "ORG_NOT_FOUND",
        message: "Organization workspace is not available.",
        status: 404,
      });
      expect(withTenantTransaction).not.toHaveBeenCalled();
    });

    it("throws ORG_NOT_FOUND when role is missing or unlinked", async () => {
      const user = { id: "user-norole", platformRole: "NONE" };
      const membership = { id: "mem-norole", userId: "user-norole", organizationId: "org-active", roleId: "role-missing", status: "active" };
      const organization = { id: "org-active", name: "Active Org", status: "active" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);
      db.query.organizations.findFirst.mockResolvedValueOnce(organization);
      withTenantTransaction.mockImplementationOnce(async (_orgId: string, cb: (tx: unknown) => Promise<unknown>) => {
        const tx = { query: { roles: { findFirst: vi.fn().mockResolvedValue(null) } } };
        return cb(tx);
      });

      await expect(resolveTenantContext()).rejects.toMatchObject({
        code: "ORG_NOT_FOUND",
        message: "Organization workspace is not available.",
        status: 404,
      });
    });
  });

  describe("request-scoped context cache, reuse, and tenant isolation", () => {
    it("reuses resolved context within the same request without repeating database queries", async () => {
      const user = { id: "user-reuse", email: "reuse@org.local", platformRole: "NONE" };
      const membership = { id: "mem-reuse", userId: "user-reuse", organizationId: "org-reuse", roleId: "role-reuse", status: "active" };
      const organization = { id: "org-reuse", name: "Reuse Org", status: "active" };
      const role = { id: "role-reuse", organizationId: "org-reuse", key: "HR_ADMIN" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);
      db.query.organizations.findFirst.mockResolvedValueOnce(organization);
      withTenantTransaction.mockImplementationOnce(async (_orgId: string, cb: (tx: unknown) => Promise<unknown>) => {
        const tx = { query: { roles: { findFirst: vi.fn().mockResolvedValue(role) } } };
        return cb(tx);
      });

      // First resolution - executes queries and caches in requestContextCache
      const ctx1 = await resolveTenantContext("org-reuse");
      expect(ctx1.organization?.id).toBe("org-reuse");
      expect(requireSession).toHaveBeenCalledTimes(1);
      expect(db.query.memberships.findFirst).toHaveBeenCalledTimes(1);
      expect(db.query.organizations.findFirst).toHaveBeenCalledTimes(1);
      expect(withTenantTransaction).toHaveBeenCalledTimes(1);

      // Second resolution within same request - uses cache, zero additional queries
      const ctx2 = await resolveTenantContext("org-reuse");
      expect(ctx2).toBe(ctx1);
      expect(requireSession).toHaveBeenCalledTimes(1);
      expect(db.query.memberships.findFirst).toHaveBeenCalledTimes(1);
      expect(db.query.organizations.findFirst).toHaveBeenCalledTimes(1);
      expect(withTenantTransaction).toHaveBeenCalledTimes(1);
    });

    it("enforces cross-tenant isolation in request cache", async () => {
      const user = { id: "user-iso", platformRole: "NONE" };
      const membership = { id: "mem-a", userId: "user-iso", organizationId: "org-alpha", roleId: "role-a", status: "active" };
      const organization = { id: "org-alpha", name: "Alpha", status: "active" };
      const role = { id: "role-a", organizationId: "org-alpha", key: "EMPLOYEE" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);
      db.query.organizations.findFirst.mockResolvedValueOnce(organization);
      withTenantTransaction.mockImplementationOnce(async (_orgId: string, cb: (tx: unknown) => Promise<unknown>) => {
        const tx = { query: { roles: { findFirst: vi.fn().mockResolvedValue(role) } } };
        return cb(tx);
      });

      await resolveTenantContext("org-alpha");

      // Cache lookup for a different organization must return null
      const cachedBeta = await getCachedTenantContext("org-beta");
      expect(cachedBeta).toBeNull();
    });

    it("ensures no context leakage between distinct requests", async () => {
      const user = { id: "user-req1", platformRole: "NONE" };
      const membership = { id: "mem-1", userId: "user-req1", organizationId: "org-1", roleId: "role-1", status: "active" };
      const organization = { id: "org-1", name: "Org 1", status: "active" };
      const role = { id: "role-1", organizationId: "org-1", key: "EMPLOYEE" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);
      db.query.organizations.findFirst.mockResolvedValueOnce(organization);
      withTenantTransaction.mockImplementationOnce(async (_orgId: string, cb: (tx: unknown) => Promise<unknown>) => {
        const tx = { query: { roles: { findFirst: vi.fn().mockResolvedValue(role) } } };
        return cb(tx);
      });

      // Request A
      await resolveTenantContext("org-1");
      const cachedA = await getCachedTenantContext("org-1");
      expect(cachedA).not.toBeNull();

      // Request B (new cookie store instance)
      mockCookies.setStore({});
      const cachedB = await getCachedTenantContext("org-1");
      expect(cachedB).toBeNull();
    });

    it("safely falls back to null when cookies() throws outside request scope", async () => {
      mockCookies.setStore(null);
      const cached = await getCachedTenantContext("org-1");
      expect(cached).toBeNull();
    });

    it("verifies withUserTransaction and withTenantTransaction are called to establish RLS context", async () => {
      const user = { id: "user-rls", email: "rls@org.local", platformRole: "NONE" };
      const membership = { id: "mem-rls", userId: "user-rls", organizationId: "org-rls", roleId: "role-rls", status: "active" };
      const organization = { id: "org-rls", name: "RLS Org", status: "active" };
      const role = { id: "role-rls", organizationId: "org-rls", key: "HR_ADMIN" };

      requireSession.mockResolvedValueOnce(user);
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);
      db.query.organizations.findFirst.mockResolvedValueOnce(organization);
      withTenantTransaction.mockImplementationOnce(async (_orgId: string, cb: (tx: unknown) => Promise<unknown>) => {
        const tx = { query: { roles: { findFirst: vi.fn().mockResolvedValue(role) } } };
        return cb(tx);
      });

      const context = await resolveTenantContext("org-rls");

      expect(withUserTransaction).toHaveBeenCalledWith("user-rls", expect.any(Function));
      expect(withTenantTransaction).toHaveBeenCalledWith("org-rls", expect.any(Function));
      expect(context.organization?.id).toBe("org-rls");
      expect(context.role?.key).toBe("HR_ADMIN");
      expect(context.permissions).toContain("employee.read");
    });

    it("setCachedTenantContext and clearCachedTenantContext manipulate request cache explicitly", async () => {
      const mockStore = {};
      const mockContext = {
        user: { id: "user-explicit", platformRole: "NONE" },
        organization: { id: "org-explicit", name: "Explicit Org", status: "active" },
        membership: { id: "mem-explicit", userId: "user-explicit", organizationId: "org-explicit", roleId: "role-explicit", status: "active" },
        role: { id: "role-explicit", organizationId: "org-explicit", key: "HR_ADMIN" },
        permissions: ["employee.read"],
      };

      setCachedTenantContext(mockStore, mockContext as never);
      mockCookies.setStore(mockStore);

      const cached = await getCachedTenantContext("org-explicit");
      expect(cached).toEqual(mockContext);

      clearCachedTenantContext(mockStore);
      const afterClear = await getCachedTenantContext("org-explicit");
      expect(afterClear).toBeNull();
    });
  });
});

