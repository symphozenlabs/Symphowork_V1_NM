import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees, invitations } from "@/db/schema";

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
const mockRoles = [
  { id: "r-owner", key: "ORGANIZATION_OWNER", name: "Organization Owner" },
  { id: "r-hradmin", key: "HR_ADMIN", name: "HR Administrator" },
  { id: "r-hrexec", key: "HR_EXECUTIVE", name: "HR Executive" },
  { id: "r-mgr", key: "MANAGER", name: "Manager" },
  { id: "r-emp", key: "EMPLOYEE", name: "Employee" },
];

const tx = {
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === employees) return Promise.resolve(mockEmployees);
        return Promise.resolve([]);
      }),
    })),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn((setData: Record<string, unknown>) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === invitations) {
          const inv = mockInvitations[0];
          if (inv) Object.assign(inv, setData);
          return Promise.resolve([inv]);
        }
        if (table === employees) {
          const emp = mockEmployees[0];
          if (emp) Object.assign(emp, setData);
          return Promise.resolve([emp]);
        }
        return Promise.resolve([]);
      }),
    })),
  })),
  insert: vi.fn((table: unknown) => ({
    values: vi.fn((values: Record<string, unknown>) => ({
      returning: vi.fn().mockImplementation(() => {
        if (table === invitations) {
          const inv = { id: "inv-new", ...values } as MockInvitation;
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
      findFirst: vi.fn().mockImplementation(() => {
        return Promise.resolve(mockRoles[1]); // default HR_ADMIN or resolved
      }),
    },
  },
};

const db = {
  select: vi.fn(() => ({
    from: vi.fn((table: unknown) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === employees) return Promise.resolve(mockEmployees);
        return Promise.resolve([]);
      }),
    })),
  })),
  query: {
    invitations: {
      findFirst: vi.fn().mockImplementation(() => Promise.resolve(mockInvitations[0] ?? null)),
    },
  },
  insert: vi.fn((table: unknown) => ({
    values: vi.fn((values: Record<string, unknown>) => ({
      returning: vi.fn().mockImplementation(() => {
        if (table === invitations) {
          const inv = { id: "inv-new", ...values } as MockInvitation;
          mockInvitations.push(inv);
          return Promise.resolve([inv]);
        }
        return Promise.resolve([values]);
      }),
    })),
  })),
  update: vi.fn((table: unknown) => ({
    set: vi.fn((setData: Record<string, unknown>) => ({
      where: vi.fn().mockImplementation(() => {
        if (table === invitations) {
          const inv = mockInvitations[0];
          if (inv) Object.assign(inv, setData);
          return {
            returning: vi.fn().mockResolvedValue([inv]),
            then: (resolve: (val: unknown) => void) => Promise.resolve([inv]).then(resolve),
          };
        }
        return {
          returning: vi.fn().mockResolvedValue([]),
          then: (resolve: (val: unknown) => void) => Promise.resolve([]).then(resolve),
        };
      }),
    })),
  })),
};

vi.mock("@/db/client", () => ({
  db,
  withTenantTransaction: vi.fn((_orgId: string, cb: (nestedTx: typeof tx) => Promise<unknown>) => cb(tx)),
}));
vi.mock("@/modules/tenancy/authorization", () => ({ authorize }));
vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext }));
vi.mock("@/lib/audit", () => ({ recordAudit }));
vi.mock("@/lib/email", () => ({ sendInvitationEmail, buildInvitationUrl }));

const { POST: inviteRoutePost } = await import("@/app/api/app/employees/[employeeId]/invite/route");
const { POST: revokeRoutePost } = await import("@/app/api/app/employees/[employeeId]/invite/revoke/route");

