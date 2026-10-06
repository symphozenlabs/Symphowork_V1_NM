import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, invitations, memberships, onboarding, organizations, users } from "@/db/schema";

const withInvitationTokenTransaction = vi.fn();
const recordAuditInTransaction = vi.fn();
const recordAudit = vi.fn();

vi.mock("@/db/client", () => ({ withInvitationTokenTransaction }));
vi.mock("@/lib/audit", () => ({ recordAuditInTransaction, recordAudit }));

const { acceptInvitation, getInvitationPreview } = await import("@/modules/platform/invitations");

const organizationId = "00000000-0000-0000-0000-000000000001";
const invitationId = "00000000-0000-0000-0000-000000000002";
const roleId = "00000000-0000-0000-0000-000000000003";
const userId = "00000000-0000-0000-0000-000000000004";
const token = "opaque-invitation-token";

function createFixture(overrides: Record<string, unknown> = {}) {
  const invitation = {
    id: invitationId,
    organizationId,
    employeeId: null,
    invitationType: "organization_admin",
    invitedEmail: "owner@example.com",
    intendedRole: "ORGANIZATION_OWNER",
    expiresAt: new Date(Date.now() + 60_000),
    status: "pending",
    acceptedAt: null,
    tokenHash: "not-returned-to-callers",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  const user = { id: userId, email: invitation.invitedEmail, fullName: "Owner", passwordHash: "unused", emailVerifiedAt: new Date() };
  const membership = { id: "00000000-0000-0000-0000-000000000005", userId, organizationId, roleId, status: "active" };
  const consumedInvitation = { ...invitation, status: "accepted", acceptedAt: new Date() };
  const employee = {
    id: "00000000-0000-0000-0000-000000000006",
    organizationId,
    userId,
    employeeId: "EMP0001",
    firstName: "Owner",
    lastName: "User",
    displayName: "Owner",
    workEmail: invitation.invitedEmail,
    status: "active",
  };
  const onboardingRecord = {
    id: "00000000-0000-0000-0000-000000000007",
    organizationId,
    employeeId: employee.id,
    status: "completed",
  };
  const state = { committed: false, rolledBack: false, inserted: [] as unknown[] };
  const tx = {
    execute: vi.fn(),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
    query: {
      invitations: { findFirst: vi.fn().mockResolvedValue(invitation) },
      organizations: { findFirst: vi.fn().mockResolvedValue({ id: organizationId, status: "active", name: "Test Org", slug: "test-org" }) },
      users: { findFirst: vi.fn().mockResolvedValue(null) },
      memberships: { findFirst: vi.fn().mockResolvedValue(undefined) },
      roles: { findFirst: vi.fn().mockResolvedValue({ id: roleId, organizationId, key: "ORGANIZATION_OWNER" }) },
    },
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((values: unknown) => {
        state.inserted.push({ table, values });
        return {
          returning: vi.fn().mockResolvedValue(
            table === users
              ? [user]
              : table === memberships
                ? [membership]
                : table === employees
                  ? [employee]
                  : table === onboarding
                    ? [onboardingRecord]
                    : []
          ),
        };
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue(
            table === invitations
              ? [consumedInvitation]
              : table === organizations
                ? [{ prefix: "EMP", next: 2, padding: 4 }]
                : []
          ),
        })),
      })),
    })),
  };
  withInvitationTokenTransaction.mockImplementation(async (_hash: string, callback: (transaction: typeof tx) => Promise<unknown>) => {
    try {
      const result = await callback(tx);
      state.committed = true;
      return result;
    } catch (error) {
      state.inserted.length = 0;
      state.rolledBack = true;
      throw error;
    }
  });
  return { invitation, user, membership, consumedInvitation, state, tx };
}

