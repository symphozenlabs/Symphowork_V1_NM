<script lang="ts">
  import { onDestroy } from "svelte";
  import SvgIcon from "$lib/components/ui/Icon.svelte";

  const cn = (...values: (string | boolean | null | undefined)[]) =>
    values.filter(Boolean).join(" ");

  interface EnterpriseGrowthHudProps {
    class?: string;
    showTelemetry?: boolean;
  }

  let { class: className, showTelemetry = true }: EnterpriseGrowthHudProps = $props();

  interface GrowthStage {
    id: string;
    stageNum: number;
    badge: string;
    navTitle: string;
    headline: string;
    subtitle: string;
    subsystemPath: string;
    description: string;
    metrics: { label: string; value: string; badge?: string }[];
  }

  const stages: GrowthStage[] = [
    {
      id: "genesis",
      stageNum: 1,
      badge: "Stage 01 · Workspace Genesis",
      navTitle: "1. Genesis",
      headline: "Organization Workspace Established",
      subtitle: "Automated tenant provisioning, currency & locale configuration, and schema initialization",
      subsystemPath: "modules/platform/provisioning.ts",
      description:
        "Deterministic tenant genesis with isolated Postgres RLS boundaries, automatic sequential EMP-0001 counter initialization, and baseline HCM schema provisioning.",
      metrics: [
        { label: "Tenant Partition", value: "Postgres RLS Active", badge: "Isolated" },
        { label: "Sequential ID", value: "EMP0001 Counter", badge: "Auto" },
        { label: "Base Timezone", value: "America/New_York", badge: "EST" },
      ],
    },
    {
      id: "owner",
      stageNum: 2,
      badge: "Stage 02 · Executive Authority",
      navTitle: "2. Executive Owner",
      headline: "Organization Owner & Root Administration",
      subtitle: "Assignment of executive administrator with root organizational authority & Argon2id credentials",
      subsystemPath: "modules/identity/auth.ts",
      description:
        "Establishment of executive administrator identity with multi-tenant scope, root operational permissions, and secure session credentials.",
      metrics: [
        { label: "System Role", value: "ORGANIZATION_OWNER", badge: "Root Authority" },
        { label: "Authentication", value: "Argon2id Verified", badge: "Zero-Trust" },
        { label: "Administrative Scope", value: "Unrestricted", badge: "All Pods" },
      ],
    },
    {
      id: "onboarding",
      stageNum: 3,
      badge: "Stage 03 · Talent Ingestion",
      navTitle: "3. Onboarding",
      headline: "Tokenized Invitation & Profile Onboarding",
      subtitle: "Cryptographic 32-byte opaque tokens, credential handshakes, and 3-step compliance checklists",
      subsystemPath: "api/app/employees/[id]/invite",
      description:
        "Invitations dispatched with SHA-256 hashed tokens and 7-day lifecycles. New hires complete profile setup, role confirmation, and compliance review.",
      metrics: [
        { label: "Invitation Token", value: "SHA-256 Digest", badge: "7-Day Exp" },
        { label: "Onboarding State", value: "3-Step Checklist", badge: "Verified" },
        { label: "Initial Cohort", value: "3 Key Roles Joined", badge: "Ready" },
      ],
    },
    {
      id: "growth",
      stageNum: 4,
      badge: "Stage 04 · Structural Expansion",
      navTitle: "4. Department Pods",
      headline: "Departments, Pods & Reporting Hierarchies",
      subtitle: "Organic workforce expansion across functional departments, team pods, and reporting lines",
      subsystemPath: "modules/master-data & tenancy",
      description:
        "Scale the organization into structured departments (Engineering, HR, Revenue, Design) with dedicated Team Leads, Managers, and direct reporting lines.",
      metrics: [
        { label: "Functional Pods", value: "4 Dedicated Teams", badge: "Structured" },
        { label: "Active Roster", value: "35 Team Members", badge: "Growing" },
        { label: "Reporting Lines", value: "Hierarchical", badge: "Governed" },
      ],
    },
    {
      id: "operations",
      stageNum: 5,
      badge: "Stage 05 · Continuous Operations",
      navTitle: "5. Daily Operations",
      headline: "Attendance, Shifts, Gated Approvals & Payroll",
      subtitle: "Timezone-aware shift clock-ins, multi-tier leave approval routing, and payroll preparation",
      subsystemPath: "modules/attendance & workflows",
      description:
        "Seamless daily business operations: automated shift matching, multi-tier approval routing for leave requests, talent recruitment, and gross-to-net payroll runs.",
      metrics: [
        { label: "Shift Compliance", value: "99.2% On-Time", badge: "Live" },
        { label: "Workflow Engine", value: "Multi-Tier Gate", badge: "Active" },
        { label: "Payroll Readiness", value: "Gross/Net Locked", badge: "Verified" },
      ],
    },
    {
      id: "intelligence",
      stageNum: 6,
      badge: "Stage 06 · Unified Coordination",
      navTitle: "6. Enterprise BI",
      headline: "Enterprise Intelligence & Zero-Leakage Governance",
      subtitle: "Unified command center with live workforce analytics, utilization dashboards, and Postgres RLS",
      subsystemPath: "modules/reporting & platform/analytics",
      description:
        "A mature, fully coordinated enterprise platform providing real-time headcount intelligence, attendance breakdowns, department budgets, and tenant-isolated governance.",
      metrics: [
        { label: "Total Workforce", value: "248 Members", badge: "+14% QoQ" },
        { label: "Monthly Payroll", value: "$1,420,850", badge: "Disbursed" },
        { label: "RLS Protection", value: "100% Query Mesh", badge: "Zero-Leak" },
      ],
    },
  ];

  let activeStageIndex = $state(0);
  let isPlaying = $state(true);
  let progress = $state(0);
  let isHovered = $state(false);

  const STAGE_DURATION_MS = 6000;
  const TICK_INTERVAL_MS = 50;

  let timer: ReturnType<typeof setInterval> | null = null;

  function startTimer() {
    stopTimer();
    if (!isPlaying || isHovered) return;
    timer = setInterval(() => {
      progress += (TICK_INTERVAL_MS / STAGE_DURATION_MS) * 100;
      if (progress >= 100) {
        progress = 0;
        activeStageIndex = (activeStageIndex + 1) % stages.length;
      }
    }, TICK_INTERVAL_MS);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  $effect(() => {
    if (isPlaying && !isHovered) {
      startTimer();
    } else {
      stopTimer();
    }
  });

  onDestroy(() => {
    stopTimer();
  });

  function selectStage(index: number) {
    activeStageIndex = index;
    progress = 0;
  }

  function handlePrev() {
    activeStageIndex = activeStageIndex === 0 ? stages.length - 1 : activeStageIndex - 1;
    progress = 0;
  }

  function handleNext() {
    activeStageIndex = (activeStageIndex + 1) % stages.length;
    progress = 0;
  }

  const currentStage = $derived(stages[activeStageIndex]);
</script>

<div
  class={cn(
    "relative flex flex-col rounded-2xl border border-emerald-900/60 bg-[#07120D] text-slate-100 shadow-[0_25px_60px_rgba(2,12,7,0.45)] overflow-hidden transition-all duration-300",
    className
  )}
  role="region"
  aria-label="SymphoWork Enterprise Growth Journey Demonstration"
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
>
  <!-- Background Animated Motion Ribbons & Traveling Particles -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
    <svg
      class="absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
      viewBox="0 0 800 500"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="growthRibbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.2" />
          <stop offset="50%" stop-color="#059669" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#34d399" stop-opacity="0.25" />
        </linearGradient>
        <filter id="particleGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Flowing guide paths -->
      <path
        id="growthPath1"
        d="M -20,120 Q 200,60 400,240 T 820,380"
        fill="none"
        stroke="url(#growthRibbonGradient)"
        stroke-width="2.5"
        stroke-dasharray="6 8"
        class="hud-rail-dash"
      />
      <path
        id="growthPath2"
        d="M -20,380 Q 250,420 500,200 T 820,90"
        fill="none"
        stroke="url(#growthRibbonGradient)"
        stroke-width="1.5"
        stroke-dasharray="8 6"
        class="hud-rail-dash"
        style="animation-direction: reverse;"
      />

      <!-- Luminous Traveling Particles -->
      <circle r="4.5" fill="#34d399" filter="url(#particleGlow)">
        <animateMotion
          dur="10s"
          repeatCount="indefinite"
          path="M -20,120 Q 200,60 400,240 T 820,380"
        />
      </circle>
      <circle r="3.5" fill="#10b981" filter="url(#particleGlow)">
        <animateMotion
          dur="8s"
          repeatCount="indefinite"
          path="M -20,380 Q 250,420 500,200 T 820,90"
        />
      </circle>
      <circle r="5" fill="#6ee7b7" filter="url(#particleGlow)">
        <animateMotion
          dur="12s"
          repeatCount="indefinite"
          path="M -20,120 Q 200,60 400,240 T 820,380"
          begin="4s"
        />
      </circle>
    </svg>
  </div>

  <!-- Top Header Bar -->
  <div class="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/80 bg-[#091711]/90 px-4 py-3 sm:px-6">
    <div class="flex items-center gap-2.5">
      <div class="flex size-7 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
        <SvgIcon name="Compass" class="size-4 animate-spin" style="animation-duration: 24s;" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Enterprise Growth Journey
          </span>
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/25">
            <span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Product Flow
          </span>
        </div>
        <p class="text-[11px] text-slate-400 hidden sm:block">
          From workspace genesis to fully coordinated multi-department enterprise
        </p>
      </div>
    </div>

    <!-- Stepper Controls -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => (isPlaying = !isPlaying)}
        class="flex size-7 items-center justify-center rounded-md border border-emerald-800/60 bg-emerald-950/40 text-slate-300 hover:text-white hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 transition-colors"
        aria-label={isPlaying ? "Pause auto-advancing growth demonstration" : "Play auto-advancing growth demonstration"}
        title={isPlaying ? "Pause" : "Play"}
      >
        {#if isPlaying}
          <SvgIcon name="Pause" class="size-3.5" />
        {:else}
          <SvgIcon name="Play" class="size-3.5 ml-0.5" />
        {/if}
      </button>
      <button
        type="button"
        onclick={handlePrev}
        class="flex size-7 items-center justify-center rounded-md border border-emerald-800/60 bg-emerald-950/40 text-slate-300 hover:text-white hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 transition-colors"
        aria-label="Previous enterprise growth stage"
        title="Previous Stage"
      >
        <SvgIcon name="ChevronLeft" class="size-4" />
      </button>
      <button
        type="button"
        onclick={handleNext}
        class="flex size-7 items-center justify-center rounded-md border border-emerald-800/60 bg-emerald-950/40 text-slate-300 hover:text-white hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 transition-colors"
        aria-label="Next enterprise growth stage"
        title="Next Stage"
      >
        <SvgIcon name="ChevronRight" class="size-4" />
      </button>
    </div>
  </div>

  <!-- Interactive 6-Stage Timeline Scrubber Bar -->
  <div class="relative z-10 border-b border-emerald-950/70 bg-[#06100B]/95 px-3 py-2 sm:px-6">
    <div
      class="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2"
      role="tablist"
      aria-label="Enterprise Growth Stages"
    >
      {#each stages as stage, idx}
        {@const isActive = idx === activeStageIndex}
        {@const isCompleted = idx < activeStageIndex}
        <button
          type="button"
          role="tab"
          aria-selected={isActive}
          onclick={() => selectStage(idx)}
          class={cn(
            "group relative flex flex-col items-start rounded-lg p-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
            isActive
              ? "bg-emerald-950/70 border border-emerald-600/60 shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
              : "bg-emerald-950/20 border border-transparent hover:bg-emerald-950/40 hover:border-emerald-900/60"
          )}
        >
          <div class="flex items-center justify-between w-full">
            <span
              class={cn(
                "text-[10px] font-bold tracking-wider uppercase transition-colors",
                isActive
                  ? "text-emerald-300"
                  : isCompleted
                  ? "text-emerald-500"
                  : "text-slate-400 group-hover:text-slate-300"
              )}
            >
              {stage.navTitle}
            </span>
            {#if isActive}
              <span class="size-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            {:else if isCompleted}
              <SvgIcon name="Check" class="size-2.5 text-emerald-500" />
            {/if}
          </div>

          <!-- Micro Progress Bar on Active Tab -->
          <div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-emerald-950/80">
            <div
              class={cn(
                "h-full rounded-full transition-all duration-100",
                isActive
                  ? "bg-emerald-400"
                  : isCompleted
                  ? "bg-emerald-600"
                  : "bg-transparent"
              )}
              style="width: {isActive ? `${progress}%` : isCompleted ? '100%' : '0%'};"
            ></div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Main Growth Scene Display Area -->
  <div class="relative z-10 p-4 sm:p-6 lg:p-7 flex-1 flex flex-col justify-between">
    <!-- Stage Header Info Banner -->
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-300">
          <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{currentStage.badge}</span>
        </div>
        <h2 class="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
          {currentStage.headline}
        </h2>
        <p class="mt-1 max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
          {currentStage.description}
        </p>
      </div>
      <div class="hidden lg:flex flex-col items-end gap-1">
        <span class="text-[11px] font-mono text-emerald-400/80 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/40">
          {currentStage.subsystemPath}
        </span>
        <span class="text-[10px] text-slate-400">Active Real Subsystem</span>
      </div>
    </div>

    <!-- Dynamic High-Fidelity Scene Presentation -->
    <div class="relative rounded-xl border border-emerald-900/60 bg-gradient-to-b from-[#0B1A13]/90 to-[#07130D]/90 p-4 sm:p-5 shadow-inner">
      {#if activeStageIndex === 0}
        <!-- STAGE 1: ORGANIZATION CREATION -->
        <div class="space-y-4 animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/50 pb-3">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <SvgIcon name="Building2" class="size-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">
                    Acme Global Technologies Inc.
                  </h3>
                  <span class="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                    TENANT_INITIALIZED
                  </span>
                </div>
                <p class="text-xs text-slate-400 font-mono">
                  Partition: tenant_acme_global · Domain: acme.symphowork.app
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <SvgIcon name="Sparkles" class="size-3.5" />
              Deterministic HCM Provisioning
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3">
              <span class="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Currency &amp; Locale
              </span>
              <p class="mt-1 text-sm font-semibold text-white">USD ($) · en-US</p>
              <p class="text-[11px] text-slate-400 mt-0.5">America/New_York (EST)</p>
            </div>
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3">
              <span class="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Sequential ID Generator
              </span>
              <p class="mt-1 text-sm font-semibold text-white">Prefix: EMP0001</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Thread-safe auto-increment</p>
            </div>
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3">
              <span class="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Security Enclave
              </span>
              <p class="mt-1 text-sm font-semibold text-white">Postgres RLS Active</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Zero cross-tenant leakage</p>
            </div>
          </div>
        </div>
      {:else if activeStageIndex === 1}
        <!-- STAGE 2: ORGANIZATION OWNER ASSIGNMENT -->
        <div class="space-y-4 animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/50 pb-3">
            <div class="flex items-center gap-3">
              <div class="relative flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-base shadow-[0_0_18px_rgba(16,185,129,0.3)]">
                EV
                <span class="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow">
                  <SvgIcon name="Crown" class="size-3 fill-current" />
                </span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">
                    Elena Vance
                  </h3>
                  <span class="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40 uppercase">
                    ORGANIZATION_OWNER
                  </span>
                </div>
                <p class="text-xs text-slate-300">
                  Chief Executive Officer &amp; Founder · <span class="font-mono text-emerald-400">elena.vance@acme.io</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-600/30 font-medium">
              <SvgIcon name="ShieldCheck" class="size-4" />
              Root Authority &amp; Commercial Sign-Off
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3">
              <span class="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Credential Standard
              </span>
              <p class="mt-1 text-sm font-semibold text-white">Argon2id Hash Enclave</p>
              <p class="text-[11px] text-slate-400 mt-0.5">MFA Session Ready</p>
            </div>
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3">
              <span class="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Administrative Scope
              </span>
              <p class="mt-1 text-sm font-semibold text-white">All Modules Unlocked</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Tenant Owner Permissions</p>
            </div>
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3">
              <span class="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Governance Status
              </span>
              <p class="mt-1 text-sm font-semibold text-white">Active Administrator</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Empowered to invite teams</p>
            </div>
          </div>
        </div>
      {:else if activeStageIndex === 2}
        <!-- STAGE 3: WORKFORCE ONBOARDING -->
        <div class="space-y-4 animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/50 pb-3">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <SvgIcon name="UserPlus" class="size-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">
                    Cryptographic Ingestion &amp; Onboarding
                  </h3>
                  <span class="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-500/30">
                    TOKEN_HANDSHAKE
                  </span>
                </div>
                <p class="text-xs text-slate-400">
                  32-byte opaque tokens · SHA-256 validation · 3-Step Compliance Checklist
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <SvgIcon name="Mail" class="size-3.5" />
              7-Day Secure Email Delivery
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-3 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Alex Chen</span>
                <span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                  TEAM_LEAD
                </span>
              </div>
              <p class="text-[11px] text-slate-300">Staff Cloud Architect</p>
              <div class="flex items-center gap-1.5 text-[10px] text-emerald-400 pt-1 border-t border-emerald-900/40">
                <SvgIcon name="CheckCircle2" class="size-3" />
                <span>Onboarding 100% Complete</span>
              </div>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-3 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Priya Patel</span>
                <span class="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                  HR_EXECUTIVE
                </span>
              </div>
              <p class="text-[11px] text-slate-300">HR Business Partner</p>
              <div class="flex items-center gap-1.5 text-[10px] text-cyan-400 pt-1 border-t border-emerald-900/40">
                <SvgIcon name="CheckCircle2" class="size-3" />
                <span>Compliance Verified</span>
              </div>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-3 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white">Marcus Vance</span>
                <span class="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                  EMPLOYEE
                </span>
              </div>
              <p class="text-[11px] text-slate-300">Senior Fullstack Engineer</p>
              <div class="flex items-center gap-1.5 text-[10px] text-amber-400 pt-1 border-t border-emerald-900/40">
                <SvgIcon name="Clock" class="size-3" />
                <span>Checklist Item 3/3 Finalized</span>
              </div>
            </div>
          </div>
        </div>
      {:else if activeStageIndex === 3}
        <!-- STAGE 4: ORGANIZATIONAL GROWTH & PODS -->
        <div class="space-y-4 animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/50 pb-3">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <SvgIcon name="Users2" class="size-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">
                    Structured Department Pods
                  </h3>
                  <span class="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                    ORGANIC_EXPANSION
                  </span>
                </div>
                <p class="text-xs text-slate-400">
                  Hierarchical reporting managers · Specialized team pods · Department allocations
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <SvgIcon name="Layers" class="size-3.5" />
              4 Functional Departments Active
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-2.5">
              <span class="text-[10px] font-bold text-emerald-400 uppercase">Engineering</span>
              <p class="text-sm font-bold text-white mt-1">14 Engineers</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Lead: Alex Chen</p>
              <div class="mt-2 h-1 w-full rounded-full bg-emerald-950">
                <div class="h-full rounded-full bg-emerald-400 w-4/5"></div>
              </div>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-2.5">
              <span class="text-[10px] font-bold text-cyan-400 uppercase">People &amp; Culture</span>
              <p class="text-sm font-bold text-white mt-1">6 Specialists</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Lead: Priya Patel</p>
              <div class="mt-2 h-1 w-full rounded-full bg-emerald-950">
                <div class="h-full rounded-full bg-cyan-400 w-3/5"></div>
              </div>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-2.5">
              <span class="text-[10px] font-bold text-amber-400 uppercase">Revenue Ops</span>
              <p class="text-sm font-bold text-white mt-1">8 Executives</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Lead: David Kim</p>
              <div class="mt-2 h-1 w-full rounded-full bg-emerald-950">
                <div class="h-full rounded-full bg-amber-400 w-2/3"></div>
              </div>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-2.5">
              <span class="text-[10px] font-bold text-purple-400 uppercase">Product &amp; UX</span>
              <p class="text-sm font-bold text-white mt-1">7 Designers</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Lead: Maya Lin</p>
              <div class="mt-2 h-1 w-full rounded-full bg-emerald-950">
                <div class="h-full rounded-full bg-purple-400 w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      {:else if activeStageIndex === 4}
        <!-- STAGE 5: DAILY WORKFORCE OPERATIONS -->
        <div class="space-y-4 animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/50 pb-3">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <SvgIcon name="Workflow" class="size-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">
                    Continuous Operational Engine
                  </h3>
                  <span class="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                    PARALLEL_EXECUTION
                  </span>
                </div>
                <p class="text-xs text-slate-400">
                  Attendance telemetry · Gated leave approvals · ATS talent pipeline · Effective payroll
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <SvgIcon name="Clock" class="size-3.5" />
              Real-Time Pulse Live
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-semibold text-emerald-400 uppercase">
                  Time &amp; Shift Engine
                </span>
                <p class="text-sm font-semibold text-white mt-0.5">Global Core (09:00 - 18:00)</p>
                <p class="text-[11px] text-slate-400">Timezone punches · 99.2% on-time</p>
              </div>
              <span class="size-3 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-semibold text-cyan-400 uppercase">
                  Gated Approval Routing
                </span>
                <p class="text-sm font-semibold text-white mt-0.5">Leave Request #LR-1082</p>
                <p class="text-[11px] text-slate-400">Manager: Approved ✓ · HR: Reviewing</p>
              </div>
              <SvgIcon name="FileCheck2" class="size-5 text-cyan-400" />
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-semibold text-purple-400 uppercase">
                  Recruitment &amp; ATS
                </span>
                <p class="text-sm font-semibold text-white mt-0.5">Staff Platform Engineer</p>
                <p class="text-[11px] text-slate-400">24 Candidates · 2 Final Interviews</p>
              </div>
              <SvgIcon name="Briefcase" class="size-5 text-purple-400" />
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-semibold text-amber-400 uppercase">
                  Payroll Ledger Run
                </span>
                <p class="text-sm font-semibold text-white mt-0.5">Gross-to-Net Finalized</p>
                <p class="text-[11px] text-slate-400">Statutory tax deductions locked</p>
              </div>
              <SvgIcon name="Banknote" class="size-5 text-amber-400" />
            </div>
          </div>
        </div>
      {:else if activeStageIndex === 5}
        <!-- STAGE 6: ENTERPRISE INTELLIGENCE -->
        <div class="space-y-4 animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/50 pb-3">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <SvgIcon name="LineChart" class="size-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">
                    Enterprise Command &amp; Strategic BI
                  </h3>
                  <span class="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                    FULL_SCALE_COORDINATION
                  </span>
                </div>
                <p class="text-xs text-slate-400">
                  Workforce capacity metrics · Statutory ledger settlements · Tenant-isolated governance
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/40">
              <SvgIcon name="ShieldCheck" class="size-3.5" />
              100% Postgres RLS Partitioned
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-3">
              <span class="text-[10px] font-bold text-emerald-400 uppercase">Active Workforce</span>
              <p class="text-lg font-extrabold text-white mt-1">248 Members</p>
              <p class="text-[11px] text-emerald-400 mt-0.5">+14% Growth this Quarter</p>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-3">
              <span class="text-[10px] font-bold text-cyan-400 uppercase">Shift Compliance</span>
              <p class="text-lg font-extrabold text-white mt-1">98.6%</p>
              <p class="text-[11px] text-slate-400 mt-0.5">On-Time Clock-Ins</p>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-3">
              <span class="text-[10px] font-bold text-amber-400 uppercase">Payroll Disbursed</span>
              <p class="text-lg font-extrabold text-white mt-1">$1.42M</p>
              <p class="text-[11px] text-amber-400 mt-0.5">Finalized Monthly Run</p>
            </div>

            <div class="rounded-lg border border-emerald-900/40 bg-emerald-950/40 p-3">
              <span class="text-[10px] font-bold text-purple-400 uppercase">Open Requisitions</span>
              <p class="text-lg font-extrabold text-white mt-1">8 Roles</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Active Talent Pipeline</p>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Bottom Subsystem Telemetry & Architecture Pillar Footer -->
    {#if showTelemetry}
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-950/80 pt-3 text-[11px] text-slate-400">
        <div class="flex flex-wrap items-center gap-3">
          <span class="flex items-center gap-1.5 font-semibold text-emerald-400">
            <SvgIcon name="Cpu" class="size-3.5" />
            <span>Architecture Guarantees:</span>
          </span>
          <span class="flex items-center gap-1 text-slate-300">
            <SvgIcon name="CheckCircle2" class="size-3 text-emerald-400" />
            <span>Multi-Tenant RLS</span>
          </span>
          <span class="flex items-center gap-1 text-slate-300">
            <SvgIcon name="CheckCircle2" class="size-3 text-emerald-400" />
            <span>Granular RBAC</span>
          </span>
          <span class="flex items-center gap-1 text-slate-300">
            <SvgIcon name="CheckCircle2" class="size-3 text-emerald-400" />
            <span>Immutable Audit Ledger</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[10px] text-slate-500">Stage {activeStageIndex + 1} of 6</span>
          <button
            type="button"
            onclick={handleNext}
            class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:underline transition-colors"
          >
            <span>Explore Next</span>
            <SvgIcon name="ArrowRight" class="size-3" />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
