import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { DepartmentTeamDialog } from "./department-team-dialog";
import type { DepartmentTeamLeadSummary } from "@/modules/departments/types";

describe("DepartmentTeamDialog UI, Team Lead Dropdown & Empty State", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseProps = {
    open: true,
    mode: "create" as const,
    departmentId: "dept-eng-101",
    departmentName: "Engineering",
    onClose: vi.fn(),
    onSaved: vi.fn(),
  };

  const mockLeads: DepartmentTeamLeadSummary[] = [
    {
      id: "emp-lead-001",
      displayName: "Vikram Mehta",
      employeeId: "EMP002",
      roleKey: "TEAM_LEAD",
      roleTitle: "Team Lead",
      status: "active",
    },
    {
      id: "emp-lead-002",
      displayName: "Ananya Roy",
      employeeId: "EMP003",
      roleKey: "TEAM_LEAD",
      roleTitle: "Team Lead",
      status: "active",
    },
  ];

  it("returns null when open is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(DepartmentTeamDialog, { ...baseProps, open: false })
    );
    expect(html).toBe("");
  });

  it("displays eligible Team Leads in the dropdown when leads are available", () => {
    const html = renderToStaticMarkup(
      React.createElement(DepartmentTeamDialog, {
        ...baseProps,
        eligibleTeamLeads: mockLeads,
      })
    );

    // Dialog title and department scope
    expect(html).toContain("Create New Team / Squad");
    expect(html).toContain("Engineering");

    // Dropdown contains unassigned option
    expect(html).toContain("None (Unassigned)");

    // Eligible leads are present in the DOM
    expect(html).toContain("Vikram Mehta");
    expect(html).toContain("Ananya Roy");
    expect(html).toContain("EMP002");
    expect(html).toContain("EMP003");
    expect(html).toContain("eligible-team-leads-list");

    // Empty state alert must NOT be displayed when leads are available
    expect(html).not.toContain("data-testid=\"team-lead-empty-state\"");
  });

  it("displays clear empty-state message when no eligible Team Leads exist (does not silently show None only)", () => {
    const html = renderToStaticMarkup(
      React.createElement(DepartmentTeamDialog, {
        ...baseProps,
        eligibleTeamLeads: [],
      })
    );

    // Verifies empty-state alert message is rendered
    expect(html).toContain("data-testid=\"team-lead-empty-state\"");
    expect(html).toContain("No eligible Team Leads are available in this organization.");
    expect(html).toContain("TEAM_LEAD");

    // Verifies dropdown explicitly indicates no eligible team leads available
    expect(html).toContain("None (No eligible Team Leads available)");
  });

  it("renders correctly in edit mode with initial team pre-populated", () => {
    const initialTeam = {
      id: "team-fe-1",
      code: "FE-CORE",
      name: "Frontend Core",
      description: "Frontend team",
      status: "active" as const,
      teamLeadEmployeeId: "emp-lead-001",
      teamLeadName: "Vikram Mehta",
    };

    const html = renderToStaticMarkup(
      React.createElement(DepartmentTeamDialog, {
        ...baseProps,
        mode: "edit",
        initialTeam,
        eligibleTeamLeads: mockLeads,
      })
    );

    expect(html).toContain("Edit Team Details");
    expect(html).toContain("Frontend Core");
    expect(html).toContain("FE-CORE");
    expect(html).toContain("Save Changes");
  });

  it("retains currently assigned team lead in edit mode even if eligible list is empty", () => {
    const initialTeam = {
      id: "team-legacy-1",
      code: "LEGACY",
      name: "Legacy Team",
      description: "Legacy squad",
      status: "active" as const,
      teamLeadEmployeeId: "emp-lead-legacy",
      teamLeadName: "Siddharth Rao",
    };

    const html = renderToStaticMarkup(
      React.createElement(DepartmentTeamDialog, {
        ...baseProps,
        mode: "edit",
        initialTeam,
        eligibleTeamLeads: [],
      })
    );

    expect(html).toContain("Siddharth Rao (Current Assignment)");
    expect(html).not.toContain("data-testid=\"team-lead-empty-state\"");
  });
});
