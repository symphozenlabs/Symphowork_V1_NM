"use client";

import React, { useState } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowPipelineHudProps {
  className?: string;
  showTelemetry?: boolean;
}

interface WorkflowStage {
  id: string;
  phase: string;
  phaseNum: number;
  title: string;
  subtitle: string;
  badge: string;
  subsystemPath: string;
  description: string;
  upstream: string;
  downstream: string;
  x: number;
  y: number;
  shape: "rect" | "pill" | "diamond";
}

export function WorkflowPipelineHud({
  className,
  showTelemetry = true,
}: WorkflowPipelineHudProps) {
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  // 9 Real Implemented SymphoWork Workflow Nodes with Branching Pipeline Geometry
  const stages: WorkflowStage[] = [
    // Phase 1: Ingestion & Sourcing (Left)
    {
      id: "genesis",
      phase: "Ingestion",
      phaseNum: 1,
      title: "TENANT GENESIS",
      subtitle: "Org Provisioning · EMP Prefix",
      badge: "Tenant Root",
      subsystemPath: "modules/platform/provisioning.ts",
      description: "Organization tenant initialization, automated sequential EMP ID counter, and deterministic RBAC role provisioning.",
      upstream: "Platform Console / Registration",
      downstream: "Tokenized Invitation & Role Activation",
      x: 88,
      y: 68,
      shape: "rect",
    },
    {
      id: "ats",
      phase: "Ingestion",
      phaseNum: 1,
      title: "CANDIDATE ATS",
      subtitle: "Requisitions · Intake Pipeline",
      badge: "Talent Intake",
      subsystemPath: "modules/ats & resume-intelligence",
      description: "Job requisitions, public candidate application intake, AI resume parsing, and multi-stage interview panel pipeline.",
      upstream: "Public Job Portal (/jobs)",
      downstream: "Employee Ingestion & Tokenized Invitation",
      x: 88,
      y: 206,
      shape: "rect",
    },

    // Phase 2: Enrollment & Activation (Mid-Left)
    {
      id: "invitation",
      phase: "Enrollment",
      phaseNum: 2,
      title: "TOKEN INVITATION",
      subtitle: "SHA-256 Token · Email Delivery",
      badge: "Cryptographic Dispatch",
      subsystemPath: "app/api/app/employees/[id]/invite",
      description: "Generation of 32-byte opaque invitation token with SHA-256 hash storage, 7-day expiration, and email notification.",
      upstream: "Tenant Genesis & Candidate Ingestion",
      downstream: "Credential Handshake & Role Activation",
      x: 215,
      y: 137,
      shape: "pill",
    },
    {
      id: "activation",
      phase: "Enrollment",
      phaseNum: 2,
      title: "ROLE ACTIVATION",
      subtitle: "Checklists · Department Assignment",
      badge: "Active Operator",
      subsystemPath: "modules/employees/service.ts",
      description: "Password establishment, 3-step onboarding verification checklist, department/team pod assignment, and active status transition.",
      upstream: "Invitation Acceptance (/invitations/accept)",
      downstream: "Shift Rostering & Leave Accruals",
      x: 310,
      y: 137,
      shape: "pill",
    },

    // Phase 3: Daily Operations (Mid-Right Lanes)
    {
      id: "attendance",
      phase: "Operations",
      phaseNum: 3,
      title: "ATTENDANCE ENGINE",
      subtitle: "Timezone Punches · Regularization",
      badge: "Time Telemetry",
      subsystemPath: "modules/attendance",
      description: "Shift schedule matching, timestamped clock-in/break/clock-out events, late/early minutes calculation, and attendance regularization.",
      upstream: "Role Activation & Shift Rosters",
      downstream: "Multi-Step Approvals & Payroll Run",
      x: 422,
      y: 68,
      shape: "rect",
    },
    {
      id: "leave",
      phase: "Operations",
      phaseNum: 3,
      title: "LEAVE LEDGER",
      subtitle: "Balance Accruals · Absence Ledgers",
      badge: "Absence Engine",
      subsystemPath: "modules/leave",
      description: "Annual entitlement allocations, accrual transaction ledgers, probation checks, and multi-day absence booking.",
      upstream: "Role Activation & Leave Policies",
      downstream: "Multi-Step Approvals & Attendance Deductions",
      x: 422,
      y: 206,
      shape: "rect",
    },

    // Phase 4: Gated Workflow Governance (Center Nexus)
    {
      id: "approvals",
      phase: "Governance",
      phaseNum: 4,
      title: "APPROVAL ENGINE",
      subtitle: "Manager · Dept Head · HR Gate",
      badge: "Gated Multi-Step",
      subsystemPath: "modules/workflows (/app/approvals)",
      description: "Dynamic workflow routing engine evaluating sequential and parallel approval steps for leave, regularization, and expense claims.",
      upstream: "Attendance Regularization & Leave Applications",
      downstream: "Payroll Processing & Audit History",
      x: 524,
      y: 137,
      shape: "diamond",
    },

    // Phase 5: Settlement & Strategic Intelligence (Right Convergence)
    {
      id: "payroll",
      phase: "Settlement",
      phaseNum: 5,
      title: "PAYROLL RUN",
      subtitle: "Gross/Net · Statutory · Immutable Lock",
      badge: "Compensation Engine",
      subsystemPath: "modules/payroll",
      description: "Attendance-linked gross-to-net computation, salary structures, tax regime deduction, reviewer sign-off, and finalized payslip generation.",
      upstream: "Approved Attendance Records & Expense Claims",
      downstream: "Employee Payslip Portal & General Ledger",
      x: 626,
      y: 68,
      shape: "rect",
    },
    {
      id: "analytics",
      phase: "Settlement",
      phaseNum: 5,
      title: "ANALYTICS & RLS",
      subtitle: "Real-Time BI · Zero-Leakage Mesh",
      badge: "Enterprise Intelligence",
      subsystemPath: "modules/reporting & tenancy",
      description: "Workforce headcount, attendance percentage, leave utilization, expense totals, and tenant-isolated audit log streaming.",
      upstream: "All Workflow Lifecycle Events",
      downstream: "Executive Dashboards & Compliance Exports",
      x: 626,
      y: 206,
      shape: "rect",
    },
  ];

  const activeStage = stages.find((s) => s.id === activeStageId);

  // SVG Flow Path Definitions (Calibrated Splines)
  const paths = {
    genesisToInvite: "M 88 68 C 145 68, 165 137, 215 137",
    atsToInvite: "M 88 206 C 145 206, 165 137, 215 137",
    inviteToActivation: "M 215 137 L 310 137",
    activationToAttendance: "M 310 137 C 360 137, 375 68, 422 68",
    activationToLeave: "M 310 137 C 360 137, 375 206, 422 206",
    attendanceToApprovals: "M 422 68 C 475 68, 485 137, 524 137",
    leaveToApprovals: "M 422 206 C 475 206, 485 137, 524 137",
    approvalsToPayroll: "M 524 137 C 570 137, 580 68, 626 68",
    approvalsToAnalytics: "M 524 137 C 570 137, 580 206, 626 206",

    // Continuous Primary Lifecycle Motion Rail (Candidate -> Invite -> Active -> Attendance -> Approvals -> Payroll)
    primaryLifecycleRail:
      "M 88 206 C 145 206, 165 137, 215 137 L 310 137 C 360 137, 375 68, 422 68 C 475 68, 485 137, 524 137 C 570 137, 580 68, 626 68",

    // Secondary Operational Flow Rail (Active -> Leave -> Approvals -> Analytics)
    secondaryOperationalRail:
      "M 310 137 C 360 137, 375 206, 422 206 C 475 206, 485 137, 524 137 C 570 137, 580 206, 626 206",

    // Tenant Genesis Foundation Rail (Org Genesis -> Invite -> Active)
    tenantGenesisRail: "M 88 68 C 145 68, 165 137, 215 137 L 310 137",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-emerald-500/25 bg-[#030E08]/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_20px_54px_rgba(0,0,0,0.55)] overflow-hidden text-white font-sans select-none",
        className
      )}
      role="region"
      aria-label="SymphoWork Enterprise Workflow Command Stream"
    >
      {/* ── Background: Multi-Zone Ambient Flare & Matrix Coordinate Grid ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Ingestion Zone Glow */}
        <div className="absolute top-1/4 left-8 size-48 rounded-full bg-emerald-500/10 blur-[60px]" />
        {/* Approval Nexus Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-56 rounded-full bg-teal-500/12 blur-[65px]" />
        {/* Settlement Zone Glow */}
        <div className="absolute top-1/4 right-8 size-48 rounded-full bg-emerald-500/10 blur-[60px]" />
        {/* Coordinate Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:22px_22px] opacity-10" />
      </div>

      {/* ── Top Bar: Workflow Engine Telemetry Header ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-300 font-mono">
                SymphoWork Workflow Command Engine
              </span>
              <span className="rounded bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
                END-TO-END PIPELINE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Coordinated people operations, gated approvals, and financial settlement stream
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-2.5 py-1 text-[10px] font-mono text-emerald-300">
          <Activity className="size-3 text-emerald-400 animate-pulse" />
          <span className="font-semibold">STREAM: CONTINUOUS</span>
        </div>
      </div>

      {/* ── Main SVG Workflow River Canvas (Responsive 700x310) ── */}
      <div className="relative z-10 py-1">
        <svg
          viewBox="0 0 700 290"
          className="w-full h-auto overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Luminous Glow Filter */}
            <filter id="wf-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Directional Flow Arrow Marker */}
            <marker
              id="wf-arrow"
              viewBox="0 0 6 6"
              refX="4"
              refY="3"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 5 3 L 0 5 z" fill="#34D399" opacity="0.6" />
            </marker>
          </defs>

          {/* ── 5 Phase Operational Boundaries (Subtle Backdrop Pods) ── */}
          {/* Phase 1: Ingestion */}
          <rect
            x="24"
            y="26"
            width="128"
            height="228"
            rx="10"
            fill="rgba(6,78,59,0.12)"
            stroke="rgba(52,211,153,0.18)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x="34" y="42" fill="#6EE7B7" fontSize="7" fontFamily="monospace" fontWeight="700" opacity="0.8">
            1. INGESTION
          </text>

          {/* Phase 2: Enrollment */}
          <rect
            x="172"
            y="26"
            width="178"
            height="228"
            rx="10"
            fill="rgba(6,78,59,0.14)"
            stroke="rgba(52,211,153,0.22)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x="182" y="42" fill="#6EE7B7" fontSize="7" fontFamily="monospace" fontWeight="700" opacity="0.8">
            2. IDENTITY &amp; ENROLLMENT
          </text>

          {/* Phase 3: Daily Operations */}
          <rect
            x="368"
            y="26"
            width="108"
            height="228"
            rx="10"
            fill="rgba(19,78,74,0.14)"
            stroke="rgba(45,212,191,0.22)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x="378" y="42" fill="#99F6E4" fontSize="7" fontFamily="monospace" fontWeight="700" opacity="0.8">
            3. OPERATIONS
          </text>

          {/* Phase 4: Gated Governance */}
          <rect
            x="492"
            y="26"
            width="64"
            height="228"
            rx="10"
            fill="rgba(6,78,59,0.18)"
            stroke="rgba(52,211,153,0.3)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x="500" y="42" fill="#A7F3D0" fontSize="7" fontFamily="monospace" fontWeight="700" opacity="0.85">
            4. GATE
          </text>

          {/* Phase 5: Settlement & BI */}
          <rect
            x="572"
            y="26"
            width="108"
            height="228"
            rx="10"
            fill="rgba(6,78,59,0.12)"
            stroke="rgba(52,211,153,0.18)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x="582" y="42" fill="#6EE7B7" fontSize="7" fontFamily="monospace" fontWeight="700" opacity="0.8">
            5. SETTLEMENT
          </text>

          {/* ── Directional Conduit Railway Tracks (Connecting All Stages) ── */}
          {Object.entries(paths).slice(0, 9).map(([key, d]) => (
            <g key={key}>
              {/* Static Background Rail Guide */}
              <path
                d={d}
                fill="none"
                stroke="rgba(52,211,153,0.2)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {/* Continuous Micro-Stream Flow Rail */}
              <path
                d={d}
                fill="none"
                stroke="rgba(52,211,153,0.4)"
                strokeWidth="1"
                className="hud-rail-dash"
                strokeDasharray="4 8"
              />
            </g>
          ))}

          {/* ── Meaningful Animated Entities & Traveling Tokens ── */}
          {/* ENTITY 1: The Employee Lifecycle Traveler (Candidate -> Invite -> Active -> Attendance -> Approvals -> Payroll) */}
          <g>
            <circle r="4" fill="#34D399" filter="url(#wf-glow)" className="hud-live-particle">
              <animateMotion
                dur="7.2s"
                repeatCount="indefinite"
                path={paths.primaryLifecycleRail}
              />
            </circle>
            {/* Luminous Outer Traveler Halo */}
            <circle r="8" fill="none" stroke="#6EE7B7" strokeWidth="1" opacity="0.75" className="hud-live-particle">
              <animateMotion
                dur="7.2s"
                repeatCount="indefinite"
                path={paths.primaryLifecycleRail}
              />
            </circle>
            {/* Trailing Particle */}
            <circle r="2.5" fill="#A7F3D0" className="hud-live-particle opacity-80">
              <animateMotion
                dur="7.2s"
                begin="0.25s"
                repeatCount="indefinite"
                path={paths.primaryLifecycleRail}
              />
            </circle>
          </g>

          {/* ENTITY 2: The Operational Absence/Expense Traveler (Active -> Leave Ledger -> Approvals -> Analytics) */}
          <g>
            <circle r="3.5" fill="#2DD4BF" filter="url(#wf-glow)" className="hud-live-particle">
              <animateMotion
                dur="5.8s"
                begin="2.2s"
                repeatCount="indefinite"
                path={paths.secondaryOperationalRail}
              />
            </circle>
            <circle r="7" fill="none" stroke="#5EEAD4" strokeWidth="1" opacity="0.65" className="hud-live-particle">
              <animateMotion
                dur="5.8s"
                begin="2.2s"
                repeatCount="indefinite"
                path={paths.secondaryOperationalRail}
              />
            </circle>
          </g>

          {/* ENTITY 3: The Tenant Genesis Provisioning Signal (Org Setup -> Invite -> Active) */}
          <g>
            <circle r="3" fill="#10B981" filter="url(#wf-glow)" className="hud-live-particle">
              <animateMotion
                dur="4.4s"
                begin="1.1s"
                repeatCount="indefinite"
                path={paths.tenantGenesisRail}
              />
            </circle>
          </g>

          {/* ── Cross-Cutting Postgres RLS Security & Telemetry Bus (Bottom Rail) ── */}
          <g transform="translate(0, 268)">
            <line x1="30" y1="0" x2="670" y2="0" stroke="rgba(52,211,153,0.3)" strokeWidth="1.25" />
            <line x1="30" y1="0" x2="670" y2="0" stroke="#34D399" strokeWidth="1" strokeDasharray="6 12" className="hud-rail-dash" />
            {/* Taps to each zone */}
            {[88, 215, 310, 422, 524, 626].map((xTap) => (
              <line
                key={`tap-${xTap}`}
                x1={xTap}
                y1="-18"
                x2={xTap}
                y2="0"
                stroke="rgba(52,211,153,0.25)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            ))}
            <text x="350" y="12" textAnchor="middle" fill="#6EE7B7" fontSize="6.5" fontFamily="monospace" opacity="0.85">
              POSTGRES ROW-LEVEL SECURITY (RLS) · TENANT-ISOLATED DATA HIGHWAY
            </text>
          </g>

          {/* ── Workflow Stage Operational Nodes (Crisp, Collision-Free Offsets) ── */}
          {stages.map((stage) => {
            const isHovered = activeStageId === stage.id;

            return (
              <g
                key={stage.id}
                transform={`translate(${stage.x}, ${stage.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setActiveStageId(stage.id)}
                onMouseLeave={() => setActiveStageId(null)}
                tabIndex={0}
                role="button"
                aria-label={`${stage.title}: ${stage.subtitle}`}
                onFocus={() => setActiveStageId(stage.id)}
                onBlur={() => setActiveStageId(null)}
              >
                {/* Node Geometry by Shape Type */}
                {stage.shape === "diamond" ? (
                  /* Gated Approval Nexus (Hexagonal Diamond Gated Shape) */
                  <g>
                    <polygon
                      points="0,-22 22,-8 22,12 0,22 -22,12 -22,-8"
                      fill={isHovered ? "rgba(16,185,129,0.4)" : "rgba(4,42,26,0.92)"}
                      stroke={isHovered ? "#34D399" : "#10B981"}
                      strokeWidth={isHovered ? 2 : 1.5}
                      filter="url(#wf-glow)"
                      className="transition-all duration-200"
                    />
                    <polygon
                      points="0,-16 16,-6 16,9 0,16 -16,9 -16,-6"
                      fill="none"
                      stroke={isHovered ? "#6EE7B7" : "rgba(52,211,153,0.4)"}
                      strokeWidth="1"
                    />
                    <circle cx="0" cy="0" r="5" fill="#34D399" className="animate-pulse" />
                  </g>
                ) : stage.shape === "pill" ? (
                  /* Identity / Enrollment Capsule Node */
                  <g>
                    <rect
                      x="-36"
                      y="-18"
                      width="72"
                      height="36"
                      rx="18"
                      fill={isHovered ? "rgba(16,185,129,0.4)" : "rgba(4,42,26,0.92)"}
                      stroke={isHovered ? "#34D399" : "rgba(52,211,153,0.6)"}
                      strokeWidth={isHovered ? 2 : 1.25}
                      filter={isHovered ? "url(#wf-glow)" : undefined}
                      className="transition-all duration-200"
                    />
                    <circle cx="-18" cy="0" r="4" fill={isHovered ? "#6EE7B7" : "#34D399"} />
                  </g>
                ) : (
                  /* Operational Standard Card Node */
                  <g>
                    <rect
                      x="-42"
                      y="-18"
                      width="84"
                      height="36"
                      rx="9"
                      fill={isHovered ? "rgba(16,185,129,0.38)" : "rgba(4,42,26,0.92)"}
                      stroke={isHovered ? "#34D399" : "rgba(52,211,153,0.55)"}
                      strokeWidth={isHovered ? 2 : 1.25}
                      filter={isHovered ? "url(#wf-glow)" : undefined}
                      className="transition-all duration-200"
                    />
                    <circle cx="-24" cy="0" r="3.5" fill={isHovered ? "#6EE7B7" : "#34D399"} />
                  </g>
                )}

                {/* Primary Stage Title */}
                <text
                  x={stage.shape === "pill" ? 4 : stage.shape === "diamond" ? 0 : 2}
                  y={stage.shape === "diamond" ? -27 : -23}
                  textAnchor="middle"
                  fill={isHovered ? "#FFFFFF" : "#A7F3D0"}
                  fontSize={isHovered ? "8" : "7.2"}
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {stage.title}
                </text>

                {/* Subtitle / Telemetry Badge */}
                <text
                  x={stage.shape === "pill" ? 4 : stage.shape === "diamond" ? 0 : 2}
                  y={stage.shape === "diamond" ? 28 : 25}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="6"
                  fontFamily="monospace"
                  className={isHovered ? "fill-emerald-300" : ""}
                >
                  {stage.badge}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Active Workflow Subsystem Inspector Strip ── */}
      <div className="relative z-10 mt-1 rounded-lg border border-emerald-500/20 bg-emerald-950/45 p-2 text-xs backdrop-blur-xs transition-colors">
        {activeStage ? (
          <div className="animate-fade-in font-mono space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-300">{activeStage.title}</span>
                <span className="text-slate-300 text-[10.5px]">[{activeStage.badge}]</span>
              </div>
              <span className="text-[9.5px] text-emerald-400/90 font-medium bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {activeStage.subsystemPath}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-normal pl-4">
              {activeStage.description}
            </p>
            <div className="flex items-center gap-4 text-[9px] text-slate-400 pl-4 pt-0.5 border-t border-emerald-500/10">
              <span><strong>Upstream:</strong> {activeStage.upstream}</span>
              <span>•</span>
              <span><strong>Downstream:</strong> {activeStage.downstream}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>Hover or focus any workflow stage to inspect live dependencies, routing rules, and subsystem telemetry.</span>
            </span>
            <span className="text-[10px] text-emerald-400/80 uppercase">
              LIVE WORKFLOW RIVER
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom Telemetry Grid: Verified Enterprise Metrics ── */}
      {showTelemetry && (
        <div className="relative z-10 mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-emerald-500/20 pt-3 text-center">
          <div className="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Pipeline Phases
            </div>
            <div className="text-xs sm:text-sm font-bold text-white font-mono">
              5 Coordinated
            </div>
          </div>
          <div className="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Approval Nexus
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-300 font-mono">
              Multi-Tier Gated
            </div>
          </div>
          <div className="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Tenant Isolation
            </div>
            <div className="text-xs sm:text-sm font-bold text-teal-300 font-mono">
              Postgres RLS
            </div>
          </div>
          <div className="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Settlement Engine
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
              Effective Payroll
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export aliases for backward compatibility with existing imports
export const EcosystemConstellationHud = WorkflowPipelineHud;
