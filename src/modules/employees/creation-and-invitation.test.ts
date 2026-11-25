import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { employees, invitations, onboarding, organizations } from "@/db/schema";
import { AppError } from "@/lib/errors";

const authorize = vi.fn();
const resolveTenantContext = vi.fn();
const recordAudit = vi.fn();
const sendInvitationEmail = vi.fn();
const buildInvitationUrl = vi.fn();

type MockEmployee = {
  id: string;
  organizationId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  personalEmail?: string | null;
  workEmail?: string | null;
  status: string;
};

type MockInvitation = {
  id: string;
  organizationId: string;
  employeeId: string;
  invitationType: string;
  invitedEmail: string;
  intendedRole: string;
  tokenHash: string;
  status: string;
  expiresAt: Date;
};

let mockEmployees: MockEmployee[] = [];
let mockInvitations: MockInvitation[] = [];
let existingEmployeeToReturn: MockEmployee | null = null;
let orgCounters: Record<string, number> = {};

const tx = {
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === employees) {
          return Promise.resolve(existingEmployeeToReturn ? [existingEmployeeToReturn] : []);
        }
        return Promise.resolve([]);
      }),
    })),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn(() => ({
      where: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockImplementation(() => {
          if (table === organizations) {
            const orgId = "org-1";
            orgCounters[orgId] = (orgCounters[orgId] ?? 1) + 1;
            return Promise.resolve([
              {
                prefix: "EMP",
                next: orgCounters[orgId],
                padding: 4,
              },
            ]);
          }
          return Promise.resolve([]);
        }),
      })),
    })),
  })),
  insert: vi.fn((table: unknown) => ({
    values: vi.fn((values: unknown) => ({
      returning: vi.fn().mockImplementation(() => {
        if (table === employees) {
          const val = values as Partial<MockEmployee>;
          const created: MockEmployee = {
            id: `emp-${Date.now()}-${Math.random()}`,
            organizationId: val.organizationId!,
            employeeId: val.employeeId!,
            firstName: val.firstName!,
            lastName: val.lastName!,
            displayName: val.displayName!,
            personalEmail: val.personalEmail ?? null,
            workEmail: val.workEmail ?? null,
            status: val.status || "invited",
          };
          mockEmployees.push(created);
          return Promise.resolve([created]);
        }
        if (table === onboarding) {
          return Promise.resolve([{ id: "onb-1", status: "not_started" }]);
        }
        return Promise.resolve([values]);
      }),
    })),
  })),
  query: {
    memberships: { findFirst: vi.fn().mockResolvedValue(null) },
    roles: {
      findFirst: vi.fn().mockResolvedValue({ id: "role-emp", key: "EMPLOYEE" }),
    },
  },
};

const db = {
  transaction: vi.fn(async (cb: (nestedTx: typeof tx) => Promise<unknown>) => cb(tx)),
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === employees) {
          return Promise.resolve(mockEmployees);
        }
        return Promise.resolve([]);
      }),
    })),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn((setData: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === invitations) {
          const inv = mockInvitations[0];
          if (inv) Object.assign(inv, setData);
          return {
            returning: vi.fn().mockResolvedValue([inv]),
          };
        }
        if (table === employees) {
          return Promise.resolve([]);
        }
        return {
          returning: vi.fn().mockResolvedValue([]),
        };
      }),
    })),
  })),
  insert: vi.fn((table: unknown) => ({
    values: vi.fn((values: unknown) => ({
      returning: vi.fn().mockImplementation(() => {
        if (table === invitations) {
          const inv = { id: "inv-new", ...(values as object) } as MockInvitation;
          mockInvitations.push(inv);
          return Promise.resolve([inv]);
        }
        return Promise.resolve([values]);
      }),
    })),
  })),
  query: {
    invitations: {
      findFirst: vi.fn().mockImplementation(() => Promise.resolve(mockInvitations[0] ?? null)),
    },
    roles: {
      findFirst: vi.fn().mockImplementation(() =>
        Promise.resolve({ id: "role-emp", key: "EMPLOYEE", name: "Employee" })
      ),
    },
  },
};

let inviteTestExecutor: typeof tx | undefined;
vi.mock("@/db/client", () => ({
  db,
  withTenantTransaction: vi.fn((_orgId: string, cb: (nestedTx: typeof tx) => Promise<unknown>) => cb(inviteTestExecutor ?? tx)),
}));
vi.mock("@/modules/tenancy/authorization", () => ({ authorize }));
vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext }));
vi.mock("@/lib/audit", () => ({ recordAudit }));
vi.mock("@/lib/email", () => ({ sendInvitationEmail, buildInvitationUrl }));

