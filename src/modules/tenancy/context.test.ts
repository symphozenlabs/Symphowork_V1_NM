import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSession = vi.fn();
const withTenantTransaction = vi.fn();

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

vi.mock("@/modules/identity/auth", () => ({ requireSession }));
vi.mock("@/db/client", () => ({ db, withTenantTransaction }));

const { resolveTenantContext } = await import("@/modules/tenancy/context");

describe("tenant context resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(db.query.memberships.findFirst).not.toHaveBeenCalled();
  });

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

  it("throws ORG_NOT_FOUND when organization is pending or not active", async () => {
    const user = { id: "user-pending", platformRole: "NONE" };
    const membership = { id: "mem-pending", userId: "user-pending", organizationId: "org-pending", roleId: "role-1", status: "active" };
    const organization = { id: "org-pending", name: "Pending Org", status: "pending" };
    const role = { id: "role-1", organizationId: "org-pending", key: "ORGANIZATION_OWNER" };

    requireSession.mockResolvedValueOnce(user);
    db.query.memberships.findFirst.mockResolvedValueOnce(membership);
    db.query.organizations.findFirst.mockResolvedValueOnce(organization);
    withTenantTransaction.mockImplementationOnce(async (_orgId: string, cb: (tx: unknown) => Promise<unknown>) => {
      const tx = { query: { roles: { findFirst: vi.fn().mockResolvedValue(role) } } };
      return cb(tx);
    });

    await expect(resolveTenantContext()).rejects.toMatchObject({
      code: "ORG_NOT_FOUND",
      message: "Organization workspace is not available.",
      status: 404,
    });
  });

  it("throws ORG_NOT_FOUND when organization is suspended", async () => {
    const user = { id: "user-suspended", platformRole: "NONE" };
    const membership = { id: "mem-suspended", userId: "user-suspended", organizationId: "org-suspended", roleId: "role-1", status: "active" };
    const organization = { id: "org-suspended", name: "Suspended Org", status: "suspended" };
    const role = { id: "role-1", organizationId: "org-suspended", key: "ORGANIZATION_OWNER" };

    requireSession.mockResolvedValueOnce(user);
    db.query.memberships.findFirst.mockResolvedValueOnce(membership);
    db.query.organizations.findFirst.mockResolvedValueOnce(organization);
    withTenantTransaction.mockImplementationOnce(async (_orgId: string, cb: (tx: unknown) => Promise<unknown>) => {
      const tx = { query: { roles: { findFirst: vi.fn().mockResolvedValue(role) } } };
      return cb(tx);
    });

    await expect(resolveTenantContext()).rejects.toMatchObject({
      code: "ORG_NOT_FOUND",
      message: "Organization workspace is not available.",
      status: 404,
    });
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
