<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";
import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface RegisterOnboardingHudProps {
  class?: string;
  showTelemetry?: boolean;
}
let {
  class:className,
  showTelemetry = true,
}:RegisterOnboardingHudProps=$props();
let activeDepartment=$state<string | null>(untrack(()=>(null)));
const setActiveDepartment=(next:typeof activeDepartment|((previous:typeof activeDepartment)=>typeof activeDepartment))=>{activeDepartment=typeof next==="function"?(next as (previous:typeof activeDepartment)=>typeof activeDepartment)(activeDepartment):next;};
const departments=$derived([
    {
      id: "dept-ops",
      title: "OPERATIONS",
      sub: "Workforce & Logistics",
      x: 80,
      y: 125,
      members: "12 Members",
      color: "#2DD4BF",
    },
    {
      id: "dept-tech",
      title: "TECH & CORE",
      sub: "Platform & Systems",
      x: 210,
      y: 125,
      members: "24 Members",
      color: "#34D399",
    },
    {
      id: "dept-people",
      title: "PEOPLE & HR",
      sub: "Talent & Culture",
      x: 340,
      y: 125,
      members: "8 Members",
      color: "#14B8A6",
    },
  ]);
const joiningMembers=$derived([
    { id: "m-1", label: "MEMBER #1", targetX: 80, x: 50, y: 220, role: "Operator" },
    { id: "m-2", label: "MEMBER #2", targetX: 80, x: 110, y: 220, role: "Supervisor" },
    { id: "m-3", label: "NEW OPERATOR", targetX: 210, x: 210, y: 225, role: "Admin Tier", isPrimary: true },
    { id: "m-4", label: "MEMBER #3", targetX: 340, x: 310, y: 220, role: "Specialist" },
    { id: "m-5", label: "MEMBER #4", targetX: 340, x: 370, y: 220, role: "Analyst" },
  ]);
