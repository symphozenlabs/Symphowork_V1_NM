import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { OnboardingWizard } from "./onboarding-wizard";
import {
  ONBOARDING_WIZARD_STEPS,
} from "./types";
import {
  ROLE_METADATA,
  getAssignableRoles,
  canAssignRole,
} from "@/modules/rbac/permissions";
import { RoleIllustration } from "./role-illustrations";

describe("OnboardingWizard Stepper and Flow Definitions", () => {
  it("defines exactly 5 consecutive steps in the required order", () => {
    expect(ONBOARDING_WIZARD_STEPS).toHaveLength(5);
    const stepIds = ONBOARDING_WIZARD_STEPS.map((s) => s.id);
    expect(stepIds).toEqual([1, 2, 3, 4, 5]);

    expect(ONBOARDING_WIZARD_STEPS[0].title).toBe("Select Role");
    expect(ONBOARDING_WIZARD_STEPS[1].title).toBe("Profile & Assignments");
    expect(ONBOARDING_WIZARD_STEPS[2].title).toBe("Review & Confirm");
    expect(ONBOARDING_WIZARD_STEPS[3].title).toBe("Profile Created");
    expect(ONBOARDING_WIZARD_STEPS[4].title).toBe("Send Invitation");
  });

  it("renders 8 permitted role choices for ORGANIZATION_OWNER", () => {
    const html = renderToStaticMarkup(
      React.createElement(OnboardingWizard, {
        currentUserRole: "ORGANIZATION_OWNER",
        organizationId: "org-123",
      })
    );

    const ownerRoles = getAssignableRoles("ORGANIZATION_OWNER");
    expect(ownerRoles).toHaveLength(8);

    for (const roleKey of ownerRoles) {
      const meta = ROLE_METADATA[roleKey];
      expect(html).toContain(meta.title);
      expect(html).toContain(meta.shortDescription);
    }

    // Must never contain Platform Owner or Organization Owner in choices
    expect(html).not.toContain("Global SaaS root administrator");
  });

  it("renders 7 permitted role choices for HR_ADMIN (excludes HR_ADMIN)", () => {
    const html = renderToStaticMarkup(
      React.createElement(OnboardingWizard, {
        currentUserRole: "HR_ADMIN",
        organizationId: "org-123",
      })
    );

    const hrAdminRoles = getAssignableRoles("HR_ADMIN");
    expect(hrAdminRoles).toHaveLength(7);

    expect(html).toContain("HR Executive");
    expect(html).toContain("Finance Administrator");
    expect(html).toContain("Department Manager");
    expect(html).toContain("Team Lead");
    expect(html).toContain("Project Manager");
    expect(html).toContain("Talent Recruiter");
    expect(html).toContain("Employee");

    // Must not allow HR_ADMIN or ORGANIZATION_OWNER
    expect(canAssignRole("HR_ADMIN", "HR_ADMIN")).toBe(false);
    expect(canAssignRole("HR_ADMIN", "ORGANIZATION_OWNER")).toBe(false);
  });

  it("renders only EMPLOYEE for HR_EXECUTIVE", () => {
    const html = renderToStaticMarkup(
      React.createElement(OnboardingWizard, {
        currentUserRole: "HR_EXECUTIVE",
        organizationId: "org-123",
      })
    );

    const hrExecRoles = getAssignableRoles("HR_EXECUTIVE");
    expect(hrExecRoles).toEqual(["EMPLOYEE"]);

    expect(html).toContain("Employee");
    expect(html).not.toContain("Department Manager");
    expect(html).not.toContain("HR Administrator");
  });

  it("renders restriction banner for unauthorized roles (e.g. MANAGER)", () => {
    const html = renderToStaticMarkup(
      React.createElement(OnboardingWizard, {
        currentUserRole: "MANAGER",
        organizationId: "org-123",
      })
    );

    expect(html).toContain("Employee Creation Restricted");
    expect(html).toContain("is not authorized to onboard or invite team members");
  });

  it("renders custom SVG illustrations for each operational role", () => {
    const operationalRoles = getAssignableRoles("ORGANIZATION_OWNER");

    for (const role of operationalRoles) {
      const svgHtml = renderToStaticMarkup(
        React.createElement(RoleIllustration, {
          roleKey: role,
          selected: true,
          className: "size-12",
        })
      );

      expect(svgHtml).toContain("<svg");
      expect(svgHtml).toContain("viewBox=\"0 0 120 120\"");
    }
  });

  it("Step 2 displays 'Select a department first' placeholder when no department is chosen", async () => {
    const { Step2RoleDetails } = await import("./step-2-role-details");

    const html = renderToStaticMarkup(
      React.createElement(Step2RoleDetails, {
        form: {
          targetRole: "EMPLOYEE",
          firstName: "Jane",
          middleName: "",
          lastName: "Doe",
          personalEmail: "jane@example.com",
          workEmail: "",
          phone: "",
          joiningDate: "",
          departmentId: "", // No department selected
          designationId: "",
          teamId: "",
          locationId: "",
          shiftId: "",
          employmentTypeId: "",
          reportingManagerId: "",
        },
        onChange: () => {},
        errors: {},
      })
    );

    expect(html).toContain("Select a department first");
    expect(html).toContain("Select a department above to see available teams.");
    expect(html).toContain("disabled");
  });

  it("Step 2 does not show 'Select a department first' when department is selected", async () => {
    const { Step2RoleDetails } = await import("./step-2-role-details");

    const html = renderToStaticMarkup(
      React.createElement(Step2RoleDetails, {
        form: {
          targetRole: "EMPLOYEE",
          firstName: "Jane",
          middleName: "",
          lastName: "Doe",
          personalEmail: "jane@example.com",
          workEmail: "",
          phone: "",
          joiningDate: "",
          departmentId: "dept-sales-123", // Department selected
          designationId: "",
          teamId: "",
          locationId: "",
          shiftId: "",
          employmentTypeId: "",
          reportingManagerId: "",
        },
        onChange: () => {},
        errors: {},
      })
    );

    expect(html).not.toContain("Select a department first");
    expect(html).not.toContain("Select a department above to see available teams.");
  });
});
