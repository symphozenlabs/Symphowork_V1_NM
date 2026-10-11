import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { EnterpriseJourneyMap, JOURNEY_MILESTONES } from "./enterprise-journey-map";

describe("Enterprise Journey Map Component", () => {
  it("renders all 6 enterprise milestones along the interactive journey trail", () => {
    const html = renderToStaticMarkup(React.createElement(EnterpriseJourneyMap));

    // Verifies the World Map header & badges
    expect(html).toContain("The Journey of an Enterprise.");
    expect(html).toContain("Interactive Enterprise World Map");

    // Verifies all 6 milestone levels
    expect(html).toContain("STAGE-01");
    expect(html).toContain("Organization Creation");
    expect(html).toContain("Organization Headquarters Plinth");

    expect(html).toContain("STAGE-02");
    expect(html).toContain("Owner Assignment &amp; Employee Onboarding");
    expect(html).toContain("Onboarding Campus &amp; Welcome Portal");

    expect(html).toContain("STAGE-03");
    expect(html).toContain("Departments &amp; Teams Formation");
    expect(html).toContain("Functional Department Pods");

    expect(html).toContain("STAGE-04");
    expect(html).toContain("Operational Foundation");
    expect(html).toContain("Coordinated Operations Hub");

    expect(html).toContain("STAGE-05");
    expect(html).toContain("Growing Enterprise");
    expect(html).toContain("Mature Enterprise Headquarters");

    expect(html).toContain("STAGE-06");
    expect(html).toContain("Enterprise Expansion &amp; Sub-Branches");
    expect(html).toContain("Multi-Branch Regional Network");

    // Verifies SVG journey road & moving animated traveler paths
    expect(html).toContain("hud-rail-dash");
    expect(html).toContain("enterpriseJourneyTrail");
    expect(html).toContain("enterpriseTraveler");
    expect(html).toContain("animateMotion");

    // Verifies hover-only milestone regions with accessible labels
    expect(html).toContain("role=\"region\"");
  });

  it("contains exact verified milestones matching real SymphoWork modules", () => {
    expect(JOURNEY_MILESTONES).toHaveLength(6);
    expect(JOURNEY_MILESTONES[0].subsystemPath).toBe("modules/platform/provisioning.ts");
    expect(JOURNEY_MILESTONES[1].subsystemPath).toBe("modules/identity/auth.ts");
    expect(JOURNEY_MILESTONES[2].subsystemPath).toBe("modules/master-data & tenancy");
    expect(JOURNEY_MILESTONES[3].subsystemPath).toBe("modules/attendance, workflows & payroll");
    expect(JOURNEY_MILESTONES[4].subsystemPath).toBe("modules/reporting & platform/analytics");
    expect(JOURNEY_MILESTONES[5].subsystemPath).toBe("modules/reporting & platform/analytics");
  });
});
