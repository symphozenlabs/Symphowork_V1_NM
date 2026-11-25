import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { employeeHistory, employees, invitations, memberships, sessions } from "@/db/schema";
import { offboardEmployee } from "./offboarding";

const f = vi.hoisted(() => ({ context: vi.fn(), transaction: vi.fn(), owner: vi.fn(), audit: vi.fn() }));
vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext: f.context }));
vi.mock("@/db/client", () => ({ withTenantTransaction: f.transaction }));
vi.mock("./service", () => ({ isOrganizationOwnerEmployee: f.owner }));
vi.mock("@/lib/audit", () => ({ recordAuditInTransaction: f.audit }));

function fixture({ visible = true, repeated = false, platformRole = "NONE" } = {}) {
  const employee = { id: "employee-b", userId: "user-b", status: repeated ? "exited" : "onboarding" };
  const whereSelect = vi.fn((table) => ({ for: async () =>
    table === employees ? (visible ? [employee] : []) : [{ id: "member-b", platformRole, roleKey: "HR_EXECUTIVE" }] }));
  const writes: { table: unknown; values: unknown; params: unknown[] }[] = [];
  const dialect = new PgDialect();
  const tx = {
    select: vi.fn(() => ({ from: (table: unknown) => {
      const q = { innerJoin: () => q, where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => {
        dialect.sqlToQuery(condition);
        return whereSelect(table);
      } };
      return q;
    } })),
    query: { employeeHistory: { findFirst: vi.fn().mockResolvedValue(repeated ? { id: "history-b" } : undefined) } },
    update: vi.fn((table: unknown) => ({ set: (values: unknown) => ({ where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      writes.push({ table, values, params: dialect.sqlToQuery(condition).params });
      return { returning: async () => repeated ? [] : [{ id: "invite-b" }] };
    } }) })),
    delete: vi.fn((table: unknown) => ({ where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      writes.push({ table, values: null, params: dialect.sqlToQuery(condition).params });
      return { returning: async () => repeated ? [] : [{ id: "session-b" }] };
    } })),
    insert: vi.fn(() => ({ values: vi.fn() })),
  };
  f.transaction.mockImplementation((_org, run) => run(tx));
  return { tx, writes };
}

describe("employee offboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    f.context.mockResolvedValue({ organization: { id: "tenant-b" }, user: { id: "owner-b", platformRole: "NONE" },
      membership: { organizationId: "tenant-b", status: "active" }, role: { key: "ORGANIZATION_OWNER" } });
    f.owner.mockResolvedValue(false);
  });

  it("retains the profile, removes tenant membership, revokes sessions and pending invitations, and audits", async () => {
    const { tx, writes } = fixture();
    await expect(offboardEmployee("employee-b")).resolves.toEqual({
      alreadyOffboarded: false, revokedSessions: 1, revokedInvitations: 1,
    });
    expect(f.transaction).toHaveBeenCalledWith("tenant-b", expect.any(Function));
    expect(writes).toEqual([
      { table: memberships, values: expect.objectContaining({ status: "removed" }), params: ["member-b", "tenant-b", "removed"] },
      { table: sessions, values: null, params: ["user-b"] },
      { table: invitations, values: expect.objectContaining({ status: "revoked" }), params: ["tenant-b", "employee-b", "pending"] },
      { table: employees, values: expect.objectContaining({ status: "exited" }), params: ["tenant-b", "employee-b"] },
    ]);
    expect(tx.insert).toHaveBeenCalledWith(employeeHistory);
    expect(f.audit).toHaveBeenCalledWith(tx, expect.objectContaining({ action: "employee_offboarded", organizationId: "tenant-b" }));
  });

  it.each(["HR_ADMIN", "HR_EXECUTIVE", "EMPLOYEE"])("denies %s before opening a transaction", async (key) => {
    f.context.mockResolvedValue({ organization: { id: "tenant-b" }, user: { id: "user-b", platformRole: "NONE" },
      membership: { organizationId: "tenant-b", status: "active" }, role: { key } });
    await expect(offboardEmployee("employee-b")).rejects.toMatchObject({ status: 403 });
    expect(f.transaction).not.toHaveBeenCalled();
  });

  it("returns not found for an employee outside the tenant scope and writes nothing", async () => {
    const { tx, writes } = fixture({ visible: false });
    await expect(offboardEmployee("employee-a")).rejects.toMatchObject({ status: 404 });
    expect(writes).toHaveLength(0);
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("protects owners and platform accounts", async () => {
    const { writes } = fixture({ platformRole: "PLATFORM_OWNER" });
    await expect(offboardEmployee("employee-b")).rejects.toMatchObject({ status: 403 });
    f.owner.mockResolvedValue(true);
    await expect(offboardEmployee("employee-b")).rejects.toMatchObject({ status: 403 });
    expect(writes).toHaveLength(0);
  });

  it("repeated requests do not duplicate audit history", async () => {
    const { tx } = fixture({ repeated: true });
    await expect(offboardEmployee("employee-b")).resolves.toEqual({
      alreadyOffboarded: true, revokedSessions: 0, revokedInvitations: 0,
    });
    expect(tx.insert).not.toHaveBeenCalled();
    expect(f.audit).not.toHaveBeenCalled();
  });
});