const rootX=$derived(210);
const rootY=$derived(40);
</script>
<div class={cn(
        "relative rounded-2xl border border-teal-500/30 bg-[#020F0A]/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden text-white font-sans select-none",
        className
      )} role="region" aria-label="SymphoWork Workforce Onboarding Command Display">
      
      <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div class="absolute top-12 left-1/2 -translate-x-1/2 size-72 rounded-full bg-teal-500/12 blur-[65px]"></div>
        
        <div class="absolute inset-0 bg-[radial-gradient(#14B8A6_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
      </div>

      
      <div class="relative z-10 flex items-center justify-between border-b border-teal-500/20 pb-3 mb-2">
        <div class="flex items-center gap-2.5">
          <div class="relative flex size-2.5">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
            <span class="relative inline-flex size-2.5 rounded-full bg-teal-400"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold tracking-wider uppercase text-teal-300 font-mono">
                Workforce Onboarding Tree
              </span>
              <span class="rounded bg-teal-950/90 border border-teal-500/40 px-1.5 py-0.5 text-[9px] font-mono text-teal-300">
                GENESIS
              </span>
            </div>
            <p class="text-[10px] text-slate-400">
              Hierarchical organization mapping & tenant setup
            </p>
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-950/70 px-2.5 py-1 text-[10px] font-mono text-teal-300">
          <SvgIcon name="Sparkles" class="size-3 text-teal-300 animate-pulse" />
          <span class="font-semibold">TENANT: EXPANDING</span>
        </div>
      </div>

      
      <div class="relative z-10 py-1">
        <svg viewBox="0 0 420 280" class="w-full h-auto overflow-visible" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="onboard-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="blur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
          </defs>

          
          <line x1={rootX} y1={rootY + 16} x2={departments[0].x} y2={departments[0].y - 14} stroke="rgba(45,212,191,0.35)" stroke-width="1.5" stroke-dasharray="3 3"></line>
          <line x1={rootX} y1={rootY + 16} x2={departments[1].x} y2={departments[1].y - 14} stroke="rgba(45,212,191,0.5)" stroke-width="1.5" stroke-dasharray="3 3"></line>
          <line x1={rootX} y1={rootY + 16} x2={departments[2].x} y2={departments[2].y - 14} stroke="rgba(45,212,191,0.35)" stroke-width="1.5" stroke-dasharray="3 3"></line>

          
          <circle r="2.5" fill="#2DD4BF" filter="url(#onboard-glow)" class="hud-live-particle">
            <animateMotion dur="2.4s" repeatCount="indefinite" path={`M ${rootX} ${rootY + 16} L ${departments[0].x} ${departments[0].y - 14}`}></animateMotion>
          </circle>
          <circle r="3" fill="#34D399" filter="url(#onboard-glow)" class="hud-live-particle">
            <animateMotion dur="1.9s" repeatCount="indefinite" path={`M ${rootX} ${rootY + 16} L ${departments[1].x} ${departments[1].y - 14}`}></animateMotion>
          </circle>
          <circle r="2.5" fill="#2DD4BF" filter="url(#onboard-glow)" class="hud-live-particle">
            <animateMotion dur="2.6s" repeatCount="indefinite" path={`M ${rootX} ${rootY + 16} L ${departments[2].x} ${departments[2].y - 14}`}></animateMotion>
          </circle>

          
          {#each joiningMembers as m}<g>
              <line x1={m.targetX} y1={140} x2={m.x} y2={m.y - 10} stroke={m.isPrimary ? "rgba(45,212,191,0.6)" : "rgba(45,212,191,0.25)"} stroke-width={m.isPrimary ? 1.5 : 1} stroke-dasharray="2 2"></line>
              
              <circle r={m.isPrimary ? 3 : 2} fill="#5EEAD4" class="hud-live-particle">
                <animateMotion dur={`${2.1 + (m.x % 3) * 0.4}s`} repeatCount="indefinite" path={`M ${m.x} ${m.y - 10} L ${m.targetX} 140`}></animateMotion>
              </circle>
            </g>{/each}

          
          <g transform={`translate(${rootX}, ${rootY})`}>
            
            <polygon points="0,-18 20,0 0,18 -20,0" fill="rgba(19,78,74,0.85)" stroke="#2DD4BF" stroke-width="1.75" filter="url(#onboard-glow)"></polygon>
            <circle cx="0" cy="0" r="4.5" fill="#A7F3D0" class="animate-pulse"></circle>

            <text x="0" y="-24" text-anchor="middle" fill="#CCFBF1" font-size="8" font-family="monospace" font-weight="700">
              TENANT ROOT
            </text>
            <text x="0" y="30" text-anchor="middle" fill="#99F6E4" font-size="6.5" font-family="monospace" opacity="0.8">
              ORGANIZATION BOUNDARY
            </text>
          </g>

          
          {#each departments as dept}{@const isHovered = activeDepartment === dept.id}<g transform={`translate(${dept.x}, ${dept.y})`} class="cursor-pointer" onmouseenter={() => setActiveDepartment(dept.id)} onmouseleave={() => setActiveDepartment(null)} tabindex={0} role="button" aria-label={`${dept.title}: ${dept.sub}`} onfocus={() => setActiveDepartment(dept.id)} onblur={() => setActiveDepartment(null)}>
                
                <rect x="-36" y="-14" width="72" height="28" rx="6" fill={isHovered ? "rgba(19,78,74,0.9)" : "rgba(15,48,40,0.85)"} stroke={isHovered ? "#5EEAD4" : "rgba(45,212,191,0.5)"} stroke-width={isHovered ? 1.75 : 1} class="transition-colors duration-200"></rect>

                <circle cx="-24" cy="0" r="3" fill="#2DD4BF"></circle>
                <text x="4" y="-2" text-anchor="middle" fill="#FFFFFF" font-size="7" font-family="monospace" font-weight="700">
                  {dept.title}
                </text>
                <text x="4" y="7" text-anchor="middle" fill="#99F6E4" font-size="5.5" font-family="monospace" opacity="0.8">
                  {dept.members}
                </text>
              </g>{/each}

          
          {#each joiningMembers as m}<g transform={`translate(${m.x}, ${m.y})`}>
                
                {#if m.isPrimary}<circle cx="0" cy="0" r="15" fill="none" stroke="rgba(45,212,191,0.4)" stroke-width="1" class="animate-ping" style:animation-duration={"2.8s"}></circle>{/if}

                
                <circle cx="0" cy="0" r={m.isPrimary ? 10 : 7} fill={m.isPrimary ? "rgba(19,78,74,0.95)" : "rgba(13,56,48,0.85)"} stroke={m.isPrimary ? "#5EEAD4" : "rgba(45,212,191,0.6)"} stroke-width={m.isPrimary ? 2 : 1.25} filter={m.isPrimary ? "url(#onboard-glow)" : undefined}></circle>
                <circle cx="0" cy="0" r={m.isPrimary ? 3.5 : 2} fill="#A7F3D0"></circle>

                <text x="0" y={m.isPrimary ? 20 : 16} text-anchor="middle" fill={m.isPrimary ? "#CCFBF1" : "#99F6E4"} font-size={m.isPrimary ? "7" : "6"} font-family="monospace" font-weight="700">
                  {m.label}
                </text>
                <text x="0" y={m.isPrimary ? 27 : 23} text-anchor="middle" fill="#64748B" font-size="5.5" font-family="monospace">
                  {m.role}
                </text>
              </g>{/each}
        </svg>
      </div>

      
      <div class="relative z-10 mt-1 rounded-lg border border-teal-500/20 bg-teal-950/45 p-2.5 backdrop-blur-xs">
        <div class="flex items-center justify-between text-[11px] mb-2 font-mono">
          <span class="text-teal-300 font-bold uppercase tracking-wider">
            Workspace Provisioning Blueprint
          </span>
          <span class="text-teal-400/90 text-[10px]">
            TOPOLOGY: MULTI-TIER TREE
          </span>
        </div>

        
        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="rounded border border-teal-500/30 bg-teal-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span class="text-teal-300 font-semibold block">1. Tenant</span>
            <span class="text-[8px] text-slate-400">Postgres RLS</span>
          </div>

          <div class="rounded border border-teal-500/30 bg-teal-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span class="text-teal-300 font-semibold block">2. Tree</span>
            <span class="text-[8px] text-slate-400">Departments</span>
          </div>

          <div class="rounded border border-teal-500/30 bg-teal-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span class="text-teal-300 font-semibold block">3. Ingest</span>
            <span class="text-[8px] text-slate-400">Operator Genesis</span>
          </div>

          <div class="rounded border border-teal-500/20 bg-teal-950/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span class="text-slate-300 font-semibold block">4. Bind</span>
            <span class="text-[8px] text-slate-400">RBAC Grants</span>
          </div>
        </div>
      </div>

      
      {#if showTelemetry}<div class="relative z-10 mt-3 grid grid-cols-3 gap-2 border-t border-teal-500/20 pt-3 text-center">
          <div class="rounded-md bg-teal-950/50 border border-teal-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Topology
            </div>
            <div class="text-xs font-bold text-white font-mono">
              Hierarchical
            </div>
          </div>
          <div class="rounded-md bg-teal-950/50 border border-teal-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Isolation
            </div>
            <div class="text-xs font-bold text-teal-300 font-mono">
              Dedicated
            </div>
          </div>
          <div class="rounded-md bg-teal-950/50 border border-teal-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Member Ingest
            </div>
            <div class="text-xs font-bold text-emerald-300 font-mono">
              Instant
            </div>
          </div>
        </div>{/if}
    </div>
