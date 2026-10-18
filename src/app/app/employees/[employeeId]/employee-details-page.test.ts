import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mockRedirect = vi.fn();
const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/app/employees/emp-1",
  redirect: (path: string) => {
    mockRedirect(path);
    throw new Error(`NEXT_REDIRECT: ${path}`);
  },
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

let mockUser: { id: string } | null = { id: "user-hr-admin" };
let mockTenant: { organization: { id: string } | null; role: { key: string } | null } = {
  organization: { id: "org-1" },
  role: { key: "HR_ADMIN" },
};
let mockEmployeeRecord: Record<string, unknown> | null = null;

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser: vi.fn(() => Promise.resolve(mockUser)),
}));

vi.mock("@/modules/tenancy/context", () => ({
  resolveTenantContext: vi.fn(() => Promise.resolve(mockTenant)),
}));

const { mockCan, mockIsOrganizationOwnerEmployee, mockGetEmployeeDetails } = vi.hoisted(() => ({
  mockCan: vi.fn<(input?: { permission?: string; [key: string]: unknown }) => Promise<boolean>>(() => Promise.resolve(true)),
  mockIsOrganizationOwnerEmployee: vi.fn(),
  mockGetEmployeeDetails: vi.fn(),
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  can: mockCan,
}));

vi.mock("@/modules/employees/service", () => ({
  isOrganizationOwnerEmployee: (...args: unknown[]) => mockIsOrganizationOwnerEmployee(...args),
  getEmployeeDetails: (...args: unknown[]) => mockGetEmployeeDetails(...args),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(mockEmployeeRecord ? [mockEmployeeRecord] : []),
      }),
    }),
  },
}));

import EmployeeDetailsPage from "./page";

describe("EmployeeDetailsPage route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCan.mockReset();
    mockCan.mockResolvedValue(true);
    mockIsOrganizationOwnerEmployee.mockReset();
    mockIsOrganizationOwnerEmployee.mockResolvedValue(false);
    mockGetEmployeeDetails.mockImplementation(() => {
      if (!mockEmployeeRecord) return Promise.resolve(null);
      return Promise.resolve({
        ...mockEmployeeRecord,
        department: (mockEmployeeRecord as Record<string, unknown>).department ?? null,
        designation: (mockEmployeeRecord as Record<string, unknown>).designation ?? null,
        shift: (mockEmployeeRecord as Record<string, unknown>).shift ?? null,
        employmentType: (mockEmployeeRecord as Record<string, unknown>).employmentType ?? null,
        reportingManager: (mockEmployeeRecord as Record<string, unknown>).reportingManager ?? null,
        team: (mockEmployeeRecord as Record<string, unknown>).team ?? null,
        location: (mockEmployeeRecord as Record<string, unknown>).location ?? null,
        roleKey: (mockEmployeeRecord as Record<string, unknown>).roleKey ?? null,
        roleTitle: (mockEmployeeRecord as Record<string, unknown>).roleTitle ?? null,
      });
    });
    mockUser = { id: "user-hr-admin" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "HR_ADMIN" },
    };
  });

  it("redirects HR Admin away from their own employee management/onboarding profile to /app/employees", async () => {
    mockEmployeeRecord = {
      id: "emp-self",
      organizationId: "org-1",
      userId: "user-hr-admin", // Matches logged-in HR Admin
      displayName: "Arjun Kumar",
      status: "onboarding",
    };

    await expect(
      EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-self" }) })
    ).rejects.toThrow("NEXT_REDIRECT: /app/employees");

    expect(mockRedirect).toHaveBeenCalledWith("/app/employees");
  }, 15000);

  it("does not redirect HR Admin when viewing another employee record", async () => {
    mockEmployeeRecord = {
      id: "emp-other",
      organizationId: "org-1",
      userId: "user-other", // Another user
      displayName: "Other Employee",
      status: "active",
      firstName: "Other",
      lastName: "Employee",
    };

    const result = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-other" }) });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  }, 15000);

  it("preserves self employee page access for ORGANIZATION_OWNER", async () => {
    mockUser = { id: "user-owner" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "ORGANIZATION_OWNER" },
    };
    mockEmployeeRecord = {
      id: "emp-owner",
      organizationId: "org-1",
      userId: "user-owner", // Matches owner
      displayName: "Naresh S",
      status: "active",
      firstName: "Naresh",
      lastName: "S",
    };

    const result = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-owner" }) });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  }, 15000);

  it("redirects unauthorized roles lacking employee.read permission to /app", async () => {
    const { can } = await import("@/modules/tenancy/authorization");
    vi.mocked(can).mockResolvedValueOnce(false); // can('employee.read') returns false

    await expect(
      EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-any" }) })
    ).rejects.toThrow("NEXT_REDIRECT: /app");

    expect(mockRedirect).toHaveBeenCalledWith("/app");
  }, 15000);

  it("renders protected view-only Organization Owner view when HR Admin views owner details", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockIsOrganizationOwnerEmployee.mockResolvedValueOnce(true);

    mockUser = { id: "user-hr-admin" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "HR_ADMIN" },
    };
    mockEmployeeRecord = {
      id: "emp-owner",
      organizationId: "org-1",
      userId: "user-owner",
      displayName: "Naresh Technologies Owner",
      status: "active",
      firstName: "Naresh",
      lastName: "Owner",
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-owner" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Protected Organization Owner");
    expect(html).toContain("Organization Owner Record Protected");
    expect(html).toContain("Onboarding, account status, and role configurations for the Organization Owner cannot be modified by other tenant roles.");
  }, 15000);
});

