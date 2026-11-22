import { beforeEach, describe, expect, it, vi } from "vitest";
import { employees } from "@/db/schema";
import { AppError } from "@/lib/errors";

const mockTenantContext = vi.fn();
const mockRecordPunch = vi.fn();
const mockGetOrEnsureEmployeeForUser = vi.fn();

let mockTargetEmployee: { id: string; organizationId: string; displayName: string } | null = null;

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: () => mockTenantContext(),
}));

vi.mock("@/modules/attendance/service", () => ({
  recordPunch: (args: unknown) => mockRecordPunch(args),
}));

vi.mock("@/modules/employees/service", () => ({
  getOrEnsureEmployeeForUser: (...args: unknown[]) => mockGetOrEnsureEmployeeForUser(...args),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === employees) {
            return Promise.resolve(mockTargetEmployee ? [mockTargetEmployee] : []);
          }
          return Promise.resolve([]);
        }),
      })),
    })),
  },
}));

import { POST } from "./route";

describe("Attendance Punch API (POST /api/app/attendance/punch)", () => {
  const organizationId = "org-test-uuid";
  const callerUserId = "user-arjun-uuid";
  const callerEmployeeId = "emp-arjun-uuid";

  const callerEmployee = {
    id: callerEmployeeId,
    organizationId,
    userId: callerUserId,
    displayName: "Arjun Kumar",
    employeeId: "EMP0002",
    status: "active",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTargetEmployee = null;

    mockTenantContext.mockResolvedValue({
      organization: { id: organizationId, name: "SymphoCorp" },
      user: { id: callerUserId, email: "arjunsharma@gmail.com" },
      role: { key: "HR_ADMIN" },
    });

    mockGetOrEnsureEmployeeForUser.mockResolvedValue(callerEmployee);

    mockRecordPunch.mockResolvedValue({
      id: "rec-punch-001",
      organizationId,
      employeeId: callerEmployeeId,
      attendanceDate: "2026-10-18",
      actualFirstIn: new Date().toISOString(),
      status: "present",
    });
  });

  describe("Authentication & Tenant Validation", () => {
    it("rejects unauthenticated requests when session is missing", async () => {
      mockTenantContext.mockRejectedValue(new AppError("UNAUTHORIZED", "Sign in is required.", 401));

      const request = new Request("http://localhost/api/app/attendance/punch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "clock_in" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toContain("Sign in is required");
    });

    it("rejects request when organization context is missing", async () => {
      mockTenantContext.mockResolvedValue({
        organization: null,
        user: { id: callerUserId },
        role: null,
      });

      const request = new Request("http://localhost/api/app/attendance/punch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "clock_in" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toContain("Organization context is required");
    });
  });

  describe("Payload & Punch Type Validation", () => {
    it("rejects requests missing the punch type with 400 VALIDATION_ERROR", async () => {
      const request = new Request("http://localhost/api/app/attendance/punch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toContain("A punch type is required");
    });

    it("rejects invalid punch types with 400 VALIDATION_ERROR", async () => {
      const request = new Request("http://localhost/api/app/attendance/punch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "invalid_punch" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toContain("Invalid punch type");
    });
  });

  describe("Self-Service & Punch on Behalf of Other Employee Constraints", () => {
    it("allows authorized employee (e.g. Arjun Kumar as HR_ADMIN) to clock in for themselves", async () => {
      const request = new Request("http://localhost/api/app/attendance/punch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "clock_in" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.record.id).toBe("rec-punch-001");
      expect(mockRecordPunch).toHaveBeenCalledWith({
        organizationId,
        userId: callerUserId,
        type: "clock_in",
        employeeId: callerEmployeeId,
      });
    });

    it("allows employee with explicit employeeId matching their own profile to clock in", async () => {
      const request = new Request("http://localhost/api/app/attendance/punch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "clock_in", employeeId: callerEmployeeId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRecordPunch).toHaveBeenCalledWith({
        organizationId,
        userId: callerUserId,
        type: "clock_in",
        employeeId: callerEmployeeId,
      });
    });

    it("rejects attempt to punch for a cross-tenant or non-existent employee ID with 404 NOT_FOUND", async () => {
      mockTargetEmployee = null; // not found in this organization

      const request = new Request("http://localhost/api/app/attendance/punch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "clock_in", employeeId: "emp-cross-tenant-uuid" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toContain("Employee not found in this organization");
      expect(mockRecordPunch).not.toHaveBeenCalled();
    });

    it("rejects HR audit mode attempt to punch on behalf of another employee with 403 FORBIDDEN", async () => {
      mockTargetEmployee = {
        id: "emp-other-uuid",
        organizationId,
        displayName: "Other Employee",
      };

      const request = new Request("http://localhost/api/app/attendance/punch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "clock_in", employeeId: "emp-other-uuid" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toContain("not authorized to record attendance punches for other employees");
      expect(mockRecordPunch).not.toHaveBeenCalled();
    });
  });
});
