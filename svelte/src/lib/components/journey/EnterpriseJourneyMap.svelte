<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface JourneyMilestone {
  level: number;
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  landmark: string;
  tagline: string;
  subsystemPath: string;
  description: string;
  referenceBullets: string[];
  highlights: string[];
  operationalRole: string;
  securityFeature: string;
  badgeColor: string;
  icon: string;
  coordinates: {
    pin: { x: number; y: number };
  };
}
const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    level: 1,
    id: "creation",
    code: "STAGE-01",
    title: "Organization Creation",
    shortTitle: "Organization Creation",
    landmark: "Organization Headquarters Plinth",
    tagline: "Workspace initialization, tenant boundary & baseline configuration",
    subsystemPath: "modules/platform/provisioning.ts",
    description:
      "An organization workspace is created first. Establish the organization identity, tenant boundary via Postgres Row-Level Security, sequential EMP0001 counter, base currency/timezone defaults, and initial system roles.",
    referenceBullets: [
      "Create organization workspace",
      "Establish tenant boundary",
      "Initialize core configuration",
    ],
    highlights: [
      "Tenant schema isolated via Postgres RLS",
      "Sequential EMP0001 ID counter initialized",
      "Base currency, timezone & system roles configured",
    ],
    operationalRole: "Platform Provisioner",
    securityFeature: "Tenant Boundary Isolation",
    badgeColor: "emerald",
    icon: "Building2",
    coordinates: {
      pin: { x: 14, y: 72 },
    },
  },
  {
    level: 2,
    id: "owner-onboarding",
    code: "STAGE-02",
    title: "Owner Assignment & Employee Onboarding",
    shortTitle: "Employee Onboarding",
    landmark: "Onboarding Campus & Welcome Portal",
    tagline: "Root governance assignment, tokenized invitations & activation checklist",
    subsystemPath: "modules/identity/auth.ts",
    description:
      "Assign the Organization Owner and onboard authorized roles and employees through cryptographic invitations, password establishment, and a structured 3-step compliance onboarding checklist.",
    referenceBullets: [
      "Assign Organization Owner",
      "Send tokenized invitations",
      "Complete onboarding verification",
    ],
    highlights: [
      "Root ORGANIZATION_OWNER role & governance assigned",
      "32-byte opaque cryptographic invitation tokens (7-day lifecycle)",
      "3-step compliance checklist (Profile, Work Details, HR Review)",
    ],
    operationalRole: "ORGANIZATION_OWNER & HR_ADMIN",
    securityFeature: "Argon2id Enclave & SHA-256 Tokens",
    badgeColor: "amber",
    icon: "UserPlus",
    coordinates: {
      pin: { x: 23, y: 31 },
    },
  },
  {
    level: 3,
    id: "departments-teams",
    code: "STAGE-03",
    title: "Departments & Teams Formation",
    shortTitle: "Departments & Teams",
    landmark: "Functional Department Pods",
    tagline: "Functional pods, team leads, managers & reporting hierarchies",
    subsystemPath: "modules/master-data & tenancy",
    description:
      "Organize employees into functional departments (Engineering, People & Culture, Revenue Ops, Product) with designated Team Leads, Managers, and direct hierarchical reporting lines.",
    referenceBullets: [
      "Create functional departments",
      "Organize teams and pods",
      "Define reporting hierarchies",
    ],
    highlights: [
      "Functional department pods (Engineering, HR, Finance, Product)",
      "Hierarchical reporting manager and team lead assignments",
      "Department-scoped Role-Based Access Control (RBAC) boundaries",
    ],
    operationalRole: "TEAM_LEAD & MANAGER",
    securityFeature: "Role-Based Access Control (RBAC)",
    badgeColor: "cyan",
    icon: "Users2",
    coordinates: {
      pin: { x: 50, y: 20.5 },
    },
  },
  {
    level: 4,
    id: "operational-foundation",
    code: "STAGE-04",
    title: "Operational Foundation",
    shortTitle: "Operations Foundation",
    landmark: "Coordinated Operations Hub",
    tagline: "Shifts, attendance, approvals, recruitment, payroll & policies",
    subsystemPath: "modules/attendance, workflows & payroll",
    description:
      "Connect attendance, shift management, leave and approval workflows, recruitment, payroll, and organizational policies into a coordinated operating model.",
    referenceBullets: [
      "Track shifts & attendance",
      "Gated leave approvals",
      "Run recruitment and payroll",
    ],
    highlights: [
      "Timezone shift matching & on-time attendance telemetry",
      "Multi-tier gated approval routing for leave and regularization",
      "ATS candidate intake, resume extraction & finalized payroll runs",
    ],
    operationalRole: "Cross-Functional Operations",
    securityFeature: "Immutable Period Locks & Policy Chains",
    badgeColor: "emerald",
    icon: "Workflow",
    coordinates: {
      pin: { x: 56, y: 57.5 },
    },
  },
  {
    level: 5,
    id: "growing-enterprise",
    code: "STAGE-05",
    title: "Growing Enterprise",
    shortTitle: "Growing Enterprise",
    landmark: "Mature Enterprise Headquarters",
    tagline: "Unified workforce operations, live intelligence & mature governance",
    subsystemPath: "modules/reporting & platform/analytics",
    description:
      "Show how the established organizational structure and coordinated workforce operations enable the organization to mature into a functioning enterprise with unified headcount analytics and compliance visibility.",
    referenceBullets: [
      "Unified people operations",
      "Real-time headcount intelligence",
      "Zero-leakage data mesh",
    ],
    highlights: [
      "Unified workforce analytics & attendance compliance tracking",
      "Department budget oversight & consolidated operational reporting",
      "100% Postgres Row-Level Security (RLS) zero-leakage mesh",
    ],
    operationalRole: "Executive Leadership & Auditors",
    securityFeature: "Zero-Leakage Multi-Tenancy Mesh",
    badgeColor: "purple",
    icon: "LineChart",
    coordinates: {
      pin: { x: 78, y: 76.5 },
    },
  },
  {
    level: 6,
    id: "enterprise-expansion",
    code: "STAGE-06",
    title: "Enterprise Expansion & Sub-Branches",
    shortTitle: "Enterprise Expansion",
    landmark: "Multi-Branch Regional Network",
    tagline: "Multi-branch expansion, business units & centralized governance",
    subsystemPath: "modules/reporting & platform/analytics",
    description:
      "Show the mature enterprise expanding into additional departments, teams, business units, locations, and sub-branches while maintaining centralized governance and tenant isolation.",
    referenceBullets: [
      "Multi-branch enterprise growth",
      "Distributed business units",
      "Centralized tenant governance",
    ],
    highlights: [
      "Multi-branch organizational expansion & business unit partitioning",
      "Centralized executive oversight with delegated branch administration",
      "Tenant-isolated audit observability across all operational units",
    ],
    operationalRole: "Enterprise Board & Global Administrators",
    securityFeature: "Federated Tenant Governance",
    badgeColor: "emerald",
    icon: "Crown",
    coordinates: {
      pin: { x: 82, y: 27 },
    },
  },
];
const HIGHWAY_PATH =
  "M 140 490 C 140 350, 170 230, 230 210 C 290 190, 420 120, 500 140 C 580 160, 490 320, 560 390 C 630 460, 710 550, 780 520 C 840 490, 830 270, 820 185";
