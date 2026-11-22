import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const { resolveTenantContext, authorize } = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  authorize: vi.fn(),
}));

const { getEmployeeDetails, updateEmployee } = vi.hoisted(() => ({
  getEmployeeDetails: vi.fn(),
  updateEmployee: vi.fn(),
}));

vi.mock("@/modules/tenancy/context", () => ({ resolveTenantContext }));
vi.mock("@/modules/tenancy/authorization", () => ({ authorize }));
vi.mock("@/modules/employees/service", () => ({ getEmployeeDetails, updateEmployee }));

import { GET, PATCH } from "./route";

describe("Employee Detail API Route (GET & PATCH /api/app/employees/[employeeId])", () => {
  const organizationId = "org-1111-2222";
  const employeeId = "emp-3333-4444";
  const userId = "user-hr-admin";

  beforeEach(() => {
    vi.clearAllMocks();
    resolveTenantContext.mockResolvedValue({
      organization: { id: organizationId },
      user: { id: userId },
      role: { key: "HR_ADMIN" },
    });
    authorize.mockResolvedValue(true);
  });

  it("returns 200 OK with fully enriched employee details including department, designation, shift, and role", async () => {
    const mockDetails = {
      id: employeeId,
      organizationId,
      employeeId: "EMP0001",
      firstName: "Aarav",
      lastName: "Patel",
      displayName: "Aarav Patel",
      workEmail: "aarav.patel@company.com",
      status: "active",
      joiningDate: "2026-02-01",
      department: {
        id: "dept-1",
        name: "Engineering",
        code: "ENG",
        status: "active",
      },
      designation: {
        id: "desig-1",
        name: "Lead Systems Architect",
        code: "ARCH-1",
        level: 4,
        status: "active",
      },
      shift: {
        id: "shift-1",
        name: "Morning Core Shift",
        code: "CORE-AM",
        startTime: "08:30:00",
        endTime: "17:30:00",
        breakMinutes: 60,
        graceMinutes: 10,
        overnight: false,
        status: "active",
      },
      employmentType: {
        id: "type-1",
        name: "Full-Time Regular",
        code: "FTR",
        status: "active",
      },
      reportingManager: {
        id: "emp-mgr",
        displayName: "Siddharth Nair",
        employeeId: "EMP0000",
        workEmail: "sid@company.com",
      },
      team: {
        id: "team-infra",
        name: "Cloud Infrastructure",
        code: "INFRA",
        status: "active",
      },
      location: null,
      roleKey: "TEAM_LEAD",
      roleTitle: "Team Lead",
    };

    getEmployeeDetails.mockResolvedValueOnce(mockDetails);

    const req = new Request(`http://localhost/api/app/employees/${employeeId}`);
    const res = await GET(req, { params: Promise.resolve({ employeeId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.employee.id).toBe(employeeId);
    expect(json.employee.department.name).toBe("Engineering");
    expect(json.employee.department.code).toBe("ENG");
    expect(json.employee.designation.name).toBe("Lead Systems Architect");
    expect(json.employee.designation.level).toBe(4);
    expect(json.employee.shift.name).toBe("Morning Core Shift");
    expect(json.employee.shift.startTime).toBe("08:30:00");
    expect(json.employee.shift.endTime).toBe("17:30:00");
    expect(json.employee.shift.breakMinutes).toBe(60);
    expect(json.employee.shift.graceMinutes).toBe(10);
    expect(json.employee.shift.overnight).toBe(false);
    expect(json.employee.employmentType.name).toBe("Full-Time Regular");
    expect(json.employee.reportingManager.displayName).toBe("Siddharth Nair");
    expect(json.employee.roleKey).toBe("TEAM_LEAD");
    expect(json.employee.roleTitle).toBe("Team Lead");

    expect(authorize).toHaveBeenCalledWith({
      organizationId,
      permission: "employee.read",
    });
    expect(getEmployeeDetails).toHaveBeenCalledWith(organizationId, employeeId);
  });

  it("returns 404 NOT_FOUND when employee does not exist or belongs to another organization (tenant isolation)", async () => {
    getEmployeeDetails.mockResolvedValueOnce(null);

    const req = new Request(`http://localhost/api/app/employees/emp-nonexistent`);
    const res = await GET(req, { params: Promise.resolve({ employeeId: "emp-nonexistent" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("NOT_FOUND");
    expect(json.error?.message).toContain("Employee was not found");
  });

  it("returns 403 FORBIDDEN when user lacks employee.read permission", async () => {
    authorize.mockRejectedValueOnce(
      new AppError("FORBIDDEN", "You are not authorized to view employee details.", 403)
    );

    const req = new Request(`http://localhost/api/app/employees/${employeeId}`);
    const res = await GET(req, { params: Promise.resolve({ employeeId }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("FORBIDDEN");
    expect(getEmployeeDetails).not.toHaveBeenCalled();
  });

  it("returns 403 FORBIDDEN when organization context is missing", async () => {
    resolveTenantContext.mockResolvedValueOnce({
      organization: null,
      user: { id: userId },
    });

    const req = new Request(`http://localhost/api/app/employees/${employeeId}`);
    const res = await GET(req, { params: Promise.resolve({ employeeId }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error?.code).toBe("FORBIDDEN");
  });

  it("PATCH /api/app/employees/[employeeId] updates employee details successfully", async () => {
    updateEmployee.mockResolvedValueOnce({
      id: employeeId,
      organizationId,
      phone: "+91 99999 88888",
    });

    const req = new Request(`http://localhost/api/app/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "+91 99999 88888" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ employeeId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.employee.phone).toBe("+91 99999 88888");
    expect(updateEmployee).toHaveBeenCalledWith(
      organizationId,
      userId,
      employeeId,
      expect.objectContaining({ phone: "+91 99999 88888" })
    );
  });
});
