import { describe, expect, it, vi } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Portal: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

import { EditEmployeeDialog } from "./edit-employee-dialog";
import type { EmployeeDetails } from "@/modules/employees/service";

const mockEmployee = {
  id: "emp-test-01",
  organizationId: "org-1",
  employeeId: "EMP0001",
  firstName: "Arun",
  middleName: "Kumar",
  lastName: "Patel",
  displayName: "Arun Kumar Patel",
  personalEmail: "arun.patel@personal.com",
  workEmail: "arun@company.com",
  phone: "+91 98765 00000",
  city: "Mumbai",
  addressLine1: "42 Marine Drive",
  joiningDate: "2024-01-15",
  status: "active",
  departmentId: "dept-eng",
  designationId: "desig-lead",
  shiftId: "shift-general",
  employmentTypeId: "type-ft",
  reportingManagerId: "emp-mgr",
  teamId: "team-alpha",
  locationId: "loc-hq",
  roleKey: "PROJECT_MANAGER",
  roleTitle: "Project Manager",
  department: { id: "dept-eng", name: "Engineering", code: "ENG", status: "active" },
  designation: { id: "desig-lead", name: "Lead Engineer", code: "LEAD", level: 4, status: "active" },
  shift: {
    id: "shift-general",
    name: "General Shift",
    code: "GEN",
    startTime: "09:30:00",
    endTime: "18:30:00",
    breakMinutes: 60,
    graceMinutes: 15,
    overnight: false,
    status: "active",
  },
  employmentType: { id: "type-ft", name: "Full-Time", code: "FT", status: "active" },
  reportingManager: { id: "emp-mgr", displayName: "Ramesh Sharma", employeeId: "EMP0000", workEmail: null },
  team: { id: "team-alpha", name: "Alpha Squad", code: "ALPHA", status: "active" },
  location: { id: "loc-hq", name: "Headquarters", code: "HQ", status: "active" },
} as unknown as EmployeeDetails;

describe("EditEmployeeDialog Component", () => {
  it("renders trigger Edit Employee button with pen icon when closed", () => {
    const html = renderToStaticMarkup(
      React.createElement(EditEmployeeDialog, {
        employee: mockEmployee,
        currentUserRole: "ORGANIZATION_OWNER",
        currentUserId: "user-owner",
      })
    );

    expect(html).toContain("Edit Employee");
  });

  it("pre-loads current employee details into form when opened", () => {
    const html = renderToStaticMarkup(
      React.createElement(EditEmployeeDialog, {
        open: true,
        onOpenChange: vi.fn(),
        employee: mockEmployee,
        currentUserRole: "ORGANIZATION_OWNER",
        currentUserId: "user-owner",
      })
    );

    expect(html).toContain("Edit Employee Profile");
    expect(html).toContain("Arun Kumar Patel");
    expect(html).toContain("EMP0001");
    expect(html).toContain("arun.patel@personal.com");
    expect(html).toContain("arun@company.com");
    expect(html).toContain("+91 98765 00000");
    expect(html).toContain("Mumbai");
    expect(html).toContain("42 Marine Drive");
    expect(html).toContain("2024-01-15");
  });

  it("displays live shift preview details with start/end time, break, and grace period", () => {
    const html = renderToStaticMarkup(
      React.createElement(EditEmployeeDialog, {
        open: true,
        onOpenChange: vi.fn(),
        employee: mockEmployee,
        currentUserRole: "ORGANIZATION_OWNER",
        currentUserId: "user-owner",
      })
    );

    expect(html).toContain("General Shift");
    expect(html).toContain("09:30 – 18:30");
    expect(html).toContain("60 mins");
    expect(html).toContain("15 mins");
    expect(html).toContain("Daytime Shift");
  });

  it("locks role selection when target employee is an Organization Owner", () => {
    const ownerEmployee: EmployeeDetails = {
      ...mockEmployee,
      roleKey: "ORGANIZATION_OWNER",
      roleTitle: "Organization Owner",
    };

    const html = renderToStaticMarkup(
      React.createElement(EditEmployeeDialog, {
        open: true,
        onOpenChange: vi.fn(),
        employee: ownerEmployee,
        currentUserRole: "ORGANIZATION_OWNER",
        currentUserId: "user-owner",
        isOwnerViewer: true,
      })
    );

    expect(html).toContain("Owner Protected");
    expect(html).toContain("The Organization Owner role is protected and cannot be changed.");
  });

  it("disables team selection and shows policy notice when target is an HR role", () => {
    const hrEmployee: EmployeeDetails = {
      ...mockEmployee,
      roleKey: "HR_ADMIN",
      roleTitle: "HR Administrator",
      teamId: null,
      team: null,
    };

    const html = renderToStaticMarkup(
      React.createElement(EditEmployeeDialog, {
        open: true,
        onOpenChange: vi.fn(),
        employee: hrEmployee,
        currentUserRole: "ORGANIZATION_OWNER",
        currentUserId: "user-owner",
      })
    );

    expect(html).toContain("Team selection is disabled for HR roles by organization policy.");
  });

  it("does not render any destructive Delete Employee button", () => {
    const html = renderToStaticMarkup(
      React.createElement(EditEmployeeDialog, {
        open: true,
        onOpenChange: vi.fn(),
        employee: mockEmployee,
        currentUserRole: "ORGANIZATION_OWNER",
        currentUserId: "user-owner",
      })
    );

    expect(html).not.toContain("Delete Employee");
    expect(html).not.toContain("Delete Record");
    expect(html).not.toContain("Remove Employee");
  });
});