const INVITATION_STREAM_PATH =
  "M 140 490 C 180 370, 200 280, 230 210";
const HIGHWAY_SEGMENTS = [
  // Leg 0: Stage 01 (140, 490) -> Stage 02 (230, 210)
  {
    p0: { x: 140, y: 490 },
    p1: { x: 140, y: 350 },
    p2: { x: 170, y: 230 },
    p3: { x: 230, y: 210 },
  },
  // Leg 1: Stage 02 (230, 210) -> Stage 03 (500, 140)
  {
    p0: { x: 230, y: 210 },
    p1: { x: 290, y: 190 },
    p2: { x: 420, y: 120 },
    p3: { x: 500, y: 140 },
  },
  // Leg 2: Stage 03 (500, 140) -> Stage 04 (560, 390)
  {
    p0: { x: 500, y: 140 },
    p1: { x: 580, y: 160 },
    p2: { x: 490, y: 320 },
    p3: { x: 560, y: 390 },
  },
  // Leg 3: Stage 04 (560, 390) -> Stage 05 (780, 520)
  {
    p0: { x: 560, y: 390 },
    p1: { x: 630, y: 460 },
    p2: { x: 710, y: 550 },
    p3: { x: 780, y: 520 },
  },
  // Leg 4: Stage 05 (780, 520) -> Stage 06 (820, 185)
  {
    p0: { x: 780, y: 520 },
    p1: { x: 840, y: 490 },
    p2: { x: 830, y: 270 },
    p3: { x: 820, y: 185 },
  },
];
const STAGE_IDS = [
  "creation",
  "owner-onboarding",
  "departments-teams",
  "operational-foundation",
  "growing-enterprise",
  "enterprise-expansion",
];
function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}
function evaluateCubicBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  u: number
) {
  const oneMinusU = 1 - u;
  const o2 = oneMinusU * oneMinusU;
  const o3 = o2 * oneMinusU;
  const u2 = u * u;
  const u3 = u2 * u;

  const x = o3 * p0.x + 3 * o2 * u * p1.x + 3 * oneMinusU * u2 * p2.x + u3 * p3.x;
  const y = o3 * p0.y + 3 * o2 * u * p1.y + 3 * oneMinusU * u2 * p2.y + u3 * p3.y;

  const dx =
    3 * o2 * (p1.x - p0.x) +
    6 * oneMinusU * u * (p2.x - p1.x) +
    3 * u2 * (p3.x - p2.x);
  const dy =
    3 * o2 * (p1.y - p0.y) +
    6 * oneMinusU * u * (p2.y - p1.y) +
    3 * u2 * (p3.y - p2.y);

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return { x, y, angle };
}
function getJourneyFrame(elapsedMs: number) {
  const CYCLE_MS = 24000;
  const t = ((elapsedMs % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;

  const LEG_DURATION = 3600;
  const DWELL_DURATION = 800;
  const TRAVEL_DURATION = LEG_DURATION - DWELL_DURATION; // 2800ms

  // Legs 0 to 4: 0 to 18000ms
  if (t < 18000) {
    const legIndex = Math.floor(t / LEG_DURATION);
    const legTime = t % LEG_DURATION;
    const seg = HIGHWAY_SEGMENTS[legIndex];
    const stageId = STAGE_IDS[legIndex];

    if (legTime < DWELL_DURATION) {
      // Dwell at the start milestone of this leg
      const initialTangent = evaluateCubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, 0);
      return {
        x: seg.p0.x,
        y: seg.p0.y,
        angle: initialTangent.angle,
        opacity: 1,
        activeStageId: stageId,
      };
    } else {
      // Traveling along Bezier curve
      const tau = (legTime - DWELL_DURATION) / TRAVEL_DURATION;
      const u = easeInOut(Math.min(Math.max(tau, 0), 1));
      const pos = evaluateCubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, u);
      return {
        x: pos.x,
        y: pos.y,
        angle: pos.angle,
        opacity: 1,
        activeStageId: stageId,
      };
    }
  }

  // Stage 06 Summit & smooth loop back to Stage 01: 18000 to 24000ms
  const summitSeg = HIGHWAY_SEGMENTS[4];
  const finalTangent = evaluateCubicBezier(summitSeg.p0, summitSeg.p1, summitSeg.p2, summitSeg.p3, 1);

  if (t < 21600) {
    // Dwell at Stage 06 summit
    return {
      x: summitSeg.p3.x,
      y: summitSeg.p3.y,
      angle: finalTangent.angle,
      opacity: 1,
      activeStageId: STAGE_IDS[5], // "enterprise-expansion"
    };
  } else if (t < 22400) {
    // Fade out at Stage 06
    const fadeOutTau = (t - 21600) / 800;
    return {
      x: summitSeg.p3.x,
      y: summitSeg.p3.y,
      angle: finalTangent.angle,
      opacity: Math.max(0, 1 - fadeOutTau),
      activeStageId: STAGE_IDS[5],
    };
  } else if (t < 23200) {
    // Fade in at Stage 01
    const fadeInTau = (t - 22400) / 800;
    const firstSeg = HIGHWAY_SEGMENTS[0];
    const firstTangent = evaluateCubicBezier(firstSeg.p0, firstSeg.p1, firstSeg.p2, firstSeg.p3, 0);
    return {
      x: firstSeg.p0.x,
      y: firstSeg.p0.y,
      angle: firstTangent.angle,
      opacity: Math.min(1, fadeInTau),
      activeStageId: STAGE_IDS[0], // "creation"
    };
  } else {
    // Dwell ready at Stage 01
    const firstSeg = HIGHWAY_SEGMENTS[0];
    const firstTangent = evaluateCubicBezier(firstSeg.p0, firstSeg.p1, firstSeg.p2, firstSeg.p3, 0);
    return {
      x: firstSeg.p0.x,
      y: firstSeg.p0.y,
      angle: firstTangent.angle,
      opacity: 1,
      activeStageId: STAGE_IDS[0],
    };
  }
}
let activeMilestoneId=$state<string>(untrack(()=>("creation")));
const setActiveMilestoneId=(next:typeof activeMilestoneId|((previous:typeof activeMilestoneId)=>typeof activeMilestoneId))=>{activeMilestoneId=typeof next==="function"?(next as (previous:typeof activeMilestoneId)=>typeof activeMilestoneId)(activeMilestoneId):next;};
let hoveredMilestoneId=$state<string | null>(untrack(()=>(null)));
const setHoveredMilestoneId=(next:typeof hoveredMilestoneId|((previous:typeof hoveredMilestoneId)=>typeof hoveredMilestoneId))=>{hoveredMilestoneId=typeof next==="function"?(next as (previous:typeof hoveredMilestoneId)=>typeof hoveredMilestoneId)(hoveredMilestoneId):next;};
let travelerRef=$state({current:null as SVGGElement|null});
let activeMilestoneIdRef=$state({current:"creation" as string});
$effect(()=>{return untrack(() => {
    // Respect user motion preferences
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setActiveMilestoneId("creation");
      if (travelerRef.current) {
        travelerRef.current.setAttribute("transform", "translate(140, 490) rotate(-65)");
        travelerRef.current.style.opacity = "1";
      }
      return;
    }

    let animationFrameId: number;
    let startTime: number | null = null;

    const tick = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
      }
      const elapsed = currentTime - startTime;
      const frame = getJourneyFrame(elapsed);

      if (travelerRef.current) {
        travelerRef.current.setAttribute(
          "transform",
          `translate(${frame.x.toFixed(2)}, ${frame.y.toFixed(2)}) rotate(${frame.angle.toFixed(1)})`
        );
        travelerRef.current.style.opacity = frame.opacity.toFixed(3);
      }

      if (frame.activeStageId !== activeMilestoneIdRef.current) {
        activeMilestoneIdRef.current = frame.activeStageId;
        setActiveMilestoneId(frame.activeStageId);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  });});