describe("Employment & Organizational Details Section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCan.mockReset();
    mockCan.mockResolvedValue(true);
    mockIsOrganizationOwnerEmployee.mockReset();
    mockIsOrganizationOwnerEmployee.mockResolvedValue(false);
    mockUser = { id: "user-hr-admin" };
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "HR_ADMIN" },
    };
    mockGetEmployeeDetails.mockImplementation(() => {
      if (!mockEmployeeRecord) return Promise.resolve(null);
      return Promise.resolve({
        ...mockEmployeeRecord,
        department: (mockEmployeeRecord as Record<string, unknown>).department ?? null,
        designation: (mockEmployeeRecord as Record<string, unknown>).designation ?? null,
        shift: (mockEmployeeRecord as Record<string, unknown>).shift ?? null,
        employmentType: (mockEmployeeRecord as Record<string, unknown>).employmentType ?? null,
        reportingManager: (mockEmployeeRecord as Record<string, unknown>).reportingManager ?? null,
        team: (mockEmployeeRecord as Record<string, unknown>).team ?? null,
        location: (mockEmployeeRecord as Record<string, unknown>).location ?? null,
        roleKey: (mockEmployeeRecord as Record<string, unknown>).roleKey ?? null,
        roleTitle: (mockEmployeeRecord as Record<string, unknown>).roleTitle ?? null,
      });
    });
  });

  it("renders actual persisted values for department, designation, system role, shift timings, and employment type", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockEmployeeRecord = {
      id: "emp-complete",
      organizationId: "org-1",
      userId: "user-dev-1",
      employeeId: "EMP0042",
      displayName: "Priya Sharma",
      firstName: "Priya",
      lastName: "Sharma",
      workEmail: "priya.sharma@example.com",
      personalEmail: "priya@personal.com",
      phone: "+91 98765 43210",
      city: "Bengaluru",
      joiningDate: "2026-03-01",
      status: "active",
      roleKey: "EMPLOYEE",
      roleTitle: "Employee",
      department: {
        id: "dept-eng",
        name: "Engineering",
        code: "ENG",
        status: "active",
      },
      designation: {
        id: "desig-swe3",
        name: "Senior Software Engineer",
        code: "SWE-III",
        level: 3,
        status: "active",
      },
      shift: {
        id: "shift-day",
        name: "Standard General Shift",
        code: "GEN-DAY",
        startTime: "09:30:00",
        endTime: "18:30:00",
        breakMinutes: 45,
        graceMinutes: 15,
        overnight: false,
        status: "active",
      },
      employmentType: {
        id: "type-fulltime",
        name: "Full-Time Permanent",
        code: "FT",
        status: "active",
      },
      reportingManager: {
        id: "emp-mgr",
        displayName: "Anand Verma",
        employeeId: "EMP0005",
        workEmail: "anand.verma@example.com",
      },
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-complete" }) });
    const html = renderToStaticMarkup(element);

    // Section title
    expect(html).toContain("Employment &amp; Organizational Details");

    // Department with name and code
    expect(html).toContain("Engineering");
    expect(html).toContain("ENG");

    // Designation with name, code, and level
    expect(html).toContain("Senior Software Engineer");
    expect(html).toContain("SWE-III");
    expect(html).toContain("Level 3");

    // System role with key badge
    expect(html).toContain("Employee");
    expect(html).toContain("EMPLOYEE");

    // Actual saved shift name, code, timings, break, and grace period
    expect(html).toContain("Standard General Shift");
    expect(html).toContain("GEN-DAY");
    expect(html).toContain("09:30 – 18:30");
    expect(html).toContain("45 mins");
    expect(html).toContain("15 mins");
    expect(html).toContain("Standard Daytime Shift");

    // Employment type
    expect(html).toContain("Full-Time Permanent");
    expect(html).toContain("FT");

    // Joining date and work email
    expect(html).toContain("2026-03-01");
    expect(html).toContain("priya.sharma@example.com");

    // Reporting manager
    expect(html).toContain("Anand Verma (EMP0005)");
  });

  it("handles missing or unassigned master-data fields with clear fallbacks", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockEmployeeRecord = {
      id: "emp-sparse",
      organizationId: "org-1",
      userId: "user-sparse",
      employeeId: "EMP0099",
      displayName: "Rohan Gupta",
      firstName: "Rohan",
      lastName: "Gupta",
      status: "invited",
      department: null,
      designation: null,
      shift: null,
      employmentType: null,
      reportingManager: null,
      roleKey: null,
      roleTitle: null,
      workEmail: null,
      joiningDate: null,
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-sparse" }) });
    const html = renderToStaticMarkup(element);

    // Fallbacks
    expect(html).toContain("Not assigned");
    expect(html).toContain("Not set");
    expect(html).toContain("No shift schedule configured");
  });

  it("correctly distinguishes between HR Administrator and HR Executive system roles without confusing with designations", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");

    // Case 1: HR Administrator
    mockEmployeeRecord = {
      id: "emp-hr-admin",
      organizationId: "org-1",
      userId: "user-hr-admin-rec",
      employeeId: "EMP0010",
      displayName: "Sanya Malhotra",
      firstName: "Sanya",
      lastName: "Malhotra",
      status: "active",
      roleKey: "HR_ADMIN",
      roleTitle: "HR Admin",
      designation: {
        id: "desig-lead",
        name: "People Operations Lead",
        code: "PO-LEAD",
        level: null,
        status: "active",
      },
      department: {
        id: "dept-hr",
        name: "Human Resources",
        code: "HR",
        status: "active",
      },
    };

    const adminElement = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-hr-admin" }) });
    const adminHtml = renderToStaticMarkup(adminElement);

    // Shows system role HR_ADMIN & HR Admin
    expect(adminHtml).toContain("HR_ADMIN");
    expect(adminHtml).toContain("HR Admin");
    // Designation is separate
    expect(adminHtml).toContain("People Operations Lead");
    expect(adminHtml).toContain("PO-LEAD");

    // Case 2: HR Executive
    mockEmployeeRecord = {
      id: "emp-hr-exec",
      organizationId: "org-1",
      userId: "user-hr-exec-rec",
      employeeId: "EMP0011",
      displayName: "Vikram Das",
      firstName: "Vikram",
      lastName: "Das",
      status: "active",
      roleKey: "HR_EXECUTIVE",
      roleTitle: "HR Executive",
      designation: {
        id: "desig-specialist",
        name: "Talent Acquisition Specialist",
        code: "TA-SPEC",
        level: null,
        status: "active",
      },
      department: {
        id: "dept-hr",
        name: "Human Resources",
        code: "HR",
        status: "active",
      },
    };

    const execElement = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-hr-exec" }) });
    const execHtml = renderToStaticMarkup(execElement);

    expect(execHtml).toContain("HR_EXECUTIVE");
    expect(execHtml).toContain("HR Executive");
    expect(execHtml).toContain("Talent Acquisition Specialist");
  });

  it("handles inactive master data references gracefully without crashing", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockEmployeeRecord = {
      id: "emp-inactive-ref",
      organizationId: "org-1",
      userId: "user-inactive-ref",
      employeeId: "EMP0015",
      displayName: "Amit Patel",
      firstName: "Amit",
      lastName: "Patel",
      status: "active",
      department: {
        id: "dept-legacy",
        name: "Legacy Operations",
        code: "LEG-OPS",
        status: "inactive",
      },
      designation: {
        id: "desig-old",
        name: "Junior Trainee",
        code: "JR-TRN",
        level: 1,
        status: "inactive",
      },
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-inactive-ref" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Legacy Operations");
    expect(html).toContain("Junior Trainee");
    expect(html).toContain("Inactive");
  });

  it("displays overnight shift indicator when shift crosses midnight", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockEmployeeRecord = {
      id: "emp-night",
      organizationId: "org-1",
      userId: "user-night",
      employeeId: "EMP0020",
      displayName: "Kavita Rao",
      firstName: "Kavita",
      lastName: "Rao",
      status: "active",
      shift: {
        id: "shift-night",
        name: "Night Owl Shift",
        code: "NIGHT",
        startTime: "22:00:00",
        endTime: "06:00:00",
        breakMinutes: 60,
        graceMinutes: 15,
        overnight: true,
        status: "active",
      },
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-night" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Night Owl Shift");
    expect(html).toContain("22:00 – 06:00");
    expect(html).toContain("Overnight Shift (Crosses Midnight)");
  });

  it("renders attendance history link when user has attendance.read permission", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockEmployeeRecord = {
      id: "emp-attendance-link",
      organizationId: "org-1",
      userId: "user-link",
      employeeId: "EMP0030",
      displayName: "Deepak Chawla",
      firstName: "Deepak",
      lastName: "Chawla",
      status: "active",
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-attendance-link" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("/app/attendance?employeeId=emp-attendance-link");
    expect(html).toContain("Attendance History");
  });

  it("enforces tenant isolation and throws notFound when employee is not found in tenant", async () => {
    mockEmployeeRecord = null;
    mockGetEmployeeDetails.mockResolvedValueOnce(null);

    await expect(
      EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-other-org" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renders Edit Employee action in header when actor has employee.update permission", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockEmployeeRecord = {
      id: "emp-edit-allowed",
      organizationId: "org-1",
      userId: "user-edit-target",
      employeeId: "EMP0088",
      displayName: "Vikram Seth",
      firstName: "Vikram",
      lastName: "Seth",
      status: "active",
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-edit-allowed" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Edit Employee");
  });

  it("hides Edit Employee action when actor lacks employee.update permission", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockCan.mockImplementation((input?: { permission?: string }) => {
      if (input?.permission === "employee.update") return Promise.resolve(false);
      return Promise.resolve(true);
    });

    mockEmployeeRecord = {
      id: "emp-edit-denied",
      organizationId: "org-1",
      userId: "user-viewonly",
      employeeId: "EMP0089",
      displayName: "Ananya Roy",
      firstName: "Ananya",
      lastName: "Roy",
      status: "active",
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-edit-denied" }) });
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain("Edit Employee");
  });

  it("hides Edit Employee action when non-owner views protected Organization Owner record", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockIsOrganizationOwnerEmployee.mockResolvedValue(true);
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "HR_ADMIN" },
    };

    mockEmployeeRecord = {
      id: "emp-owner-protected",
      organizationId: "org-1",
      userId: "user-owner-account",
      employeeId: "EMP0001",
      displayName: "Apex Owner",
      firstName: "Apex",
      lastName: "Owner",
      status: "active",
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-owner-protected" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Protected Organization Owner");
    expect(html).not.toContain("Edit Employee");
  });

  it("allows Organization Owner to view and edit employees across various roles (e.g. Recruiter)", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockTenant = {
      organization: { id: "org-1" },
      role: { key: "ORGANIZATION_OWNER" },
    };

    mockEmployeeRecord = {
      id: "emp-recruiter",
      organizationId: "org-1",
      userId: "user-recruiter",
      employeeId: "EMP0077",
      displayName: "Rohit Recruiter",
      firstName: "Rohit",
      lastName: "Recruiter",
      status: "active",
      roleKey: "RECRUITER",
      roleTitle: "Recruiter",
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-recruiter" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Edit Employee");
    expect(html).toContain("Rohit Recruiter");
    expect(html).toContain("Recruiter");
  });

  it("does not render any destructive Delete Employee button (employee deletion is prohibited)", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    mockEmployeeRecord = {
      id: "emp-no-delete",
      organizationId: "org-1",
      userId: "user-target",
      employeeId: "EMP0065",
      displayName: "Sanjay Singhania",
      firstName: "Sanjay",
      lastName: "Singhania",
      status: "active",
    };

    const element = await EmployeeDetailsPage({ params: Promise.resolve({ employeeId: "emp-no-delete" }) });
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain("Delete Employee");
    expect(html).not.toContain("Delete Record");
    expect(html).not.toContain("Remove Employee");
  });
});