describe("invitation acceptance transaction behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a verified user, membership, consumes the invitation, and audits in one transaction", async () => {
    const fixture = createFixture();
    const result = await acceptInvitation({ token, fullName: "Owner", password: "SecurePassword123" });

    expect(result.membership.organizationId).toBe(organizationId);
    expect(fixture.state.committed).toBe(true);
    expect(fixture.state.rolledBack).toBe(false);
    expect(fixture.state.inserted.some((entry) => entry && typeof entry === "object" && "table" in entry && entry.table === users)).toBe(true);
    expect(fixture.state.inserted.some((entry) => entry && typeof entry === "object" && "table" in entry && entry.table === memberships)).toBe(true);
    expect(fixture.state.inserted.some((entry) => entry && typeof entry === "object" && "table" in entry && entry.table === employees)).toBe(true);
    expect(recordAuditInTransaction).toHaveBeenCalledWith(fixture.tx, expect.objectContaining({ organizationId, resourceId: invitationId }));
  });

  it("rolls back the acceptance when audit insertion fails", async () => {
    const fixture = createFixture();
    recordAuditInTransaction.mockRejectedValueOnce(new Error("audit insert failed"));

    await expect(acceptInvitation({ token, fullName: "Owner", password: "SecurePassword123" })).rejects.toThrow("audit insert failed");
    expect(fixture.state.committed).toBe(false);
    expect(fixture.state.rolledBack).toBe(true);
    expect(fixture.state.inserted).toHaveLength(0);
  });

  it("rejects a replayed invitation before creating another membership", async () => {
    const fixture = createFixture({ status: "accepted" });

    await expect(acceptInvitation({ token, fullName: "Owner", password: "SecurePassword123" })).rejects.toMatchObject({ code: "INVITATION_ALREADY_ACCEPTED" });
    expect(fixture.tx.insert).not.toHaveBeenCalled();
    expect(fixture.state.rolledBack).toBe(true);
  });

  it("rejects a conditional consumption race when the invitation is no longer pending", async () => {
    const fixture = createFixture();
    fixture.tx.update.mockImplementation((table: unknown) => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue(
            table === organizations ? [{ prefix: "EMP", next: 2, padding: 4 }] : []
          ),
        })),
      })),
    }));
    fixture.tx.query.invitations.findFirst.mockResolvedValueOnce(fixture.invitation).mockResolvedValueOnce({ ...fixture.invitation, status: "accepted" });

    await expect(acceptInvitation({ token, fullName: "Owner", password: "SecurePassword123" })).rejects.toMatchObject({ code: "INVITATION_ALREADY_ACCEPTED" });
    expect(fixture.state.committed).toBe(false);
    expect(fixture.state.rolledBack).toBe(true);
  });

  it("rejects expired and revoked invitations", async () => {
    const expired = createFixture({ expiresAt: new Date(Date.now() - 1_000) });
    await expect(acceptInvitation({ token, fullName: "Owner", password: "SecurePassword123" })).rejects.toMatchObject({ code: "INVITATION_EXPIRED" });
    expect(expired.tx.insert).not.toHaveBeenCalled();

    vi.clearAllMocks();
    const revoked = createFixture({ status: "revoked" });
    await expect(acceptInvitation({ token, fullName: "Owner", password: "SecurePassword123" })).rejects.toMatchObject({ code: "INVITATION_REVOKED" });
    expect(revoked.tx.insert).not.toHaveBeenCalled();
  });

  it("does not replace an existing user's password", async () => {
    const fixture = createFixture();
    fixture.tx.query.users.findFirst.mockResolvedValueOnce({ ...fixture.user, passwordHash: "scrypt:existing" });
    fixture.tx.query.memberships.findFirst.mockResolvedValueOnce(undefined);
    await expect(acceptInvitation({ token, password: "SecurePassword123" })).rejects.toMatchObject({ code: "AUTH_INVALID_CREDENTIALS" });
    expect(fixture.state.inserted).toHaveLength(0);
  });

  it("rejects invitation acceptance when organization is pending or not active", async () => {
    const fixture = createFixture();
    fixture.tx.query.organizations.findFirst.mockResolvedValueOnce({ id: organizationId, status: "pending", name: "Pending Org", slug: "pending-org" });

    await expect(acceptInvitation({ token, fullName: "Owner", password: "SecurePassword123" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This organization has not been activated yet. Please contact the platform administrator.",
    });
    expect(fixture.tx.insert).not.toHaveBeenCalled();
    expect(fixture.state.rolledBack).toBe(true);
  });

  it("rejects invitation preview when organization is pending or not active", async () => {
    const fixture = createFixture();
    fixture.tx.query.organizations.findFirst.mockResolvedValueOnce({ id: organizationId, status: "pending", name: "Pending Org", slug: "pending-org" });

    await expect(getInvitationPreview(token)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This organization has not been activated yet. Please contact the platform administrator.",
    });
  });

  it("allows invitation preview when organization is active", async () => {
    createFixture();
    const preview = await getInvitationPreview(token);

    expect(preview.organization.name).toBe("Test Org");
    expect(preview.organization.slug).toBe("test-org");
    expect(preview.invitedEmail).toBe("owner@example.com");
  });
});
