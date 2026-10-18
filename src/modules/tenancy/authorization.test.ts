import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, requireSession, db, mockCookies, cookies } = vi.hoisted(() => {
  let store: object | null = {};
  return {
    getSessionUser: vi.fn(),
    requireSession: vi.fn(),
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
    db: {
      query: {
        users: {
          findFirst: vi.fn(),
        },
        memberships: {
          findFirst: vi.fn(),
        },
      },
      select: vi.fn(),
    },
  };
});

vi.mock("next/headers", () => ({
  cookies,
}));

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser,
  requireSession,
}));

vi.mock("@/db/client", () => ({
  db,
}));

const { can, authorize, canAny, authorizeAny, getRolePermissionSet } = await import("./authorization");
const { setCachedTenantContext } = await import("@/modules/tenancy/context");

describe("tenancy authorization", () => {
  beforeEach(() => {
    mockCookies.setStore({});
    vi.clearAllMocks();
  });

  describe("duplicate user lookup optimization", () => {
    it("does not query users table when user object is provided in input", async () => {
      const user = { id: "user-opt", platformRole: "NONE" };
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      const result = await can({
        userId: "user-opt",
        organizationId: "org-1",
        permission: "employee.view" as never,
        user,
      });

      expect(result).toBe(false);
      expect(db.query.users.findFirst).not.toHaveBeenCalled();
    });

    it("does not query users table when getSessionUser provides matching active user", async () => {
      const sessionUser = { id: "user-session", platformRole: "NONE" };
      getSessionUser.mockResolvedValueOnce(sessionUser);
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      const result = await can({
        userId: "user-session",
        organizationId: "org-1",
        permission: "employee.view" as never,
      });

      expect(result).toBe(false);
      expect(db.query.users.findFirst).not.toHaveBeenCalled();
    });

    it("falls back to querying users table when user is not provided and session does not match", async () => {
      getSessionUser.mockResolvedValueOnce(null);
      db.query.users.findFirst.mockResolvedValueOnce({ id: "user-db", platformRole: "NONE" });
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      const result = await can({
        userId: "user-db",
        organizationId: "org-1",
        permission: "employee.view" as never,
      });

      expect(result).toBe(false);
      expect(db.query.users.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe("platform owner bypass", () => {
    it("returns true for PLATFORM_OWNER even without organizationId", async () => {
      const result = await can({
        userId: "admin-1",
        permission: "settings.manage" as never,
        user: { id: "admin-1", platformRole: "PLATFORM_OWNER" },
      });

      expect(result).toBe(true);
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });

    it("returns true for PLATFORM_OWNER with organizationId without querying membership", async () => {
      const result = await can({
        userId: "admin-1",
        organizationId: "org-any",
        permission: "settings.manage" as never,
        user: { id: "admin-1", platformRole: "PLATFORM_OWNER" },
      });

      expect(result).toBe(true);
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("tenant boundaries and role permissions", () => {
    it("returns false when organizationId is missing for non-platform user", async () => {
      const result = await can({
        userId: "user-regular",
        permission: "employee.view" as never,
        user: { id: "user-regular", platformRole: "NONE" },
      });

      expect(result).toBe(false);
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });

    it("returns false when user has no active membership in target organization", async () => {
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      const result = await can({
        userId: "user-regular",
        organizationId: "org-target",
        permission: "employee.view" as never,
        user: { id: "user-regular", platformRole: "NONE" },
      });

      expect(result).toBe(false);
      expect(db.query.memberships.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
      });
    });

    it("returns true when active membership role has permission", async () => {
      const membership = {
        id: "mem-1",
        userId: "user-member",
        organizationId: "org-1",
        roleId: "role-mgr",
        status: "active",
      };
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { key: "employee.view" },
              { key: "employee.invite" },
            ]),
          }),
        }),
      });

      const result = await can({
        userId: "user-member",
        organizationId: "org-1",
        permission: "employee.view" as never,
        user: { id: "user-member", platformRole: "NONE" },
      });

      expect(result).toBe(true);
    });

    it("returns false when active membership role lacks the requested permission", async () => {
      const membership = {
        id: "mem-2",
        userId: "user-member",
        organizationId: "org-1",
        roleId: "role-viewer",
        status: "active",
      };
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { key: "employee.view" },
            ]),
          }),
        }),
      });

      const result = await can({
        userId: "user-member",
        organizationId: "org-1",
        permission: "employee.delete" as never,
        user: { id: "user-member", platformRole: "NONE" },
      });

      expect(result).toBe(false);
    });
  });

  describe("authorize helper", () => {
    it("returns session user when authorized and avoids duplicate user lookup", async () => {
      const sessionUser = { id: "user-auth", platformRole: "PLATFORM_OWNER" };
      requireSession.mockResolvedValueOnce(sessionUser);

      const authorizedUser = await authorize({
        organizationId: "org-1",
        permission: "settings.view" as never,
      });

      expect(authorizedUser).toEqual(sessionUser);
      expect(db.query.users.findFirst).not.toHaveBeenCalled();
    });

    it("throws AppError FORBIDDEN 403 when access is denied", async () => {
      const sessionUser = { id: "user-denied", platformRole: "NONE" };
      requireSession.mockResolvedValueOnce(sessionUser);
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      await expect(
        authorize({
          organizationId: "org-1",
          permission: "settings.manage" as never,
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
      expect(db.query.users.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("canAny and authorizeAny helpers", () => {
    it("canAny returns true when PLATFORM_OWNER even without organizationId", async () => {
      const result = await canAny({
        userId: "admin-1",
        permissions: ["workflow.approve" as never, "leave.approve" as never],
        user: { id: "admin-1", platformRole: "PLATFORM_OWNER" },
      });
      expect(result).toBe(true);
    });

    it("canAny returns true when role has any of the requested permissions", async () => {
      const membership = {
        id: "mem-1",
        userId: "user-member",
        organizationId: "org-1",
        roleId: "role-approver",
        status: "active",
      };
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { key: "leave.approve" },
            ]),
          }),
        }),
      });

      const result = await canAny({
        userId: "user-member",
        organizationId: "org-1",
        permissions: ["workflow.approve" as never, "leave.approve" as never],
        user: { id: "user-member", platformRole: "NONE" },
      });

      expect(result).toBe(true);
    });

    it("canAny returns false when role lacks all of the requested permissions", async () => {
      const membership = {
        id: "mem-emp",
        userId: "user-emp",
        organizationId: "org-1",
        roleId: "role-employee",
        status: "active",
      };
      db.query.memberships.findFirst.mockResolvedValueOnce(membership);

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { key: "attendance.read" },
              { key: "leave.read" },
            ]),
          }),
        }),
      });

      const result = await canAny({
        userId: "user-emp",
        organizationId: "org-1",
        permissions: ["workflow.approve" as never, "leave.approve" as never],
        user: { id: "user-emp", platformRole: "NONE" },
      });

      expect(result).toBe(false);
    });

    it("authorizeAny throws FORBIDDEN 403 when user lacks permissions", async () => {
      const sessionUser = { id: "user-emp", platformRole: "NONE" };
      requireSession.mockResolvedValueOnce(sessionUser);
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      await expect(
        authorizeAny({
          organizationId: "org-1",
          permissions: ["workflow.approve" as never],
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });

    it("authorizeAny succeeds and returns user when authorized", async () => {
      const sessionUser = { id: "user-admin", platformRole: "PLATFORM_OWNER" };
      requireSession.mockResolvedValueOnce(sessionUser);

      const user = await authorizeAny({
        organizationId: "org-1",
        permissions: ["workflow.approve" as never],
      });

      expect(user).toEqual(sessionUser);
    });
  });

  describe("Phase 1 context reuse, tenant isolation, and role permissions", () => {
    it("reusing resolved context avoids duplicate session, membership, and role queries", async () => {
      const user = { id: "user-hr", platformRole: "NONE" };
      const membership = {
        roleId: "role-hr-admin",
        status: "active",
        organizationId: "org-alpha",
      };
      const role = { id: "role-hr-admin", key: "HR_ADMIN" };

      // HR_ADMIN statically has employee.read
      const authorizedUser = await authorize({
        organizationId: "org-alpha",
        permission: "employee.read" as never,
        context: { user, membership, role },
      });

      expect(authorizedUser).toEqual(user);
      expect(requireSession).not.toHaveBeenCalled();
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
      expect(db.select).not.toHaveBeenCalled();
    });

    it("Organization Owner bypasses role permissions database query completely", async () => {
      const user = { id: "owner-1", platformRole: "NONE" };
      const membership = {
        roleId: "role-owner",
        status: "active",
        organizationId: "org-alpha",
      };
      const role = { id: "role-owner", key: "ORGANIZATION_OWNER" };

      const result = await can({
        userId: "owner-1",
        organizationId: "org-alpha",
        permission: "payroll.finalize" as never,
        user,
        membership,
        role,
      });

      expect(result).toBe(true);
      expect(db.select).not.toHaveBeenCalled();
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });

    it("enforces tenant isolation when context organizationId does not match request organizationId", async () => {
      const user = { id: "user-1", platformRole: "NONE" };
      // Context is for org-alpha
      const membership = {
        roleId: "role-1",
        status: "active",
        organizationId: "org-alpha",
      };
      const role = { id: "role-1", key: "HR_ADMIN" };

      // Request is for org-beta -> membership for org-beta must be looked up in DB
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      const result = await can({
        userId: "user-1",
        organizationId: "org-beta",
        permission: "employee.read" as never,
        user,
        membership,
        role,
      });

      expect(result).toBe(false);
      expect(db.query.memberships.findFirst).toHaveBeenCalledTimes(1);

    });

    it("fails with 403 when active user lacks required permission", async () => {
      const user = { id: "emp-1", platformRole: "NONE" };
      const membership = {
        roleId: "role-employee",
        status: "active",
        organizationId: "org-alpha",
      };
      const role = { id: "role-employee", key: "EMPLOYEE" };

      // EMPLOYEE does not have payroll.finalize in static permissions
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        authorize({
          organizationId: "org-alpha",
          permission: "payroll.finalize" as never,
          context: { user, membership, role },
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });

    it("authorizeAny reuses context without duplicate queries for matching static permissions", async () => {
      const user = { id: "mgr-1", platformRole: "NONE" };
      const membership = {
        roleId: "role-mgr",
        status: "active",
        organizationId: "org-alpha",
      };
      const role = { id: "role-mgr", key: "MANAGER" };

      // MANAGER statically has leave.approve
      const result = await authorizeAny({
        organizationId: "org-alpha",
        permissions: ["leave.approve" as never, "payroll.finalize" as never],
        context: { user, membership, role },
      });

      expect(result).toEqual(user);
      expect(requireSession).not.toHaveBeenCalled();
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
      expect(db.select).not.toHaveBeenCalled();
    });

    it("propagates UNAUTHORIZED when session is missing in authorize", async () => {
      requireSession.mockRejectedValueOnce({
        code: "UNAUTHORIZED",
        message: "Authentication required.",
        status: 401,
      });

      await expect(
        authorize({
          organizationId: "org-alpha",
          permission: "employee.read" as never,
        })
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        status: 401,
      });
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });

    it("propagates SESSION_EXPIRED when session is expired in authorize", async () => {
      requireSession.mockRejectedValueOnce({
        code: "SESSION_EXPIRED",
        message: "Session expired.",
        status: 401,
      });

      await expect(
        authorize({
          organizationId: "org-alpha",
          permission: "employee.read" as never,
        })
      ).rejects.toMatchObject({
        code: "SESSION_EXPIRED",
        status: 401,
      });
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
    });

    it("automatically picks up cached request context in authorize without explicit context argument", async () => {
      const user = { id: "user-cached", platformRole: "NONE" };
      const membership = {
        id: "mem-cached",
        userId: "user-cached",
        roleId: "role-cached",
        status: "active",
        organizationId: "org-auto",
      };
      const role = { id: "role-cached", key: "HR_ADMIN" };
      const currentStore = mockCookies.getStore()!;

      setCachedTenantContext(currentStore, {
        user: user as never,
        organization: { id: "org-auto", name: "Auto Org", status: "active" } as never,
        membership: membership as never,
        role: role as never,
        permissions: ["employee.read"],
      });

      const authorizedUser = await authorize({
        organizationId: "org-auto",
        permission: "employee.read" as never,
      });

      expect(authorizedUser).toEqual(user);
      expect(requireSession).not.toHaveBeenCalled();
      expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
      expect(db.select).not.toHaveBeenCalled();
    });

    it("does not leak cached context of user-1 when authorizing user-2", async () => {
      const user1 = { id: "user-1", platformRole: "NONE" };
      const currentStore = mockCookies.getStore()!;

      setCachedTenantContext(currentStore, {
        user: user1 as never,
        organization: { id: "org-alpha", name: "Alpha", status: "active" } as never,
        membership: { roleId: "role-1", status: "active", organizationId: "org-alpha" } as never,
        role: { id: "role-1", key: "HR_ADMIN" } as never,
        permissions: ["employee.read"],
      });

      // Target user is user-2, but context belongs to user-1 -> must fall back to DB
      db.query.memberships.findFirst.mockResolvedValueOnce(null);

      const result = await can({
        userId: "user-2",
        organizationId: "org-alpha",
        permission: "employee.read" as never,
        user: { id: "user-2", platformRole: "NONE" },
      });

      expect(result).toBe(false);
      // DB was called for user-2
      expect(db.query.memberships.findFirst).toHaveBeenCalledTimes(1);
    });

    it("falls back to role_permissions join table for custom roles not in static set", async () => {
      const user = { id: "user-custom", platformRole: "NONE" };
      const membership = {
        roleId: "role-custom-99",
        status: "active",
        organizationId: "org-alpha",
      };
      const role = { id: "role-custom-99", key: "CUSTOM_AUDITOR" };

      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ key: "report.view" }]),
          }),
        }),
      });

      const result = await can({
        userId: "user-custom",
        organizationId: "org-alpha",
        permission: "report.view" as never,
        user,
        membership,
        role,
      });

      expect(result).toBe(true);
      expect(db.select).toHaveBeenCalledTimes(1);
    });

    it("respects database revocations for standard roles when role_permissions rows exist", async () => {
      // HR_ADMIN default ROLE_PERMISSIONS has many permissions,
      // but database role_permissions configuration only has employee.read (revoked others)
      db.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ key: "employee.read" }]),
          }),
        }),
      });

      const permSet = await getRolePermissionSet("role-hr-revoked", "HR_ADMIN");

      expect(permSet.has("employee.read")).toBe(true);
      // Database omitted employee.delete, so static ROLE_PERMISSIONS must not add it back
      expect(permSet.has("employee.delete")).toBe(false);
      expect(permSet.has("department.manage")).toBe(false);
      expect(permSet.size).toBe(1);
      expect(db.select).toHaveBeenCalledTimes(1);
    });
  });
});