describe("Role-Based Invitation and Revocation Workflow", () => {
  const organizationId = "org-1";
  const employeeId = "emp-001";
  const userId = "user-actor";

  beforeEach(() => {
    vi.clearAllMocks();
    authorize.mockResolvedValue({ id: userId });
    sendInvitationEmail.mockResolvedValue("sent");
    buildInvitationUrl.mockReturnValue(
      "https://app.symphowork.example/invitations/accept?token=mocked-opaque-token"
    );

    mockEmployees = [
      {
        id: employeeId,
        organizationId,
        employeeId: "EMP0001",
        firstName: "Meera",
        lastName: "Nair",
        personalEmail: "meera.nair@example.com",
        status: "invited",
      },
    ];

    mockInvitations = [];

    tx.query.roles.findFirst = vi.fn().mockImplementation(() =>
      Promise.resolve({ id: "role-target", key: "HR_EXECUTIVE", name: "HR Executive" })
    );
  });

  describe("Role Hierarchy Enforcement during Invitation", () => {
    it("allows ORGANIZATION_OWNER to invite HR_ADMIN", async () => {
      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-owner", key: "ORGANIZATION_OWNER" },
      });

      const request = new Request(`http://localhost/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleKey: "HR_ADMIN" }),
      });

      const response = await inviteRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.invitation.intendedRole).toBe("HR_EXECUTIVE"); // matches mocked role
    });

    it("allows HR_ADMIN to invite HR_EXECUTIVE", async () => {
      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-hradmin", key: "HR_ADMIN" },
      });

      const request = new Request(`http://localhost/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleKey: "HR_EXECUTIVE" }),
      });

      const response = await inviteRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("prevents HR_ADMIN from inviting another HR_ADMIN (403)", async () => {
      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-hradmin", key: "HR_ADMIN" },
      });

      const request = new Request(`http://localhost/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleKey: "HR_ADMIN" }),
      });

      const response = await inviteRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("not authorized to assign or invite");
    });

    it("prevents HR_ADMIN from assigning ORGANIZATION_OWNER (403)", async () => {
      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-hradmin", key: "HR_ADMIN" },
      });

      const request = new Request(`http://localhost/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleKey: "ORGANIZATION_OWNER" }),
      });

      const response = await inviteRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it("allows HR_EXECUTIVE to invite EMPLOYEE", async () => {
      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-hrexec", key: "HR_EXECUTIVE" },
      });

      const request = new Request(`http://localhost/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleKey: "EMPLOYEE" }),
      });

      const response = await inviteRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("prevents HR_EXECUTIVE from inviting MANAGER (403)", async () => {
      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-hrexec", key: "HR_EXECUTIVE" },
      });

      const request = new Request(`http://localhost/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleKey: "MANAGER" }),
      });

      const response = await inviteRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it("prevents unauthorized role (e.g. MANAGER) from inviting anyone (403)", async () => {
      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-mgr", key: "MANAGER" },
      });

      const request = new Request(`http://localhost/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleKey: "EMPLOYEE" }),
      });

      const response = await inviteRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe("Invitation Revocation Endpoint", () => {
    beforeEach(() => {
      mockInvitations = [
        {
          id: "inv-001",
          organizationId,
          employeeId,
          invitationType: "employee",
          invitedEmail: "meera.nair@example.com",
          intendedRole: "EMPLOYEE",
          tokenHash: "token-hash-123",
          status: "pending",
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];
    });

    it("allows HR_ADMIN to revoke pending invitation", async () => {
      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-hradmin", key: "HR_ADMIN" },
      });

      const request = new Request(
        `http://localhost/api/app/employees/${employeeId}/invite/revoke`,
        { method: "POST" }
      );

      const response = await revokeRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain("revoked");

      expect(recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "employee_invitation_revoked",
          resource: "invitation",
          resourceId: "inv-001",
        })
      );
    });

    it("rejects revocation if no pending invitation exists (409)", async () => {
      mockInvitations[0].status = "accepted";

      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-hradmin", key: "HR_ADMIN" },
      });

      const request = new Request(
        `http://localhost/api/app/employees/${employeeId}/invite/revoke`,
        { method: "POST" }
      );

      const response = await revokeRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
    });

    it("rejects revocation if actor does not have hierarchy permission over intended role", async () => {
      // Intended role is HR_ADMIN, but actor is HR_EXECUTIVE
      mockInvitations[0].intendedRole = "HR_ADMIN";

      resolveTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "Acme Corp" },
        user: { id: userId },
        role: { id: "r-hrexec", key: "HR_EXECUTIVE" },
      });

      const request = new Request(
        `http://localhost/api/app/employees/${employeeId}/invite/revoke`,
        { method: "POST" }
      );

      const response = await revokeRoutePost(request, {
        params: Promise.resolve({ employeeId }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });
});
