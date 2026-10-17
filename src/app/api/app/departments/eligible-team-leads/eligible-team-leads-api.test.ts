import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockResolveTenantContext = vi.fn();
const mockListEligibleTeamLeads = vi.fn();

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: () => mockResolveTenantContext(),
}));

vi.mock("@/modules/departments/service", () => ({
  listEligibleTeamLeads: (...args: any[]) => mockListEligibleTeamLeads(...args),
}));

describe("Eligible Team Leads API Route (/api/app/departments/eligible-team-leads)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 FORBIDDEN when organization context is missing", async () => {
    mockResolveTenantContext.mockResolvedValue({
      organization: null,
      user: { id: "user-1" },
    });

    const req = new Request("http://localhost:3000/api/app/departments/eligible-team-leads");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 with team leads list for authenticated tenant", async () => {
    mockResolveTenantContext.mockResolvedValue({
      organization: { id: "org-100" },
      user: { id: "user-1" },
    });

    const mockLeads = [
      {
        id: "emp-lead-1",
        displayName: "Vikram Mehta",
        employeeId: "EMP002",
        roleKey: "TEAM_LEAD",
        roleTitle: "Team Lead",
        status: "active",
      },
    ];
    mockListEligibleTeamLeads.mockResolvedValue(mockLeads);

    const req = new Request("http://localhost:3000/api/app/departments/eligible-team-leads?departmentId=dept-1");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.teamLeads).toEqual(mockLeads);
    expect(mockListEligibleTeamLeads).toHaveBeenCalledWith("org-100", "dept-1");
  });

  it("handles empty team leads list (empty state) gracefully", async () => {
    mockResolveTenantContext.mockResolvedValue({
      organization: { id: "org-empty" },
      user: { id: "user-1" },
    });

    mockListEligibleTeamLeads.mockResolvedValue([]);

    const req = new Request("http://localhost:3000/api/app/departments/eligible-team-leads");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.teamLeads).toEqual([]);
    expect(data.leads).toEqual([]);
  });
});
