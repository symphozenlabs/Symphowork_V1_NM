import { beforeEach, describe, expect, it, vi } from "vitest";
import { attendancePunches, attendanceRecords, employees, shifts } from "@/db/schema";

const mockTenantContext = vi.fn();
const mockAuthorize = vi.fn();
const mockGetOrEnsureEmployeeForUser = vi.fn();

type MockEmployee = {
  id: string;
  organizationId: string;
  userId: string | null;
  displayName: string;
  employeeId: string;
  shiftId: string | null;
};

type MockShift = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  overnight: boolean;
  breakMinutes: number;
  graceMinutes: number;
};

let mockCallerEmployee: MockEmployee;
let mockTargetEmployee: MockEmployee | null = null;
let mockAssignedShift: MockShift | null = null;
let mockAttendanceRecords: Array<Record<string, unknown>> = [];
let mockAttendancePunches: Array<Record<string, unknown>> = [];

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: () => mockTenantContext(),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize: (args: unknown) => mockAuthorize(args),
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
          if (table === shifts) {
            return Promise.resolve(mockAssignedShift ? [mockAssignedShift] : []);
          }
          if (table === attendanceRecords) {
            const queryObj = Promise.resolve(mockAttendanceRecords) as Promise<unknown> & { orderBy: unknown };
            queryObj.orderBy = vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve(mockAttendanceRecords)),
            }));
            return queryObj;
          }
          if (table === attendancePunches) {
            return {
              orderBy: vi.fn(() => Promise.resolve(mockAttendancePunches)),
            };
          }
          return Promise.resolve([]);
        }),
      })),
    })),
  },
}));

import { GET } from "./route";

describe("Attendance API - Shift Loading and Multi-Employee Auditing", () => {
  const organizationId = "org-test-uuid";
  const adminUserId = "user-admin-uuid";
  const arjunEmployeeId = "emp-arjun-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
    mockAttendanceRecords = [];
    mockAttendancePunches = [];
    mockAssignedShift = null;
    mockTargetEmployee = null;

    mockTenantContext.mockResolvedValue({
      organization: { id: organizationId, name: "SymphoCorp" },
      user: { id: adminUserId, email: "admin@symphocorp.com" },
      role: { key: "ORGANIZATION_OWNER" },
    });

    mockCallerEmployee = {
      id: "emp-admin-uuid",
      organizationId,
      userId: adminUserId,
      displayName: "Admin Owner",
      employeeId: "EMP0001",
      shiftId: null, // Admin has no shift
    };

    mockGetOrEnsureEmployeeForUser.mockResolvedValue(mockCallerEmployee);
  });

  describe("Personal Attendance Loading (no employeeId query param)", () => {
    it("returns hasShift=false and shift=null when the caller employee has no shift assigned", async () => {
      mockCallerEmployee.shiftId = null;

      const request = new Request("http://localhost/api/app/attendance");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.hasShift).toBe(false);
      expect(data.shift).toBeNull();
      expect(data.employee.id).toBe(mockCallerEmployee.id);
      expect(data.employee.isSelf).toBe(true);
    });

    it("returns hasShift=true and shift metadata when the caller employee has an assigned shift", async () => {
      mockCallerEmployee.shiftId = "shift-day-01";
      mockAssignedShift = {
        id: "shift-day-01",
        organizationId,
        name: "General Day Shift",
        code: "GEN_DAY",
        startTime: "09:00:00",
        endTime: "18:00:00",
        overnight: false,
        breakMinutes: 60,
        graceMinutes: 15,
      };

      const request = new Request("http://localhost/api/app/attendance");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.hasShift).toBe(true);
      expect(data.shift).toEqual({
        id: "shift-day-01",
        name: "General Day Shift",
        code: "GEN_DAY",
        startTime: "09:00:00",
        endTime: "18:00:00",
        overnight: false,
        breakMinutes: 60,
        graceMinutes: 15,
      });
      expect(data.employee.isSelf).toBe(true);
    });
  });

  describe("Target Employee Shift and Attendance Loading (with ?employeeId=...)", () => {
    it("loads Arjun Kumar's assigned shift when requested by authorized HR Admin/Owner", async () => {
      mockTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "SymphoCorp" },
        user: { id: adminUserId, email: "admin@symphocorp.com" },
        role: { key: "HR_ADMIN" },
      });

      mockTargetEmployee = {
        id: arjunEmployeeId,
        organizationId,
        userId: "user-arjun-uuid",
        displayName: "Arjun Kumar",
        employeeId: "EMP0002",
        shiftId: "shift-arjun-gen-day",
      };

      mockAssignedShift = {
        id: "shift-arjun-gen-day",
        organizationId,
        name: "General Day Shift",
        code: "GEN_DAY",
        startTime: "09:00:00",
        endTime: "18:00:00",
        overnight: false,
        breakMinutes: 60,
        graceMinutes: 15,
      };

      const request = new Request(`http://localhost/api/app/attendance?employeeId=${arjunEmployeeId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.hasShift).toBe(true);
      expect(data.shift).toBeDefined();
      expect(data.shift.name).toBe("General Day Shift");
      expect(data.shift.breakMinutes).toBe(60);
      expect(data.shift.graceMinutes).toBe(15);
      expect(data.employee.id).toBe(arjunEmployeeId);
      expect(data.employee.displayName).toBe("Arjun Kumar");
      expect(data.employee.isSelf).toBe(false);
    });

    it("rejects non-privileged EMPLOYEE from viewing another employee's attendance", async () => {
      mockTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "SymphoCorp" },
        user: { id: "user-regular", email: "regular@symphocorp.com" },
        role: { key: "EMPLOYEE" },
      });

      const request = new Request(`http://localhost/api/app/attendance?employeeId=${arjunEmployeeId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.message).toContain("not authorized to view attendance records for other employees");
    });

    it("returns 404 when target employee is not found in the organization (tenant isolation)", async () => {
      mockTenantContext.mockResolvedValue({
        organization: { id: organizationId, name: "SymphoCorp" },
        user: { id: adminUserId, email: "admin@symphocorp.com" },
        role: { key: "ORGANIZATION_OWNER" },
      });
      mockTargetEmployee = null; // not found in org

      const request = new Request(`http://localhost/api/app/attendance?employeeId=emp-nonexistent`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toContain("Employee not found in this organization");
    });
  });
});
