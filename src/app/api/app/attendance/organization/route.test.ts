import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/modules/../app/api/app/attendance/organization/route";

const mockTenantContext = vi.fn();
const mockAuthorize = vi.fn();
const mockGetDashboard = vi.fn();

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: () => mockTenantContext(),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize: (args: unknown) => mockAuthorize(args),
}));

vi.mock("@/modules/attendance/organization-dashboard", () => ({
  getOrganizationAttendanceDashboard: (args: unknown) => mockGetDashboard(args),
  exportOrganizationAttendanceCsv: () => "Employee ID,Employee Name\nEMP001,Amit Patel",
}));

describe("GET /api/app/attendance/organization API Route", () => {
  const orgId = "org-test-123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue(undefined);
    mockGetDashboard.mockResolvedValue({
      success: true,
      summary: { totalActive: 10, present: 5, late: 1, absent: 2, onLeave: 1, onBreak: 1, missingPunch: 0, unassignedShift: 0 },
      employees: [],
      shifts: [],
      departments: [],
      pagination: { page: 1, pageSize: 25, total: 10, totalPages: 1 },
      timezone: "Asia/Kolkata",
      date: "2026-10-19",
      userPermissions: { canManageAttendance: true, canApproveRegularization: true, role: "ORGANIZATION_OWNER" },
    });
  });

  it("1. Allows ORGANIZATION_OWNER to query organization attendance", async () => {
    mockTenantContext.mockResolvedValue({
      organization: { id: orgId, name: "Naresh Tech" },
      user: { id: "user-owner" },
      role: { key: "ORGANIZATION_OWNER" },
    });

    const req = new Request("http://localhost:3000/api/app/attendance/organization?date=2026-10-19");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetDashboard).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        actorRoleKey: "ORGANIZATION_OWNER",
        date: "2026-10-19",
      })
    );
  });

  it("2. Allows HR_ADMIN to query organization attendance", async () => {
    mockTenantContext.mockResolvedValue({
      organization: { id: orgId, name: "Naresh Tech" },
      user: { id: "user-hr-admin" },
      role: { key: "HR_ADMIN" },
    });

    const req = new Request("http://localhost:3000/api/app/attendance/organization");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("3. Allows HR_EXECUTIVE to query organization attendance", async () => {
    mockTenantContext.mockResolvedValue({
      organization: { id: orgId, name: "Naresh Tech" },
      user: { id: "user-hr-exec" },
      role: { key: "HR_EXECUTIVE" },
    });

    const req = new Request("http://localhost:3000/api/app/attendance/organization");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("4. Blocks EMPLOYEE with 403 Forbidden", async () => {
    mockTenantContext.mockResolvedValue({
      organization: { id: orgId, name: "Naresh Tech" },
      user: { id: "user-emp" },
      role: { key: "EMPLOYEE" },
    });

    const req = new Request("http://localhost:3000/api/app/attendance/organization");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("5. Blocks request if organization context is missing", async () => {
    mockTenantContext.mockResolvedValue({
      organization: null,
      user: { id: "user-owner" },
      role: { key: "ORGANIZATION_OWNER" },
    });

    const req = new Request("http://localhost:3000/api/app/attendance/organization");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("6. Supports CSV export with Content-Disposition attachment header", async () => {
    mockTenantContext.mockResolvedValue({
      organization: { id: orgId, name: "Naresh Tech" },
      user: { id: "user-owner" },
      role: { key: "ORGANIZATION_OWNER" },
    });

    const req = new Request("http://localhost:3000/api/app/attendance/organization?format=csv");
    const res = await GET(req);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(text).toContain("Employee ID,Employee Name");
  });
});
