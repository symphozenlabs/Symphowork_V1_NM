<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";
import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface RecoveryPipelineHudProps {
  class?: string;
  showTelemetry?: boolean;
}
let {
  class:className,
  showTelemetry = true,
}:RecoveryPipelineHudProps=$props();
let activeStation=$state<string | null>(untrack(()=>(null)));
const setActiveStation=(next:typeof activeStation|((previous:typeof activeStation)=>typeof activeStation))=>{activeStation=typeof next==="function"?(next as (previous:typeof activeStation)=>typeof activeStation)(activeStation):next;};
const recoveryStations=$derived([
    {
      id: "station-identity",
      number: "01",
      title: "IDENTITY ANCHOR",
      sub: "Email Existence Guard",
      x: 55,
      y: 140,
      icon: "UserCheck",
      badge: "Lookup",
    },
    {
      id: "station-token",
      number: "02",
      title: "TOKEN ENCLAVE",
      sub: "One-Time 15-Min TTL",
      x: 160,
      y: 85,
      icon: "KeyRound",
      badge: "Cryptographic",
    },
    {
      id: "station-dispatch",
      number: "03",
      title: "SECURE DISPATCH",
      sub: "Out-of-Band Envelope",
      x: 265,
      y: 195,
      icon: "Mail",
      badge: "Zero-Knowledge",
    },
    {
      id: "station-rekey",
      number: "04",
      title: "ATOMIC RE-KEY",
      sub: "Session Invalidation",
      x: 365,
      y: 140,
      icon: "RotateCcw",
      badge: "Destination",
    },
  ]);