const activeMilestone = $derived(
    JOURNEY_MILESTONES.find((m) => m.id === (hoveredMilestoneId || activeMilestoneId)) ||
    JOURNEY_MILESTONES[0]);
</script>
<div class="relative w-full select-none">
      
      <div class="sr-only">
        <h2>The Journey of an Enterprise.</h2>
        <span>Interactive Enterprise World Map</span>
      </div>

      
      <div class="flex items-center justify-between gap-3 mb-2 px-1">
        <div class="flex items-center gap-2">
          <span class="flex size-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span class="text-xs font-bold text-[#0D3324] tracking-tight">
            Interactive Enterprise World Map
          </span>
          <span class="hidden sm:inline text-xs text-slate-500">
            · 6 Sequential Growth Stages
          </span>
        </div>
      </div>

      
      
      
      
      
      <div class="relative w-full aspect-[1000/680] max-w-full overflow-visible">
        
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute top-1/4 left-1/6 size-96 rounded-full bg-emerald-400/10 blur-[100px]"></div>
          <div class="absolute bottom-1/4 right-1/4 size-96 rounded-full bg-teal-400/10 blur-[100px]"></div>
        </div>

        
        
        
        <svg viewBox="0 0 1000 680" class="w-full h-full overflow-visible pointer-events-none" aria-hidden="true">
          <defs>
            
            <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="blur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>

            
            <filter id="ambientAura" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="12" result="blur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="blur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>

            
            <linearGradient id="highwayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#10B981" stop-opacity="0.85"></stop>
              <stop offset="50%" stop-color="#34D399" stop-opacity="0.95"></stop>
              <stop offset="100%" stop-color="#059669" stop-opacity="0.85"></stop>
            </linearGradient>

            
            <linearGradient id="islandBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F0FDF4" stop-opacity="0.9"></stop>
              <stop offset="60%" stop-color="#DCFCE7" stop-opacity="0.65"></stop>
              <stop offset="100%" stop-color="#BBF7D0" stop-opacity="0.4"></stop>
            </linearGradient>

            <linearGradient id="glassFacetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#10B981" stop-opacity="0.35"></stop>
              <stop offset="100%" stop-color="#047857" stop-opacity="0.08"></stop>
            </linearGradient>

            <linearGradient id="goldFacetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.45"></stop>
              <stop offset="100%" stop-color="#D97706" stop-opacity="0.1"></stop>
            </linearGradient>

            <linearGradient id="cyanFacetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.4"></stop>
              <stop offset="100%" stop-color="#0284C7" stop-opacity="0.08"></stop>
            </linearGradient>

            <linearGradient id="purpleFacetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#A855F7" stop-opacity="0.35"></stop>
              <stop offset="100%" stop-color="#7E22CE" stop-opacity="0.08"></stop>
            </linearGradient>
          </defs>

          
          
          
          <g opacity="0.8">
            
            <path d="M 50 510 C 65 440, 150 430, 230 460 C 270 475, 275 540, 240 575 C 190 615, 100 605, 55 565 Z" fill="url(#islandBaseGrad)" stroke="#A7F3D0" stroke-width="1.5"></path>
            <path d="M 75 515 C 90 460, 160 450, 215 475 C 245 490, 245 535, 215 560 C 175 590, 110 580, 80 550 Z" fill="none" stroke="#34D399" stroke-width="1" stroke-dasharray="4 6" opacity="0.6"></path>

            
            <path d="M 150 220 C 170 150, 260 140, 320 180 C 355 205, 345 260, 300 280 C 245 305, 160 280, 150 220 Z" fill="url(#islandBaseGrad)" stroke="#A7F3D0" stroke-width="1.5"></path>

            
            <path d="M 400 150 C 425 105, 540 100, 590 140 C 615 165, 600 215, 550 230 C 485 245, 410 210, 400 150 Z" fill="url(#islandBaseGrad)" stroke="#A7F3D0" stroke-width="1.5"></path>

            
            <path d="M 480 400 C 500 340, 620 335, 670 385 C 690 420, 670 475, 605 495 C 530 505, 480 455, 480 400 Z" fill="url(#islandBaseGrad)" stroke="#A7F3D0" stroke-width="1.5"></path>

            
            <path d="M 680 535 C 705 465, 820 460, 870 510 C 900 545, 875 605, 815 625 C 740 635, 685 585, 680 535 Z" fill="url(#islandBaseGrad)" stroke="#A7F3D0" stroke-width="1.5"></path>

            
            <path d="M 720 205 C 745 140, 855 130, 910 180 C 940 215, 925 270, 870 290 C 805 305, 730 270, 720 205 Z" fill="url(#islandBaseGrad)" stroke="#A7F3D0" stroke-width="1.5"></path>
          </g>

          
          
          
          <g>
            
            <path d={HIGHWAY_PATH} fill="none" stroke="#10B981" stroke-width="32" stroke-linecap="round" opacity="0.12" filter="url(#ambientAura)"></path>

            
            <path d={HIGHWAY_PATH} fill="none" stroke="url(#highwayGrad)" stroke-width="8" stroke-linecap="round" opacity="0.75"></path>

            
            <path id="enterpriseJourneyTrail" d={HIGHWAY_PATH} fill="none" stroke="#A7F3D0" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="6 12" class="hud-rail-dash" opacity="0.95"></path>

            
            <path d={INVITATION_STREAM_PATH} fill="none" stroke="#FBBF24" stroke-width="1.5" stroke-dasharray="4 8" opacity="0.4"></path>
          </g>

          
          
          
          <g>
            
            <circle r="7" fill="#6EE7B7" filter="url(#particleGlow)" class="hud-live-particle">
              <animateMotion dur="16s" repeatCount="indefinite" path={HIGHWAY_PATH} keyPoints="0;1" keyTimes="0;1"></animateMotion>
            </circle>

            
            <circle r="4.5" fill="#34D399" opacity="0.85">
              <animateMotion dur="16s" repeatCount="indefinite" path={HIGHWAY_PATH} keyPoints="0;1" keyTimes="0;1" begin="-0.35s"></animateMotion>
            </circle>
            <circle r="3" fill="#10B981" opacity="0.6">
              <animateMotion dur="16s" repeatCount="indefinite" path={HIGHWAY_PATH} keyPoints="0;1" keyTimes="0;1" begin="-0.7s"></animateMotion>
            </circle>
            <circle r="2" fill="#059669" opacity="0.4">
              <animateMotion dur="16s" repeatCount="indefinite" path={HIGHWAY_PATH} keyPoints="0;1" keyTimes="0;1" begin="-1.05s"></animateMotion>
            </circle>

            
            <circle r="6" fill="#38BDF8" filter="url(#particleGlow)" class="hud-live-particle">
              <animateMotion dur="16s" repeatCount="indefinite" path={HIGHWAY_PATH} keyPoints="0;1" keyTimes="0;1" begin="-8s"></animateMotion>
            </circle>
            <circle r="3.5" fill="#0EA5E9" opacity="0.8">
              <animateMotion dur="16s" repeatCount="indefinite" path={HIGHWAY_PATH} keyPoints="0;1" keyTimes="0;1" begin="-8.35s"></animateMotion>
            </circle>
            <circle r="2" fill="#0284C7" opacity="0.5">
              <animateMotion dur="16s" repeatCount="indefinite" path={HIGHWAY_PATH} keyPoints="0;1" keyTimes="0;1" begin="-8.7s"></animateMotion>
            </circle>

            
            <circle r="4" fill="#F59E0B" filter="url(#particleGlow)">
              <animateMotion dur="4.5s" repeatCount="indefinite" path={INVITATION_STREAM_PATH}></animateMotion>
            </circle>
            <circle r="2" fill="#FDE68A" opacity="0.7">
              <animateMotion dur="4.5s" repeatCount="indefinite" path={INVITATION_STREAM_PATH} begin="-0.25s"></animateMotion>
            </circle>
          </g>

          
          
          
          
          <g id="enterpriseTraveler" bind:this={travelerRef.current} class="hud-traveler transition-opacity duration-300" transform="translate(140, 490) rotate(-65)">
            
            <circle r="14" fill="#34D399" opacity="0.3" filter="url(#particleGlow)">
              <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite"></animate>
            </circle>

            
            <circle cx="-10" cy="0" r="3" fill="#10B981" opacity="0.8"></circle>
            <circle cx="-18" cy="0" r="2" fill="#6EE7B7" opacity="0.6"></circle>
            <circle cx="-25" cy="0" r="1.5" fill="#A7F3D0" opacity="0.4"></circle>

            
            
            <rect x="-8" y="-5" width="4" height="10" rx="1.5" fill="#0D3324"></rect>
            <circle cx="-6" cy="0" r="1.5" fill="#F59E0B"></circle>

            
            <ellipse cx="0" cy="0" rx="6" ry="5" fill="#0D3324" stroke="#34D399" stroke-width="1.2"></ellipse>

            
            <circle cx="3.5" cy="0" r="4.2" fill="#FFFFFF" stroke="#0D3324" stroke-width="1"></circle>
            <path d="M 3.5,-2.2 Q 6.5,0 3.5,2.2" fill="none" stroke="#10B981" stroke-width="1.8" stroke-linecap="round"></path>

            
            <g transform="translate(-2, -9)">
              <circle r="2.2" fill="#38BDF8" filter="url(#particleGlow)"></circle>
              <circle r="1" fill="#FFFFFF"></circle>
            </g>
          </g>

          
          
          
          
          <g>
            
            
            
            
            <g transform="translate(140, 490)" class={cn(
                "transition-all duration-500",
                activeMilestone.id === "creation" && "filter drop-shadow-[0_0_18px_rgba(16,185,129,0.95)] scale-[1.02]"
              )}>
              
              <polygon points="-46,16 0,32 46,16 46,-4 0,-20 -46,-4" fill="url(#islandBaseGrad)" stroke="#10B981" stroke-width="1.5"></polygon>
              <polygon points="-38,12 0,24 38,12 38,2 0,-10 -38,2" fill="#DCFCE7" stroke="#34D399" stroke-width="1" stroke-dasharray="3 3"></polygon>

              
              <polygon points="-26,-4 0,6 26,-4 26,-58 0,-68 -26,-58" fill="url(#glassFacetGrad)" stroke="#10B981" stroke-width="1.5"></polygon>
              
              <polygon points="-26,-4 -12,2 -12,-52 -26,-58" fill="#ECFDF5" stroke="#34D399" stroke-width="1"></polygon>
              <polygon points="12,2 26,-4 26,-58 12,-52" fill="#DCFCE7" stroke="#34D399" stroke-width="1"></polygon>

              
              <rect x="-8" y="-12" width="16" height="18" fill="#FFFFFF" stroke="#10B981" stroke-width="1" rx="1"></rect>
              <line x1="0" y1="-12" x2="0" y2="6" stroke="#10B981" stroke-width="1"></line>
              <rect x="-5" y="-9" width="10" height="12" fill="#D1FAE5" opacity="0.9"></rect>

              
              <g transform="translate(0, -78)">
                <polygon points="0,-12 10,-2 0,8 -10,-2" fill="#F0FDF4" stroke="#10B981" stroke-width="1.5"></polygon>
                <polygon points="0,-8 6,-2 0,4 -6,-2" fill="#10B981"></polygon>
                
                <line x1="0" y1="-12" x2="0" y2="-42" stroke="#34D399" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.8"></line>
                <circle cx="0" cy="-42" r="3" fill="#6EE7B7" filter="url(#particleGlow)"></circle>
              </g>

              
              <ellipse cx="0" cy="14" rx="48" ry="18" fill="none" stroke="#10B981" stroke-width="1" stroke-dasharray="4 6" opacity="0.6"></ellipse>
            </g>

            
            
            
            
            <g transform="translate(230, 210)" class={cn(
                "transition-all duration-500",
                activeMilestone.id === "owner-onboarding" && "filter drop-shadow-[0_0_18px_rgba(16,185,129,0.95)] scale-[1.02]"
              )}>
              
              <ellipse cx="0" cy="18" rx="46" ry="18" fill="#F0FDF4" stroke="#A7F3D0" stroke-width="1.5"></ellipse>

              
              <path d="M -34,10 L -34,-28 Q 0,-44 34,-28 L 34,10 Z" fill="url(#glassFacetGrad)" stroke="#10B981" stroke-width="1.5"></path>
              
              <path d="M -28,8 Q 0,-6 28,8" fill="none" stroke="#34D399" stroke-width="3" stroke-linecap="round"></path>
              
              <path d="M -12,18 L -12,2 Q 0,-8 12,2 L 12,18 Z" fill="#DCFCE7" stroke="#059669" stroke-width="1.2"></path>
              
              <rect x="-6" y="6" width="12" height="6" rx="1" fill="#FEF3C7" stroke="#F59E0B" stroke-width="0.8"></rect>

              
              <g transform="translate(0, -42)">
                <rect x="-18" y="-7" width="36" height="12" rx="2" fill="#FFFFFF" stroke="#10B981" stroke-width="1"></rect>
                <path d="M -12,-1 L -9,2 L -5,-3" fill="none" stroke="#10B981" stroke-width="1.2" stroke-linecap="round"></path>
                <rect x="-2" y="-3" width="14" height="4" rx="1" fill="#D1FAE5"></rect>
              </g>

              
              <path d="M -54,36 Q -30,30 -8,18" fill="none" stroke="#34D399" stroke-width="3.5" stroke-linecap="round"></path>

              
              
              <g transform="translate(-6, 12)">
                <circle cx="0" cy="-6" r="2.5" fill="#0D3324"></circle>
                <path d="M -3,2 L 3,2 L 2,-3 L -2,-3 Z" fill="#10B981"></path>
              </g>

              
              <g transform="translate(-24, 22)">
                <circle cx="0" cy="-6" r="2.5" fill="#0D3324"></circle>
                <path d="M -3,2 L 3,2 L 2,-3 L -2,-3 Z" fill="#059669"></path>
              </g>

              
              <g transform="translate(-42, 30)">
                <circle cx="0" cy="-6" r="2.5" fill="#0D3324"></circle>
                <path d="M -3,2 L 3,2 L 2,-3 L -2,-3 Z" fill="#047857"></path>
                <circle cx="3" cy="-1" r="1.5" fill="#F59E0B"></circle>
              </g>

              
              <g transform="translate(-20, -10)">
                <rect x="-7" y="-5" width="14" height="9" rx="1.5" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1"></rect>
                <path d="M -7,-5 L 0,1 L 7,-5" fill="none" stroke="#D97706" stroke-width="1"></path>
              </g>
              <g transform="translate(-38, 6)">
                <rect x="-6" y="-4" width="12" height="8" rx="1" fill="#DCFCE7" stroke="#10B981" stroke-width="1"></rect>
                <path d="M -6,-4 L 0,1 L 6,-4" fill="none" stroke="#059669" stroke-width="0.8"></path>
              </g>

              
              <g transform="translate(32, -8)">
                <rect x="-7" y="-16" width="14" height="32" rx="2" fill="#FFFFFF" stroke="#10B981" stroke-width="1"></rect>
                
                <path d="M -4,-10 L -2,-8 L 3,-13" fill="none" stroke="#10B981" stroke-width="1.2" stroke-linecap="round"></path>
                
                <path d="M -4,-1 L -2,1 L 3,-4" fill="none" stroke="#10B981" stroke-width="1.2" stroke-linecap="round"></path>
                
                <path d="M -4,8 L -2,10 L 3,5" fill="none" stroke="#10B981" stroke-width="1.2" stroke-linecap="round"></path>
              </g>
            </g>

            
            
            
            
            <g transform="translate(500, 140)" class={cn(
                "transition-all duration-500",
                activeMilestone.id === "departments-teams" && "filter drop-shadow-[0_0_18px_rgba(56,189,248,0.95)] scale-[1.02]"
              )}>
              
              <polygon points="-52,14 0,28 52,14 52,-14 0,-28 -52,-14" fill="#F0FDF4" stroke="#A7F3D0" stroke-width="1.5"></polygon>

              
              <line x1="-36" y1="-8" x2="0" y2="0" stroke="#38BDF8" stroke-width="3" opacity="0.8"></line>
              <line x1="36" y1="-8" x2="0" y2="0" stroke="#F59E0B" stroke-width="3" opacity="0.8"></line>
              <line x1="0" y1="-32" x2="0" y2="0" stroke="#10B981" stroke-width="3" opacity="0.8"></line>
              <line x1="0" y1="18" x2="0" y2="0" stroke="#34D399" stroke-width="3" opacity="0.8"></line>

              
              <g transform="translate(-36, -8)">
                <rect x="-12" y="-14" width="24" height="22" rx="2" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.2"></rect>
                <rect x="-8" y="-10" width="16" height="8" rx="1" fill="#0369A1"></rect>
                
                <path d="M -5,-6 L -7,-4 L -5,-2 M 5,-6 L 7,-4 L 5,-2" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"></path>
                
                <circle cx="0" cy="4" r="2" fill="#0369A1"></circle>
              </g>

              
              <g transform="translate(0, -32)">
                <ellipse cx="0" cy="0" rx="15" ry="12" fill="#DCFCE7" stroke="#10B981" stroke-width="1.2"></ellipse>
                
                <circle cx="-5" cy="-2" r="2" fill="#047857"></circle>
                <circle cx="5" cy="-2" r="2" fill="#047857"></circle>
                <circle cx="0" cy="3" r="2" fill="#059669"></circle>
              </g>

              
              <g transform="translate(36, -8)">
                <rect x="-12" y="-14" width="24" height="22" rx="2" fill="#FEF3C7" stroke="#D97706" stroke-width="1.2"></rect>
                
                <rect x="-7" y="-4" width="3" height="8" fill="#F59E0B" rx="0.5"></rect>
                <rect x="-2" y="-8" width="3" height="12" fill="#D97706" rx="0.5"></rect>
                <rect x="3" y="-11" width="3" height="15" fill="#B45309" rx="0.5"></rect>
                <circle cx="0" cy="5" r="2" fill="#92400E"></circle>
              </g>

              
              <g transform="translate(0, 18)">
                <polygon points="-12,0 0,-10 12,0 0,10" fill="#D1FAE5" stroke="#059669" stroke-width="1.2"></polygon>
                <circle cx="0" cy="0" r="3" fill="#047857"></circle>
              </g>

              
              <circle cx="0" cy="0" r="6" fill="#FFFFFF" stroke="#0D3324" stroke-width="1.5"></circle>
              <circle cx="0" cy="0" r="2.5" fill="#10B981"></circle>
            </g>

            
            
            
            
            <g transform="translate(560, 390)" class={cn(
                "transition-all duration-500",
                activeMilestone.id === "operational-foundation" && "filter drop-shadow-[0_0_18px_rgba(16,185,129,0.95)] scale-[1.02]"
              )}>
              
              <ellipse cx="0" cy="16" rx="54" ry="22" fill="#F0FDF4" stroke="#A7F3D0" stroke-width="1.5"></ellipse>

              
              <ellipse cx="0" cy="14" rx="42" ry="16" fill="none" stroke="#10B981" stroke-width="1.5" stroke-dasharray="4 6"></ellipse>

              
              <g transform="translate(-28, -18)">
                <rect x="-14" y="-14" width="28" height="28" rx="4" fill="#FFFFFF" stroke="#10B981" stroke-width="1.2"></rect>
                
                <circle cx="0" cy="0" r="9" fill="#ECFDF5" stroke="#059669" stroke-width="1"></circle>
                
                <line x1="0" y1="0" x2="0" y2="-5" stroke="#047857" stroke-width="1.5" stroke-linecap="round"></line>
                <line x1="0" y1="0" x2="-4" y2="0" stroke="#047857" stroke-width="1.5" stroke-linecap="round"></line>
                
                <circle cx="9" cy="-9" r="3" fill="#10B981" filter="url(#particleGlow)"></circle>
              </g>

              
              <g transform="translate(28, -18)">
                <rect x="-14" y="-14" width="28" height="28" rx="4" fill="#FFFFFF" stroke="#059669" stroke-width="1.2"></rect>
                
                <rect x="-10" y="-10" width="20" height="4" rx="1" fill="#34D399"></rect>
                <rect x="-10" y="-4" width="9" height="5" rx="1" fill="#10B981"></rect>
                <rect x="1" y="-4" width="9" height="5" rx="1" fill="#047857"></rect>
                <rect x="-10" y="3" width="9" height="5" rx="1" fill="#059669"></rect>
                <rect x="1" y="3" width="9" height="5" rx="1" fill="#6EE7B7"></rect>
              </g>

              
              <g transform="translate(0, -36)">
                <path d="M -16,10 L -16,0 Q 0,-14 16,0 L 16,10" fill="none" stroke="#10B981" stroke-width="2"></path>
                
                <g transform="translate(-8, -4)">
                  <circle cx="0" cy="0" r="5" fill="#D1FAE5" stroke="#10B981" stroke-width="1"></circle>
                  <path d="M -2.5,0 L -1,1.5 L 2.5,-2" fill="none" stroke="#047857" stroke-width="1" stroke-linecap="round"></path>
                </g>
                <g transform="translate(8, -4)">
                  <circle cx="0" cy="0" r="5" fill="#D1FAE5" stroke="#10B981" stroke-width="1"></circle>
                  <path d="M -2.5,0 L -1,1.5 L 2.5,-2" fill="none" stroke="#047857" stroke-width="1" stroke-linecap="round"></path>
                </g>
              </g>

              
              <g transform="translate(0, 14)">
                
                <polygon points="-16,-6 -6,-6 -9,4 -13,4" fill="#E0F2FE" stroke="#0284C7" stroke-width="1"></polygon>
                
                <ellipse cx="12" cy="0" rx="9" ry="4" fill="#FEF3C7" stroke="#D97706" stroke-width="1"></ellipse>
                <ellipse cx="12" cy="-4" rx="9" ry="4" fill="#FDE68A" stroke="#D97706" stroke-width="1"></ellipse>
                <ellipse cx="12" cy="-8" rx="9" ry="4" fill="#FEF3C7" stroke="#D97706" stroke-width="1"></ellipse>
                <path d="M 12,-10 L 12,-6" stroke="#B45309" stroke-width="1"></path>
              </g>
            </g>

            
            
            
            
            <g transform="translate(780, 520)" class={cn(
                "transition-all duration-500",
                activeMilestone.id === "growing-enterprise" && "filter drop-shadow-[0_0_18px_rgba(16,185,129,0.95)] scale-[1.02]"
              )}>
              
              <polygon points="-58,18 0,36 58,18 58,-12 0,-30 -58,-12" fill="url(#islandBaseGrad)" stroke="#10B981" stroke-width="1.5"></polygon>

              
              
              <polygon points="-24,-8 0,2 24,-8 24,-48 0,-56 -24,-48" fill="url(#glassFacetGrad)" stroke="#10B981" stroke-width="1.5"></polygon>
              
              <polygon points="-16,-46 0,-40 16,-46 16,-76 0,-82 -16,-76" fill="#ECFDF5" stroke="#34D399" stroke-width="1.2"></polygon>
              
              <polygon points="-8,-74 0,-70 8,-74 8,-94 0,-98 -8,-94" fill="#DCFCE7" stroke="#059669" stroke-width="1"></polygon>
              <line x1="0" y1="-98" x2="0" y2="-116" stroke="#10B981" stroke-width="1.5"></line>
              <circle cx="0" cy="-116" r="3" fill="#34D399" filter="url(#particleGlow)"></circle>

              
              <circle cx="0" cy="-116" r="12" fill="none" stroke="#10B981" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.6"></circle>

              
              
              <g transform="translate(-36, -6)">
                <polygon points="-14,4 0,9 14,4 14,-32 0,-37 -14,-32" fill="#E6FFFA" stroke="#0D9488" stroke-width="1"></polygon>
                
                <line x1="14" y1="-20" x2="22" y2="-24" stroke="#14B8A6" stroke-width="3"></line>
              </g>

              
              <g transform="translate(36, -6)">
                <polygon points="-14,4 0,9 14,4 14,-32 0,-37 -14,-32" fill="#F0FDF4" stroke="#059669" stroke-width="1"></polygon>
                
                <line x1="-14" y1="-20" x2="-22" y2="-24" stroke="#10B981" stroke-width="3"></line>
              </g>

              
              
              <circle cx="-42" cy="12" r="5" fill="#047857"></circle>
              <circle cx="-42" cy="10" r="3.5" fill="#10B981"></circle>
              <circle cx="44" cy="12" r="5" fill="#047857"></circle>
              <circle cx="44" cy="10" r="3.5" fill="#10B981"></circle>

              
              <circle cx="-16" cy="12" r="2" fill="#0D3324"></circle>
              <circle cx="-10" cy="14" r="2" fill="#047857"></circle>
              <circle cx="12" cy="14" r="2" fill="#059669"></circle>
              <circle cx="18" cy="12" r="2" fill="#0D3324"></circle>
            </g>

            
            
            
            
            <g transform="translate(820, 185)" class={cn(
                "transition-all duration-500",
                activeMilestone.id === "enterprise-expansion" && "filter drop-shadow-[0_0_18px_rgba(168,85,247,0.95)] scale-[1.02]"
              )}>
              
              <polygon points="-54,16 0,32 54,16 54,-14 0,-30 -54,-14" fill="#FAF5FF" stroke="#C084FC" stroke-width="1.5"></polygon>

              
              <line x1="0" y1="0" x2="-36" y2="-10" stroke="#A855F7" stroke-width="2.5" opacity="0.8"></line>
              <line x1="0" y1="0" x2="36" y2="-8" stroke="#38BDF8" stroke-width="2.5" opacity="0.8"></line>
              <line x1="0" y1="0" x2="0" y2="20" stroke="#10B981" stroke-width="2.5" opacity="0.8"></line>

              
              <polygon points="-16,-2 0,6 16,-2 16,-62 0,-70 -16,-62" fill="url(#purpleFacetGrad)" stroke="#9333EA" stroke-width="1.5"></polygon>
              
              <line x1="0" y1="-70" x2="0" y2="-88" stroke="#A855F7" stroke-width="1.5"></line>
              <circle cx="0" cy="-88" r="4" fill="#C084FC" filter="url(#particleGlow)"></circle>

              
              <g transform="translate(0, -96)">
                <ellipse cx="0" cy="0" rx="8" ry="4" fill="none" stroke="#7E22CE" stroke-width="1" stroke-dasharray="2 2"></ellipse>
                <circle cx="6" cy="-2" r="1.5" fill="#38BDF8"></circle>
              </g>

              
              <g transform="translate(-36, -10)">
                <polygon points="-12,3 0,8 12,3 12,-32 0,-36 -12,-32" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.2"></polygon>
                <rect x="-6" y="-24" width="12" height="18" fill="#BAE6FD" opacity="0.8"></rect>
                <circle cx="0" cy="-40" r="2.5" fill="#0284C7"></circle>
              </g>

              
              <g transform="translate(36, -8)">
                <polygon points="-12,3 0,8 12,3 12,-36 0,-40 -12,-36" fill="#DCFCE7" stroke="#059669" stroke-width="1.2"></polygon>
                <rect x="-6" y="-26" width="12" height="20" fill="#BBF7D0" opacity="0.8"></rect>
                <circle cx="0" cy="-44" r="2.5" fill="#059669"></circle>
              </g>

              
              <g transform="translate(0, 20)">
                <polygon points="-14,3 0,8 14,3 14,-16 0,-20 -14,-16" fill="#FEF3C7" stroke="#D97706" stroke-width="1.2"></polygon>
                <circle cx="0" cy="-24" r="2.5" fill="#D97706"></circle>
              </g>
            </g>
          </g>
        </svg>

        
        
        
        
        
        
        
        
        
        
        
        {#each JOURNEY_MILESTONES as milestone}{@const {isActive,isHovered,labelAnchorClass} = (()=>{const isActive = milestone.id === activeMilestoneId;
const isHovered = milestone.id === hoveredMilestoneId;
let labelAnchorClass = "";
if (milestone.level === 1) {
            // Anchor Right of pin (x: 18% - 36%, y: 68% - 76%)
            labelAnchorClass = "left-8 sm:left-11 top-1/2 -translate-y-1/2 text-left";
          } else if (milestone.level === 2) {
            // Anchor Below of pin: on mobile starts at pin (left-0) so it never clips left edge; on sm+ centered
            labelAnchorClass = "top-9 sm:top-11 left-0 sm:left-1/2 sm:-translate-x-1/2 text-left sm:text-center";
          } else if (milestone.level === 3) {
            // Anchor Above Centered of pin (x: 39% - 61%, y: 8% - 15%) -> sitting high above stage 02 and stage 06!
            labelAnchorClass = "bottom-9 sm:bottom-11 left-1/2 -translate-x-1/2 text-center";
          } else if (milestone.level === 4) {
            // Anchor Right of pin (x: 60% - 78%, y: 53% - 61%)
            labelAnchorClass = "left-8 sm:left-11 top-1/2 -translate-y-1/2 text-left";
          } else if (milestone.level === 5) {
            // Anchor Left of pin (x: 60% - 74%, y: 72% - 80%)
            labelAnchorClass = "right-8 sm:right-11 top-1/2 -translate-y-1/2 text-right";
          } else if (milestone.level === 6) {
            // Safe on mobile (right-0 text-right), centered on tablet/desktop (sm:left-1/2 sm:-translate-x-1/2 text-center)
            labelAnchorClass = "top-9 sm:top-11 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 text-right sm:text-center";
          };return {isActive,isHovered,labelAnchorClass};})()}<div style:left={`${milestone.coordinates.pin.x}%`} style:top={`${milestone.coordinates.pin.y}%`} class={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-all duration-300",
                (isActive || isHovered) && "scale-105 z-30"
              )}>
              
              <button type="button" onmouseenter={() => setHoveredMilestoneId(milestone.id)} onmouseleave={() => setHoveredMilestoneId(null)} tabindex={0} onfocus={() => setHoveredMilestoneId(milestone.id)} onblur={() => setHoveredMilestoneId(null)} class={cn(
                  "relative flex items-center justify-center size-8 sm:size-10 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all duration-300 select-none",
                  isActive
                    ? "bg-gradient-to-b from-[#FDE047] to-[#D97706] text-black ring-4 ring-emerald-400/90 scale-115 shadow-[0_0_24px_rgba(253,224,71,0.85)]"
                    : isHovered
                    ? "bg-[#0D3324] text-white ring-4 ring-emerald-300/80 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.7)]"
                    : "bg-[#0A2617]/90 text-emerald-200 border-2 border-[#FDE047]/90 hover:bg-[#0E3420] hover:scale-105"
                )} aria-label={`${milestone.code}: ${milestone.title} (${milestone.landmark})`}>
                {#if isActive}
                    <span class="absolute -inset-2 rounded-full border-2 border-emerald-400 bg-emerald-400/30 animate-ping pointer-events-none"></span>
                    <span class="absolute -inset-1 rounded-full bg-emerald-400/40 animate-pulse pointer-events-none"></span>
                  {/if}
                <span>{milestone.level}</span>
              </button>

              
              <div class={cn(
                  "absolute pointer-events-none transition-all duration-200 z-10",
                  labelAnchorClass
                )}>
                <div class={cn(
                    "rounded-md px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-xs transition-all duration-300 shadow-xs border backdrop-blur-md max-w-[125px] sm:max-w-[185px] md:max-w-[210px]",
                    isActive
                      ? "bg-white text-[#0D3324] border-emerald-500 ring-2 ring-emerald-400/50 shadow-md font-bold scale-[1.02]"
                      : isHovered
                      ? "bg-white/95 text-[#0D3324] border-emerald-300 font-semibold"
                      : "bg-white/90 text-[#174734] border-emerald-100 font-medium"
                  )}>
                  <div class="flex items-center gap-1 sm:gap-1.5 leading-tight">
                    <span class="text-[8px] sm:text-[10px] font-mono font-bold text-emerald-700 shrink-0">
                      {milestone.code}
                    </span>
                    <span class="font-bold text-[#0D3324] text-[9px] sm:text-[11px] md:text-xs leading-tight block">
                      <span class="sm:hidden">{milestone.shortTitle}</span>
                      <span class="hidden sm:inline">{milestone.title}</span>
                    </span>
                  </div>
                  <div class="hidden sm:block text-[9px] sm:text-[10px] text-slate-500 font-medium leading-none mt-0.5 whitespace-nowrap">
                    {milestone.landmark}
                  </div>
                </div>
              </div>
            </div>{/each}
      </div>
    </div>