const { createEmployee } = await import("@/modules/employees/service");
const { POST: inviteRoutePost } = await import("@/lib/server/api/app/employees/[employeeId]/invite/route");

describe("Employee creation duplicate prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmployees = [];
    mockInvitations = [];
    existingEmployeeToReturn = null;
    orgCounters = { "org-1": 1, "org-2": 1 };
    authorize.mockResolvedValue({ id: "user-actor" });
  });

  it("checks role delegation in the tenant transaction before creating a profile", async () => {
    tx.query.memberships.findFirst.mockResolvedValueOnce({ roleId: "role-employee" });
    tx.query.roles.findFirst.mockResolvedValueOnce({ key: "EMPLOYEE" });

    await expect(createEmployee("org-1", "user-actor", {
      firstName: "Fixture",
      lastName: "Employee",
      status: "invited",
      targetRole: "ORGANIZATION_OWNER",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("creating a new employee succeeds", async () => {
    existingEmployeeToReturn = null;
    const result = await createEmployee("org-1", "user-actor", {
      firstName: "Arjun",
      lastName: "Kumar",
      personalEmail: "arjun.kumar@example.com",
      status: "invited",
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.employeeId).toBe("EMP0001");
    expect(result.employee.personalEmail).toBe("arjun.kumar@example.com");
    expect(mockEmployees).toHaveLength(1);
  });

  it("creating another employee with the same email in the same organization is rejected", async () => {
    // First creation succeeds
    existingEmployeeToReturn = null;
    await createEmployee("org-1", "user-actor", {
      firstName: "Arjun",
      lastName: "Kumar",
      personalEmail: "arjun.kumar@example.com",
      status: "invited",
    });

    // On subsequent check in the same organization, existing employee is found
    existingEmployeeToReturn = mockEmployees[0];

    // Second creation attempt with same email throws 409
    await expect(
      createEmployee("org-1", "user-actor", {
        firstName: "Arjun",
        lastName: "Kumar",
        personalEmail: "arjun.kumar@example.com",
        status: "invited",
      })
    ).rejects.toThrow("An employee with this email already exists in this organization.");

    try {
      await createEmployee("org-1", "user-actor", {
        firstName: "Arjun",
        lastName: "Kumar",
        personalEmail: "arjun.kumar@example.com",
        status: "invited",
      });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(409);
      expect((err as AppError).code).toBe("VALIDATION_ERROR");
    }

    // Verify no duplicate employee record was added
    expect(mockEmployees).toHaveLength(1);
  });

  it("same email in another organization remains allowed (tenant isolation)", async () => {
    // In org-1, an employee exists
    mockEmployees.push({
      id: "emp-org-1",
      organizationId: "org-1",
      employeeId: "EMP0001",
      firstName: "Arjun",
      lastName: "Kumar",
      displayName: "Arjun Kumar",
      personalEmail: "arjun.kumar@example.com",
      status: "invited",
    });

    // When querying for org-2, no existing employee in org-2 is found
    existingEmployeeToReturn = null;

    // Creating in org-2 with same email succeeds
    const result = await createEmployee("org-2", "user-actor", {
      firstName: "Arjun",
      lastName: "Kumar",
      personalEmail: "arjun.kumar@example.com",
      status: "invited",
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.organizationId).toBe("org-2");
    expect(mockEmployees.some((e) => e.organizationId === "org-2")).toBe(true);
  });

  it("repeated/duplicate submission does not silently create another employee", async () => {
    // First creation
    existingEmployeeToReturn = null;
    await createEmployee("org-1", "user-actor", {
      firstName: "Arjun",
      lastName: "Kumar",
      personalEmail: "arjun.kumar@example.com",
      status: "invited",
    });

    // Subsequent request finds existing employee
    existingEmployeeToReturn = mockEmployees[0];

    // Repeated call throws conflict
    await expect(
      createEmployee("org-1", "user-actor", {
        firstName: "Arjun",
        lastName: "Kumar",
        personalEmail: "ARJUN.KUMAR@example.com",
        status: "invited",
      })
    ).rejects.toMatchObject({
      status: 409,
      code: "VALIDATION_ERROR",
    });

    // Employee count unchanged
    expect(mockEmployees).toHaveLength(1);
  });
});

describe("Employee invitation resend flow", () => {
  const organizationId = "org-1";
  const employeeId = "emp-001";
  const userId = "user-actor";

  beforeEach(() => {
    vi.clearAllMocks();
    resolveTenantContext.mockResolvedValue({
      organization: { id: organizationId, name: "Acme Corp" },
      user: { id: userId },
      role: { id: "role-owner", key: "ORGANIZATION_OWNER" },
    });
    authorize.mockResolvedValue({ id: userId });

    mockEmployees = [
      {
        id: employeeId,
        organizationId,
        employeeId: "EMP0001",
        firstName: "Arjun",
        lastName: "Kumar",
        displayName: "Arjun Kumar",
        personalEmail: "arjun.kumar@example.com",
        status: "invited",
      },
    ];

    mockInvitations = [
      {
        id: "inv-001",
        organizationId,
        employeeId,
        invitationType: "employee",
        invitedEmail: "arjun.kumar@example.com",
        intendedRole: "EMPLOYEE",
        tokenHash: "existing-hash",
        status: "pending",
        expiresAt: new Date(Date.now() + 86400000),
      },
    ];

    sendInvitationEmail.mockResolvedValue("not_configured");
    inviteTestExecutor = {
      ...tx,
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => ({
          where: vi.fn(() => {
            const rows = table === employees ? mockEmployees : [];
            return Object.assign(Promise.resolve(rows), { for: vi.fn().mockResolvedValue(rows) });
          }),
        })),
      })),
      update: db.update as unknown as typeof tx.update,
      insert: db.insert as unknown as typeof tx.insert,
      query: { ...tx.query, invitations: db.query.invitations },
    } as typeof tx;
    buildInvitationUrl.mockReturnValue(
      "https://app.symphowork.example/invitations/accept?token=mocked-opaque-token"
    );
  });

  afterEach(() => { inviteTestExecutor = undefined; });

  const resend = () => inviteRoutePost(new Request("http://localhost/api/app/employees/emp-001/invite", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ resend: true }),
  }), { params: { employeeId } });

  it("keeps the same pending invitation and profile when delivery fails after commit", async () => {
    sendInvitationEmail.mockRejectedValueOnce(new Error("Email provider unavailable"));
    const response = await resend();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      invitation: { id: "inv-001", status: "pending", delivery: "failed" },
      invitationUrl: expect.any(String),
    });
    expect((await resend()).status).toBe(200);
    expect(mockEmployees).toHaveLength(1);
    expect(mockInvitations).toHaveLength(1);
  });

  it("does not send an invitation when the scoped transaction fails", async () => {
    const { withTenantTransaction } = await import("@/db/client");
    vi.mocked(withTenantTransaction).mockRejectedValueOnce(new Error("Transaction rolled back"));
    const response = await resend();
    expect(response.status).toBe(500);
    expect(withTenantTransaction).toHaveBeenCalledWith(organizationId, expect.any(Function));
    expect(sendInvitationEmail).not.toHaveBeenCalled();
    expect(mockInvitations[0].tokenHash).toBe("existing-hash");
  });

  it("does not modify or send an invitation for an employee outside the scoped lookup", async () => {
    mockEmployees = [];
    const response = await resend();
    expect(response.status).toBe(404);
    expect(mockInvitations[0].tokenHash).toBe("existing-hash");
    expect(sendInvitationEmail).not.toHaveBeenCalled();
  });

  it("resend invitation succeeds and generates invitation URL", async () => {
    const request = new Request("http://localhost/api/app/employees/emp-001/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resend: true }),
    });

    const response = await inviteRoutePost(request, {
      params: { employeeId },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.invitation).toBeDefined();
    expect(body.invitation.status).toBe("pending");
    expect(body.invitation.delivery).toBe("not_configured");
    expect(body.invitationUrl).toBe(
      "https://app.symphowork.example/invitations/accept?token=mocked-opaque-token"
    );

    // Audit recorded
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "employee_invitation_resent",
        resource: "employee",
        resourceId: employeeId,
      })
    );
  });

  it("invitation token is not exposed in root response or audit metadata", async () => {
    const request = new Request("http://localhost/api/app/employees/emp-001/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resend: true }),
    });

    const response = await inviteRoutePost(request, {
      params: { employeeId },
    });
    const body = await response.json();

    // Raw token must never be directly exposed outside invitationUrl
    expect(body.token).toBeUndefined();
    expect(body.invitation.token).toBeUndefined();

    // Audit logs must not contain raw token
    const auditCall = recordAudit.mock.calls[0][0];
    expect(JSON.stringify(auditCall)).not.toContain("mocked-opaque-token");
  });

  it("returns delivery: 'sent' when email provider is configured", async () => {
    sendInvitationEmail.mockResolvedValue("sent");

    const request = new Request("http://localhost/api/app/employees/emp-001/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resend: true }),
    });

    const response = await inviteRoutePost(request, {
      params: { employeeId },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.invitation.delivery).toBe("sent");
  });
});
