import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { LoginIdentityHud } from "./login-identity-hud";
import { RegisterOnboardingHud } from "./register-onboarding-hud";
import { RecoveryPipelineHud } from "./recovery-pipeline-hud";
import { EnterpriseGrowthJourneyHud } from "./enterprise-growth-hud";
import { WorkforceNetworkHud } from "./workforce-network-hud";

describe("Distinct Page-Specific Animated HUD System", () => {
  it("renders LoginIdentityHud as a concentric security gateway with radar scanner", () => {
    const html = renderToStaticMarkup(React.createElement(LoginIdentityHud));

    // Verifies concentric authentication gateway visual elements
    expect(html).toContain("Identity Authentication Gateway");
    expect(html).toContain("SCANNER: ARMED");
    expect(html).toContain("IDENTITY GATEWAY");
    expect(html).toContain("CREDENTIAL DIGEST");
    expect(html).toContain("DEVICE TELEMETRY");
    expect(html).toContain("ZERO-TRUST RBAC");
    expect(html).toContain("SESSION ENCLAVE");
    expect(html).toContain("Verification Sequence");
    expect(html).toContain("AES-256-GCM");
  });

  it("renders RegisterOnboardingHud as a hierarchical organization tree blueprint", () => {
    const html = renderToStaticMarkup(React.createElement(RegisterOnboardingHud));

    // Verifies hierarchical organization tree elements
    expect(html).toContain("Workforce Onboarding Tree");
    expect(html).toContain("TENANT: EXPANDING");
    expect(html).toContain("TENANT ROOT");
    expect(html).toContain("ORGANIZATION BOUNDARY");
    expect(html).toContain("OPERATIONS");
    expect(html).toContain("TECH &amp; CORE");
    expect(html).toContain("PEOPLE &amp; HR");
    expect(html).toContain("NEW OPERATOR");
    expect(html).toContain("Workspace Provisioning Blueprint");
  });

  it("renders RecoveryPipelineHud as a directional S-curve recovery pathway", () => {
    const html = renderToStaticMarkup(React.createElement(RecoveryPipelineHud));

    // Verifies directional recovery rail elements
    expect(html).toContain("Account Recovery Pathway");
    expect(html).toContain("CHANNEL: SECURE");
    expect(html).toContain("IDENTITY ANCHOR");
    expect(html).toContain("TOKEN ENCLAVE");
    expect(html).toContain("SECURE DISPATCH");
    expect(html).toContain("ATOMIC RE-KEY");
    expect(html).toContain("Atomic Recovery Checklist");
    expect(html).toContain("hud-rail-dash");
  });

  it("renders EnterpriseGrowthJourneyHud as a continuous enterprise growth journey from genesis to scale", () => {
    const html = renderToStaticMarkup(React.createElement(EnterpriseGrowthJourneyHud));

    // Verifies the 6 stages and enterprise SaaS storytelling elements
    expect(html).toContain("Enterprise Growth Journey");
    expect(html).toContain("Live Product Flow");
    expect(html).toContain("1. Genesis");
    expect(html).toContain("2. Executive Owner");
    expect(html).toContain("3. Onboarding");
    expect(html).toContain("4. Department Pods");
    expect(html).toContain("5. Daily Operations");
    expect(html).toContain("6. Enterprise BI");
    expect(html).toContain("Acme Global Technologies Inc.");
    expect(html).toContain("Stage 01 · Workspace Genesis");
    expect(html).toContain("Postgres RLS Active");
    expect(html).toContain("EMP0001");
  });

  it("dispatches each variant in WorkforceNetworkHud to its distinct component", () => {
    const authHtml = renderToStaticMarkup(React.createElement(WorkforceNetworkHud, { variant: "auth" }));
    expect(authHtml).toContain("Identity Authentication Gateway");
    expect(authHtml).not.toContain("TENANT ROOT");

    const onboardHtml = renderToStaticMarkup(React.createElement(WorkforceNetworkHud, { variant: "onboarding" }));
    expect(onboardHtml).toContain("Workforce Onboarding Tree");
    expect(onboardHtml).not.toContain("Identity Authentication Gateway");

    const recoveryHtml = renderToStaticMarkup(React.createElement(WorkforceNetworkHud, { variant: "recovery" }));
    expect(recoveryHtml).toContain("Account Recovery Pathway");
    expect(recoveryHtml).not.toContain("Workforce Onboarding Tree");

    const ecosystemHtml = renderToStaticMarkup(React.createElement(WorkforceNetworkHud, { variant: "ecosystem" }));
    expect(ecosystemHtml).toContain("Enterprise Growth Journey");
    expect(ecosystemHtml).toContain("Acme Global Technologies Inc.");
    expect(ecosystemHtml).toContain("1. Genesis");
  });
});
