"use client";

import React from "react";
import { LoginIdentityHud } from "./login-identity-hud";
import { RegisterOnboardingHud } from "./register-onboarding-hud";
import { RecoveryPipelineHud } from "./recovery-pipeline-hud";
import { EcosystemConstellationHud, WorkflowPipelineHud } from "./ecosystem-constellation-hud";
import { EnterpriseGrowthJourneyHud } from "./enterprise-growth-hud";

export type HudVariant = "ecosystem" | "auth" | "onboarding" | "recovery";

export interface WorkforceNetworkHudProps {
  variant?: HudVariant;
  className?: string;
  showTelemetry?: boolean;
}

/**
 * WorkforceNetworkHud dispatches to four genuinely distinct, page-specific visual experiences:
 * - "ecosystem"  -> EnterpriseGrowthJourneyHud (Continuous enterprise growth journey from genesis to scale)
 * - "auth"       -> LoginIdentityHud (Concentric radar verification gateway)
 * - "onboarding" -> RegisterOnboardingHud (Hierarchical tree organization blueprint)
 * - "recovery"   -> RecoveryPipelineHud (Directional S-curve recovery railway)
 */
export function WorkforceNetworkHud({
  variant = "ecosystem",
  className,
  showTelemetry = true,
}: WorkforceNetworkHudProps) {
  switch (variant) {
    case "auth":
      return <LoginIdentityHud className={className} showTelemetry={showTelemetry} />;
    case "onboarding":
      return <RegisterOnboardingHud className={className} showTelemetry={showTelemetry} />;
    case "recovery":
      return <RecoveryPipelineHud className={className} showTelemetry={showTelemetry} />;
    case "ecosystem":
    default:
      return <EnterpriseGrowthJourneyHud className={className} showTelemetry={showTelemetry} />;
  }
}

import { EnterpriseJourneyMap } from "../journey/enterprise-journey-map";

export {
  LoginIdentityHud,
  RegisterOnboardingHud,
  RecoveryPipelineHud,
  EnterpriseGrowthJourneyHud,
  EnterpriseJourneyMap,
  WorkflowPipelineHud,
  EcosystemConstellationHud,
};