const railPath=$derived("M 55 140 C 110 140, 110 85, 160 85 C 210 85, 210 195, 265 195 C 320 195, 320 140, 365 140");
</script>
<div class={cn(
        "relative rounded-2xl border border-cyan-500/30 bg-[#020D12]/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden text-white font-sans select-none",
        className
      )} role="region" aria-label="SymphoWork Account Recovery Command Display">
      
      <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full bg-cyan-500/10 blur-[65px]"></div>
        
        <div class="absolute inset-0 bg-[radial-gradient(#06B6D4_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>
      </div>

      
      <div class="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-2">
        <div class="flex items-center gap-2.5">
          <div class="relative flex size-2.5">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span class="relative inline-flex size-2.5 rounded-full bg-cyan-400"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold tracking-wider uppercase text-cyan-300 font-mono">
                Account Recovery Pathway
              </span>
              <span class="rounded bg-cyan-950/90 border border-cyan-500/40 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">
                RECOVERY ENCLAVE
              </span>
            </div>
            <p class="text-[10px] text-slate-400">
              Directional cryptographic password reset rail
            </p>
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/70 px-2.5 py-1 text-[10px] font-mono text-cyan-300">
          <SvgIcon name="ShieldAlert" class="size-3 text-cyan-300 animate-pulse" />
          <span class="font-semibold">CHANNEL: SECURE</span>
        </div>
      </div>

      
      <div class="relative z-10 py-1">
        <svg viewBox="0 0 420 280" class="w-full h-auto overflow-visible" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="recovery-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="blur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>

            
            <linearGradient id="rail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.4"></stop>
              <stop offset="50%" stop-color="#22D3EE" stop-opacity="0.8"></stop>
              <stop offset="100%" stop-color="#10B981" stop-opacity="0.5"></stop>
            </linearGradient>
          </defs>

          
          <path d={railPath} fill="none" stroke="rgba(6,182,212,0.2)" stroke-width="3.5" stroke-linecap="round"></path>
          <path d={railPath} fill="none" stroke="url(#rail-grad)" stroke-width="1.5" stroke-dasharray="6 4" class="hud-rail-dash"></path>

          
          <g filter="url(#recovery-glow)">
            <circle r="4" fill="#22D3EE" class="hud-live-particle">
              <animateMotion dur="3.6s" repeatCount="indefinite" path={railPath}></animateMotion>
            </circle>
          </g>

          
          <circle r="2.5" fill="#67E8F9" class="hud-live-particle opacity-80">
            <animateMotion dur="3.6s" begin="0.3s" repeatCount="indefinite" path={railPath}></animateMotion>
          </circle>

          
          <polygon points="105,108 112,112 105,116" fill="rgba(34,211,238,0.5)"></polygon>
          <polygon points="210,138 217,142 210,146" fill="rgba(34,211,238,0.5)"></polygon>
          <polygon points="315,164 322,168 315,172" fill="rgba(34,211,238,0.5)"></polygon>

          
          {#each recoveryStations as station}{@const isHovered = activeStation === station.id}{@const isTop = station.y < 140}<g transform={`translate(${station.x}, ${station.y})`} class="cursor-pointer" onmouseenter={() => setActiveStation(station.id)} onmouseleave={() => setActiveStation(null)} tabindex={0} role="button" aria-label={`${station.title}: ${station.sub}`} onfocus={() => setActiveStation(station.id)} onblur={() => setActiveStation(null)}>
                
                <circle cx="0" cy="0" r={isHovered ? 18 : 14} fill={isHovered ? "rgba(6,182,212,0.3)" : "rgba(8,47,73,0.85)"} stroke={isHovered ? "#22D3EE" : "rgba(34,211,238,0.6)"} stroke-width={isHovered ? 2 : 1.25} filter={isHovered ? "url(#recovery-glow)" : undefined} class="transition-all duration-200"></circle>

                
                <circle cx="0" cy="0" r="5" fill="#083344"></circle>
                <circle cx="0" cy="0" r="2.5" fill="#67E8F9" class="animate-pulse"></circle>

                
                <text x="0" y={isTop ? -21 : 26} text-anchor="middle" fill={isHovered ? "#FFFFFF" : "#CFFAFE"} font-size="7.5" font-family="monospace" font-weight="700">
                  {station.number}. {station.title}
                </text>
                <text x="0" y={isTop ? -30 : 34} text-anchor="middle" fill="#64748B" font-size="6" font-family="monospace" class={isHovered ? "fill-cyan-300" : ""}>
                  {station.sub}
                </text>
              </g>{/each}
        </svg>
      </div>

      
      <div class="relative z-10 mt-1 rounded-lg border border-cyan-500/20 bg-cyan-950/45 p-2.5 backdrop-blur-xs">
        <div class="flex items-center justify-between text-[11px] mb-2 font-mono">
          <span class="text-cyan-300 font-bold uppercase tracking-wider">
            Atomic Recovery Checklist
          </span>
          <span class="text-cyan-400/90 text-[10px]">
            ZERO-KNOWLEDGE DISPATCH
          </span>
        </div>

        
        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="rounded border border-cyan-500/30 bg-cyan-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span class="text-cyan-300 font-semibold block">1. Identity</span>
            <span class="text-[8px] text-slate-400">Account Valid</span>
          </div>

          <div class="rounded border border-cyan-500/30 bg-cyan-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span class="text-cyan-300 font-semibold block">2. Token</span>
            <span class="text-[8px] text-slate-400">Time-Bound</span>
          </div>

          <div class="rounded border border-cyan-500/30 bg-cyan-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span class="text-cyan-300 font-semibold block">3. Dispatch</span>
            <span class="text-[8px] text-slate-400">Encrypted Email</span>
          </div>

          <div class="rounded border border-cyan-500/20 bg-cyan-950/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span class="text-slate-300 font-semibold block">4. Re-Key</span>
            <span class="text-[8px] text-slate-400">Invalidate Old</span>
          </div>
        </div>
      </div>

      
      {#if showTelemetry}<div class="relative z-10 mt-3 grid grid-cols-3 gap-2 border-t border-cyan-500/20 pt-3 text-center">
          <div class="rounded-md bg-cyan-950/50 border border-cyan-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Token TTL
            </div>
            <div class="text-xs font-bold text-white font-mono">
              15 Minutes
            </div>
          </div>
          <div class="rounded-md bg-cyan-950/50 border border-cyan-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Delivery Channel
            </div>
            <div class="text-xs font-bold text-cyan-300 font-mono">
              Out-of-Band
            </div>
          </div>
          <div class="rounded-md bg-cyan-950/50 border border-cyan-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Audit Trail
            </div>
            <div class="text-xs font-bold text-emerald-300 font-mono">
              Tamper-Proof
            </div>
          </div>
        </div>{/if}
    </div>
