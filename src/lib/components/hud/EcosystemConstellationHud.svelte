<script lang="ts">
  import SvgIcon from "$lib/components/ui/Icon.svelte";

  const cn = (...values: (string | boolean | null | undefined)[]) =>
    values.filter(Boolean).join(" ");

  interface WorkflowPipelineHudProps {
    class?: string;
    showTelemetry?: boolean;
  }

  let { class: className, showTelemetry = true }: WorkflowPipelineHudProps = $props();

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

  let activeStageId = $state<string | null>(null);

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
      title: "TIME & SHIFT",
      subtitle: "Biometric Punch · Geo Fence",
      badge: "Punctuality Mesh",
      subsystemPath: "modules/attendance/service.ts",
      description: "Shift assignments, break logging, overnight shift window calculations, and manager regularization requests.",
      upstream: "Role Activation & Department Pods",
      downstream: "Approval Nexus & Payroll Ledger",
      x: 422,
      y: 68,
      shape: "rect",
    },
    {
      id: "leave",
      phase: "Operations",
      phaseNum: 3,
      title: "LEAVE & BALANCES",
      subtitle: "Accruals · Absence Policy",
      badge: "Policy Enclave",
      subsystemPath: "modules/leave/service.ts",
      description: "Policy-driven accrual rates, leave quota deduction checks, and multi-tier approval routing initiation.",
      upstream: "Role Activation & Holiday Calendar",
      downstream: "Approval Nexus & Payroll Adjustments",
      x: 422,
      y: 206,
      shape: "rect",
    },

    // Phase 4: Governance & Approval Nexus (Center Gate)
    {
      id: "approvals",
      phase: "Governance",
      phaseNum: 4,
      title: "APPROVAL NEXUS",
      subtitle: "Manager · HR · Finance Gating",
      badge: "Zero-Trust Gate",
      subsystemPath: "modules/approvals/service.ts",
      description: "Deterministic state transition gateway for leave, expenses, attendance regularization, and requisition sign-offs.",
      upstream: "Shift Regularization & Leave Applications",
      downstream: "Payroll Run Settlement & BI Reporting",
      x: 524,
      y: 137,
      shape: "diamond",
    },

    // Phase 5: Settlement & Intelligence (Right)
    {
      id: "payroll",
      phase: "Settlement",
      phaseNum: 5,
      title: "PAYROLL LEDGER",
      subtitle: "Gross-to-Net · Statutory Locks",
      badge: "Financial Engine",
      subsystemPath: "modules/payroll/service.ts",
      description: "Salary component calculation, attendance-loss-of-pay clipping, statutory deductions, and finalized bank disbursal registers.",
      upstream: "Approval Nexus & Approved Timesheets",
      downstream: "Employee Payslips & General Ledger",
      x: 626,
      y: 68,
      shape: "rect",
    },
    {
      id: "analytics",
      phase: "Settlement",
      phaseNum: 5,
      title: "ENTERPRISE BI",
      subtitle: "Capacity · Headcount · Ledger",
      badge: "Unified Telemetry",
      subsystemPath: "modules/reporting/service.ts",
      description: "Cross-department workforce utilization, payroll expenditure distribution, attrition forecasting, and audit trails.",
      upstream: "Continuous Subsystem Telemetry",
      downstream: "Executive Governance & Audit Ledgers",
      x: 626,
      y: 206,
      shape: "rect",
    },
  ];

  const activeStage = $derived(stages.find((s) => s.id === activeStageId));

  const pipelineRails = {
    primaryPipelineRail:
      "M 88 206 C 145 206, 165 137, 215 137 L 310 137 C 360 137, 375 68, 422 68 C 475 68, 485 137, 524 137 C 570 137, 580 68, 626 68",
    secondaryOperationalRail:
      "M 310 137 C 360 137, 375 206, 422 206 C 475 206, 485 137, 524 137 C 570 137, 580 206, 626 206",
    tenantGenesisRail: "M 88 68 C 145 68, 165 137, 215 137 L 310 137",
  };
