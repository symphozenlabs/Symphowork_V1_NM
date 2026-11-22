import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { resolveTenantContext, authorize, mockSelect, mockInsert } = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  authorize: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext }));
vi.mock("@/modules/tenancy/authorization", () => ({ authorize }));
vi.mock("@/db/client", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

type MockTeam = {
  id: string;
  organizationId: string;
  departmentId: string | null;
  name: string;
  code: string;
  status: "active" | "inactive" | "archived";
};

const orgA = "11111111-1111-4111-8111-111111111111";

const salesDeptOrgA = "33333333-3333-4333-8333-333333333333";
const salesDeptOrgB = "55555555-5555-4555-8555-555555555555";

describe("Master Data Teams API Route — Filter & Isolation Regression Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    resolveTenantContext.mockResolvedValue({
      organization: { id: orgA, name: "Acme Org A" },
      user: { id: "user-1" },
    });
    authorize.mockResolvedValue({ id: "user-1" });
  });

  it("filters teams by selected department and excludes teams from other departments", async () => {
    // We simulate db response for Sales department in Org A
    mockSelect.mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([{ id: salesDeptOrgA }]),
        })),
      })),
    }));
    mockSelect.mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "team-sales-ops",
              organizationId: orgA,
              departmentId: salesDeptOrgA,
              name: "Sales Operations Team",
              code: "SALES-OPS",
              status: "active",
            },
          ]),
        })),
      })),
    }));

    const req = new Request(
      `http://localhost/api/app/master-data/teams?departmentId=${salesDeptOrgA}&status=active`
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].code).toBe("SALES-OPS");
    expect(body.items[0].departmentId).toBe(salesDeptOrgA);
    // FE-CORE from Engineering must NOT be included
    expect(body.items.some((t: MockTeam) => t.code === "FE-CORE")).toBe(false);
  });

  it("excludes inactive teams by default when departmentId is queried", async () => {
    mockSelect.mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([{ id: salesDeptOrgA }]),
        })),
      })),
    }));
    mockSelect.mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "team-sales-ops",
              organizationId: orgA,
              departmentId: salesDeptOrgA,
              name: "Sales Operations Team",
              code: "SALES-OPS",
              status: "active",
            },
          ]),
        })),
      })),
    }));

    // No status query param specified -> must default to active teams only
    const req = new Request(
      `http://localhost/api/app/master-data/teams?departmentId=${salesDeptOrgA}`
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.items.every((t: MockTeam) => t.status === "active")).toBe(true);
    expect(body.items.some((t: MockTeam) => t.code === "SALES-LEGACY")).toBe(false);
  });

  it("enforces cross-tenant isolation: returns empty items when department belongs to another organization", async () => {
    // Department query in db returns empty because salesDeptOrgB does not belong to Org A
    mockSelect.mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    }));

    const req = new Request(
      `http://localhost/api/app/master-data/teams?departmentId=${salesDeptOrgB}&status=active`
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.items).toEqual([]);
  });

  it("handles malformed non-UUID departmentId gracefully with empty items", async () => {
    const req = new Request(
      `http://localhost/api/app/master-data/teams?departmentId=invalid-dept-uuid`
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.items).toEqual([]);
  });

  it("enforces tenant authorization and requires organization context", async () => {
    resolveTenantContext.mockResolvedValueOnce({
      organization: null,
      user: { id: "user-1" },
    });

    const res = await GET(new Request("http://localhost/api/app/master-data/teams"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.items).toEqual([]);
  });

  it("POST rejects team creation if assigned department does not belong to organization", async () => {
    mockSelect.mockImplementationOnce(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]), // Department not found in org
        })),
      })),
    }));

    const req = new Request("http://localhost/api/app/master-data/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Security Team",
        code: "SEC-TEAM",
        departmentId: salesDeptOrgB, // belongs to orgB
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error?.message).toBe("Department does not belong to this organization.");
  });
});
