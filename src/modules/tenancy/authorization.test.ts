import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, requireSession, db } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  requireSession: vi.fn(),
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
}));

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser,
  requireSession,
}));

vi.mock("@/db/client", () => ({
  db,
}));

const { can, authorize } = await import("./authorization");

describe("tenancy authorization", () => {
  beforeEach(() => {
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
});