</script>

<div
  class={cn(
    "relative rounded-2xl border border-emerald-500/25 bg-[#030E08]/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_20px_54px_rgba(0,0,0,0.55)] overflow-hidden text-white font-sans select-none",
    className
  )}
  role="region"
  aria-label="SymphoWork Enterprise Workflow Command Stream"
>
  <!-- Background Flare & Grid -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div class="absolute top-1/4 left-8 size-48 rounded-full bg-emerald-500/10 blur-[60px]"></div>
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 size-56 rounded-full bg-teal-500/12 blur-[65px]"></div>
    <div class="absolute top-1/4 right-8 size-48 rounded-full bg-emerald-500/10 blur-[60px]"></div>
    <div class="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:22px_22px] opacity-10"></div>
  </div>

  <!-- Top Bar -->
  <div class="relative z-10 flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-2">
    <div class="flex items-center gap-2.5">
      <div class="relative flex size-2.5">
        <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex size-2.5 rounded-full bg-emerald-400"></span>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold tracking-wider uppercase text-emerald-300 font-mono">
            SymphoWork Workflow Command Engine
          </span>
          <span class="rounded bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
            END-TO-END PIPELINE
          </span>
        </div>
        <p class="text-[10px] text-slate-400">
          Coordinated people operations, gated approvals, and financial settlement stream
        </p>
      </div>
    </div>

    <div class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-2.5 py-1 text-[10px] font-mono text-emerald-300">
      <SvgIcon name="Activity" class="size-3 text-emerald-400 animate-pulse" />
      <span class="font-semibold">STREAM: CONTINUOUS</span>
    </div>
  </div>

  <!-- Main SVG Workflow River Canvas -->
  <div class="relative z-10 py-1">
    <svg
      viewBox="0 0 700 290"
      class="w-full h-auto overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="wf-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

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

      <!-- 5 Phase Operational Boundaries -->
      <!-- Phase 1: Ingestion -->
      <rect
        x="24"
        y="26"
        width="128"
        height="228"
        rx="10"
        fill="rgba(6,78,59,0.12)"
        stroke="rgba(52,211,153,0.18)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
      <text x="88" y="44" text-anchor="middle" fill="#6EE7B7" font-size="7.5" font-family="monospace" font-weight="700" letter-spacing="0.08em">
        PHASE 1 · INGESTION
      </text>

      <!-- Phase 2: Enrollment -->
      <rect
        x="164"
        y="80"
        width="196"
        height="120"
        rx="10"
        fill="rgba(6,78,59,0.14)"
        stroke="rgba(52,211,153,0.22)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
      <text x="262" y="98" text-anchor="middle" fill="#6EE7B7" font-size="7.5" font-family="monospace" font-weight="700" letter-spacing="0.08em">
        PHASE 2 · ENROLLMENT
      </text>

      <!-- Phase 3: Operations -->
      <rect
        x="372"
        y="26"
        width="100"
        height="228"
        rx="10"
        fill="rgba(6,78,59,0.12)"
        stroke="rgba(52,211,153,0.18)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
      <text x="422" y="44" text-anchor="middle" fill="#6EE7B7" font-size="7.5" font-family="monospace" font-weight="700" letter-spacing="0.08em">
        PHASE 3 · OPS
      </text>

      <!-- Phase 4: Nexus -->
      <rect
        x="484"
        y="75"
        width="80"
        height="130"
        rx="10"
        fill="rgba(6,78,59,0.18)"
        stroke="rgba(52,211,153,0.3)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
      <text x="524" y="93" text-anchor="middle" fill="#34D399" font-size="7.5" font-family="monospace" font-weight="700" letter-spacing="0.08em">
        PHASE 4 · GATE
      </text>

      <!-- Phase 5: Settlement -->
      <rect
        x="576"
        y="26"
        width="100"
        height="228"
        rx="10"
        fill="rgba(6,78,59,0.12)"
        stroke="rgba(52,211,153,0.18)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
      <text x="626" y="44" text-anchor="middle" fill="#6EE7B7" font-size="7.5" font-family="monospace" font-weight="700" letter-spacing="0.08em">
        PHASE 5 · SETTLE
      </text>

      <!-- Pipeline Rails -->
      <path
        d={pipelineRails.tenantGenesisRail}
        fill="none"
        stroke="rgba(52,211,153,0.35)"
        stroke-width="1.75"
        stroke-dasharray="5 5"
      />
      <path
        d={pipelineRails.primaryPipelineRail}
        fill="none"
        stroke="rgba(52,211,153,0.5)"
        stroke-width="2"
      />
      <path
        d={pipelineRails.secondaryOperationalRail}
        fill="none"
        stroke="rgba(45,212,191,0.45)"
        stroke-width="1.75"
      />

      <!-- Animated Pulse Packets -->
      <circle r="3.5" fill="#6EE7B7" filter="url(#wf-glow)">
        <animateMotion
          dur="7s"
          repeatCount="indefinite"
          path={pipelineRails.primaryPipelineRail}
        />
      </circle>
      <circle r="3" fill="#34D399" filter="url(#wf-glow)">
        <animateMotion
          dur="8.5s"
          repeatCount="indefinite"
          path={pipelineRails.secondaryOperationalRail}
        />
      </circle>
      <circle r="3" fill="#A7F3D0" filter="url(#wf-glow)">
        <animateMotion
          dur="6s"
          repeatCount="indefinite"
          path={pipelineRails.tenantGenesisRail}
        />
      </circle>

      <!-- Interactive Stage Nodes -->
      {#each stages as stage}
        {@const isHovered = activeStageId === stage.id}
        <g
          transform="translate({stage.x}, {stage.y})"
          class="cursor-pointer transition-transform duration-200"
          onmouseenter={() => (activeStageId = stage.id)}
          onmouseleave={() => {
            if (activeStageId === stage.id) activeStageId = null;
          }}
          tabindex="0"
          role="button"
          aria-label="{stage.title} - {stage.subtitle}"
          onfocus={() => (activeStageId = stage.id)}
          onblur={() => {
            if (activeStageId === stage.id) activeStageId = null;
          }}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              activeStageId = stage.id;
            }
          }}
        >
          {#if stage.shape === "diamond"}
            <!-- Central Governance Gate Diamond -->
            <g>
              <polygon
                points="0,-24 24,0 0,24 -24,0"
                fill={isHovered ? "rgba(16,185,129,0.45)" : "rgba(4,42,26,0.92)"}
                stroke={isHovered ? "#34D399" : "rgba(52,211,153,0.7)"}
                stroke-width={isHovered ? 2 : 1.5}
                filter="url(#wf-glow)"
                class="transition-all duration-200"
              />
              <polygon
                points="0,-16 16,-6 16,9 0,16 -16,9 -16,-6"
                fill="none"
                stroke={isHovered ? "#6EE7B7" : "rgba(52,211,153,0.4)"}
                stroke-width="1"
              />
              <circle cx="0" cy="0" r="5" fill="#34D399" class="animate-pulse" />
            </g>
          {:else if stage.shape === "pill"}
            <!-- Identity / Enrollment Capsule Node -->
            <g>
              <rect
                x="-36"
                y="-18"
                width="72"
                height="36"
                rx="18"
                fill={isHovered ? "rgba(16,185,129,0.4)" : "rgba(4,42,26,0.92)"}
                stroke={isHovered ? "#34D399" : "rgba(52,211,153,0.6)"}
                stroke-width={isHovered ? 2 : 1.25}
                filter={isHovered ? "url(#wf-glow)" : undefined}
                class="transition-all duration-200"
              />
              <circle cx="-18" cy="0" r="4" fill={isHovered ? "#6EE7B7" : "#34D399"} />
            </g>
          {:else}
            <!-- Operational Standard Card Node -->
            <g>
              <rect
                x="-42"
                y="-18"
                width="84"
                height="36"
                rx="9"
                fill={isHovered ? "rgba(16,185,129,0.38)" : "rgba(4,42,26,0.92)"}
                stroke={isHovered ? "#34D399" : "rgba(52,211,153,0.55)"}
                stroke-width={isHovered ? 2 : 1.25}
                filter={isHovered ? "url(#wf-glow)" : undefined}
                class="transition-all duration-200"
              />
              <circle cx="-24" cy="0" r="3.5" fill={isHovered ? "#6EE7B7" : "#34D399"} />
            </g>
          {/if}

          <!-- Primary Stage Title -->
          <text
            x={stage.shape === "pill" ? 4 : stage.shape === "diamond" ? 0 : 2}
            y={stage.shape === "diamond" ? -27 : -23}
            text-anchor="middle"
            fill={isHovered ? "#FFFFFF" : "#A7F3D0"}
            font-size={isHovered ? "8" : "7.2"}
            font-family="monospace"
            font-weight="700"
          >
            {stage.title}
          </text>

          <!-- Subtitle / Telemetry Badge -->
          <text
            x={stage.shape === "pill" ? 4 : stage.shape === "diamond" ? 0 : 2}
            y={stage.shape === "diamond" ? 28 : 25}
            text-anchor="middle"
            fill="#64748B"
            font-size="6"
            font-family="monospace"
            class={isHovered ? "fill-emerald-300" : ""}
          >
            {stage.badge}
          </text>
        </g>
      {/each}
    </svg>
  </div>

  <!-- Active Workflow Subsystem Inspector Strip -->
  <div class="relative z-10 mt-1 rounded-lg border border-emerald-500/20 bg-emerald-950/45 p-2 text-xs backdrop-blur-xs transition-colors">
    {#if activeStage}
      <div class="animate-fade-in font-mono space-y-1">
        <div class="flex items-center justify-between text-[11px]">
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-bold text-emerald-300">{activeStage.title}</span>
            <span class="text-slate-300 text-[10.5px]">[{activeStage.badge}]</span>
          </div>
          <span class="text-[9.5px] text-emerald-400/90 font-medium bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
            {activeStage.subsystemPath}
          </span>
        </div>
        <p class="text-[10px] text-slate-300 leading-normal pl-4">
          {activeStage.description}
        </p>
        <div class="flex items-center gap-4 text-[9px] text-slate-400 pl-4 pt-0.5 border-t border-emerald-500/10">
          <span><strong>Upstream:</strong> {activeStage.upstream}</span>
          <span>•</span>
          <span><strong>Downstream:</strong> {activeStage.downstream}</span>
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span class="flex items-center gap-1.5">
          <span class="size-1.5 rounded-full bg-emerald-400"></span>
          <span>Hover or focus any workflow stage to inspect live dependencies, routing rules, and subsystem telemetry.</span>
        </span>
        <span class="text-[10px] text-emerald-400/80 uppercase">
          LIVE WORKFLOW RIVER
        </span>
      </div>
    {/if}
  </div>

  <!-- Bottom Telemetry Grid -->
  {#if showTelemetry}
    <div class="relative z-10 mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-emerald-500/20 pt-3 text-center">
      <div class="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-2">
        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
          Pipeline Phases
        </div>
        <div class="text-xs sm:text-sm font-bold text-white font-mono">
          5 Coordinated
        </div>
      </div>
      <div class="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-2">
        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
          Approval Nexus
        </div>
        <div class="text-xs sm:text-sm font-bold text-emerald-300 font-mono">
          Multi-Tier Gated
        </div>
      </div>
      <div class="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-2">
        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
          Tenant Isolation
        </div>
        <div class="text-xs sm:text-sm font-bold text-teal-300 font-mono">
          Postgres RLS
        </div>
      </div>
      <div class="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-2">
        <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
          Settlement Engine
        </div>
        <div class="text-xs sm:text-sm font-bold text-emerald-400 font-mono">
          Effective Payroll
        </div>
      </div>
    </div>
  {/if}
</div>
