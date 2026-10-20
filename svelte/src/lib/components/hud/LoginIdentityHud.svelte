<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";
import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface LoginIdentityHudProps {
  class?: string;
  showTelemetry?: boolean;
}
let {
  class:className,
  showTelemetry = true,
}:LoginIdentityHudProps=$props();
let activeFactor=$state<string | null>(untrack(()=>(null)));
const setActiveFactor=(next:typeof activeFactor|((previous:typeof activeFactor)=>typeof activeFactor))=>{activeFactor=typeof next==="function"?(next as (previous:typeof activeFactor)=>typeof activeFactor)(activeFactor):next;};
const securityFactors=$derived([
    {
      id: "factor-cred",
      title: "CREDENTIAL DIGEST",
      sub: "Argon2id Salted Hash",
      x: 60,
      y: 60,
      angle: "315°",
      icon: "KeyRound",
    },
    {
      id: "factor-device",
      title: "DEVICE TELEMETRY",
      sub: "HttpOnly Signature",
      x: 360,
      y: 60,
      angle: "045°",
      icon: "Radio",
    },
    {
      id: "factor-policy",
      title: "ZERO-TRUST RBAC",
      sub: "Deterministic Matrix",
      x: 60,
      y: 220,
      angle: "225°",
      icon: "ShieldCheck",
    },
    {
      id: "factor-session",
      title: "SESSION ENCLAVE",
      sub: "Postgres RLS Partition",
      x: 360,
      y: 220,
      angle: "135°",
      icon: "Lock",
    },
  ]);
const cx=$derived(210);
const cy=$derived(140);
</script>
<div class={cn(
        "relative rounded-2xl border border-emerald-500/30 bg-[#030E08]/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden text-white font-sans select-none",
        className
      )} role="region" aria-label="SymphoWork Identity Authentication Command Display">
      
      <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        
        <div class="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 rounded-full bg-emerald-500/15 blur-[60px]"></div>
        
        <div class="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:22px_22px] opacity-10"></div>
      </div>

      
      <div class="relative z-10 flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-2">
        <div class="flex items-center gap-2.5">
          <div class="relative flex size-2.5">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex size-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold tracking-wider uppercase text-emerald-300 font-mono">
                Identity Authentication Gateway
              </span>
              <span class="rounded bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
                ACTIVE SCAN
              </span>
            </div>
            <p class="text-[10px] text-slate-400">
              Concentric zero-trust verification perimeter
            </p>
          </div>
        </div>

        <div class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-2.5 py-1 text-[10px] font-mono text-emerald-300">
          <SvgIcon name="Fingerprint" class="size-3 text-emerald-400 animate-pulse" />
          <span class="font-semibold">SCANNER: ARMED</span>
        </div>
      </div>

      
      <div class="relative z-10 py-1">
        <svg viewBox="0 0 420 280" class="w-full h-auto overflow-visible" xmlns="http://www.w3.org/2000/svg">
          <defs>
            
            <filter id="login-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur"></feGaussianBlur>
              <feMerge>
                <feMergeNode in="blur"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>

            
            <radialGradient id="login-sweep-grad" cx="210" cy="140" r="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#34D399" stop-opacity="0.45"></stop>
              <stop offset="55%" stop-color="#10B981" stop-opacity="0.22"></stop>
              <stop offset="100%" stop-color="#047857" stop-opacity="0"></stop>
            </radialGradient>
          </defs>

          
          
          <circle cx={cx} cy={cy} r="120" fill="none" stroke="rgba(52,211,153,0.14)" stroke-width="1"></circle>
          <circle cx={cx} cy={cy} r="120" fill="none" stroke="rgba(52,211,153,0.35)" stroke-width="1.5" stroke-dasharray="4 28"></circle>

          
          <g>
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="24s" repeatCount="indefinite"></animateTransform>
            <circle cx={cx} cy={cy} r="85" fill="none" stroke="rgba(52,211,153,0.3)" stroke-width="1.25" stroke-dasharray="16 8"></circle>
          </g>

          
          <g>
            <animateTransform attributeName="transform" type="rotate" from={`360 ${cx} ${cy}`} to={`0 ${cx} ${cy}`} dur="16s" repeatCount="indefinite"></animateTransform>
            <circle cx={cx} cy={cy} r="52" fill="none" stroke="rgba(20,184,166,0.4)" stroke-width="1.25" stroke-dasharray="8 6"></circle>
          </g>

          
          <line x1={cx - 128} y1={cy} x2={cx + 128} y2={cy} stroke="rgba(52,211,153,0.15)" stroke-width="0.75" stroke-dasharray="3 3"></line>
          <line x1={cx} y1={cy - 128} x2={cx} y2={cy + 128} stroke="rgba(52,211,153,0.15)" stroke-width="0.75" stroke-dasharray="3 3"></line>

          
          <circle cx={cx} cy={cy} r="24" fill="none" stroke="#34D399" stroke-width="1">
            <animate attributeName="r" values="24;115" dur="3.2s" repeatCount="indefinite"></animate>
            <animate attributeName="opacity" values="0.7;0" dur="3.2s" repeatCount="indefinite"></animate>
          </circle>
          <circle cx={cx} cy={cy} r="24" fill="none" stroke="#6EE7B7" stroke-width="1">
            <animate attributeName="r" values="24;115" begin="1.6s" dur="3.2s" repeatCount="indefinite"></animate>
            <animate attributeName="opacity" values="0.7;0" dur="3.2s" repeatCount="indefinite"></animate>
          </circle>

          
          <g>
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="4.8s" repeatCount="indefinite"></animateTransform>
            
            <path d={`M ${cx} ${cy} L ${cx + 120} ${cy} A 120 120 0 0 0 ${cx + 95} ${cy - 72} Z`} fill="url(#login-sweep-grad)"></path>
            
            <line x1={cx} y1={cy} x2={cx + 120} y2={cy} stroke="#34D399" stroke-width="2" filter="url(#login-glow)"></line>
          </g>

          
          {#each securityFactors as factor}{@const isHovered = activeFactor === factor.id}<g>
                
                <line x1={factor.x} y1={factor.y} x2={cx} y2={cy} stroke={isHovered ? "rgba(52,211,153,0.85)" : "rgba(52,211,153,0.3)"} stroke-width={isHovered ? 2 : 1.25} stroke-dasharray={isHovered ? "none" : "3 3"} class="transition-colors duration-200"></line>

                
                <circle r={isHovered ? 4 : 3} fill="#34D399" filter="url(#login-glow)" class="hud-live-particle">
                  <animateMotion dur="2.0s" repeatCount="indefinite" path={`M ${factor.x} ${factor.y} L ${cx} ${cy}`}></animateMotion>
                </circle>

                
                <circle r="2" fill="#A7F3D0" class="hud-live-particle opacity-80">
                  <animateMotion dur="2.0s" begin="0.35s" repeatCount="indefinite" path={`M ${factor.x} ${factor.y} L ${cx} ${cy}`}></animateMotion>
                </circle>
              </g>{/each}

          
          <g transform={`translate(${cx}, ${cy})`}>
            
            <circle cx="0" cy="0" r="34" fill="rgba(6,78,59,0.25)" stroke="rgba(52,211,153,0.45)" stroke-width="1.25"></circle>
            
            <circle cx="0" cy="0" r="24" fill="rgba(4,42,26,0.95)" stroke="#10B981" stroke-width="2" filter="url(#login-glow)"></circle>
            
            <circle cx="0" cy="0" r="10" fill="#34D399" class="animate-pulse"></circle>
            <circle cx="0" cy="0" r="4" fill="#FFFFFF"></circle>

            
            <text x="0" y="45" text-anchor="middle" fill="#A7F3D0" font-size="8" font-family="monospace" font-weight="700" letter-spacing="0.5">
              IDENTITY GATEWAY
            </text>
            <text x="0" y="54" text-anchor="middle" fill="#6EE7B7" font-size="6.5" font-family="monospace" opacity="0.85">
              ENCLAVE·ZERO-TRUST
            </text>
          </g>

          
          {#each securityFactors as factor}{@const isHovered = activeFactor === factor.id}{@const isTop = factor.y < cy}<g transform={`translate(${factor.x}, ${factor.y})`} class="cursor-pointer" onmouseenter={() => setActiveFactor(factor.id)} onmouseleave={() => setActiveFactor(null)} tabindex={0} role="button" aria-label={`${factor.title}: ${factor.sub}`} onfocus={() => setActiveFactor(factor.id)} onblur={() => setActiveFactor(null)}>
                
                <circle cx="0" cy="0" r={isHovered ? 16 : 13} fill={isHovered ? "rgba(16,185,129,0.35)" : "rgba(6,78,59,0.8)"} stroke={isHovered ? "#34D399" : "rgba(52,211,153,0.6)"} stroke-width={isHovered ? 2 : 1.25} class="transition-all duration-200"></circle>
                
                <circle cx="0" cy="0" r={isHovered ? 5.5 : 4} fill={isHovered ? "#6EE7B7" : "#34D399"}></circle>

                
                <text x="0" y={isTop ? -19 : 24} text-anchor="middle" fill={isHovered ? "#FFFFFF" : "#A7F3D0"} font-size="7.5" font-family="monospace" font-weight="700">
                  {factor.title}
                </text>
                <text x="0" y={isTop ? -27 : 32} text-anchor="middle" fill="#64748B" font-size="6" font-family="monospace" class={isHovered ? "fill-emerald-300" : ""}>
                  {factor.sub}
                </text>
              </g>{/each}
        </svg>
      </div>

      
      <div class="relative z-10 mt-1 rounded-lg border border-emerald-500/20 bg-emerald-950/45 p-2.5 backdrop-blur-xs">
        <div class="flex items-center justify-between text-[11px] mb-2 font-mono">
          <span class="text-emerald-300 font-bold uppercase tracking-wider">
            Verification Sequence
          </span>
          <span class="text-emerald-400/90 text-[10px]">
            LATENCY: 8ms · ZERO-LEAKAGE
          </span>
        </div>

        
        <div class="grid grid-cols-3 gap-1.5 text-center">
          <div class="rounded border border-emerald-500/35 bg-emerald-900/40 py-1.5 px-1 text-[10px] font-mono">
            <div class="flex items-center justify-center gap-1 text-emerald-300 font-semibold">
              <SvgIcon name="CheckCircle2" class="size-3 text-emerald-400" />
              <span>1. Ingest</span>
            </div>
            <span class="text-[8.5px] text-slate-300">Credential Parse</span>
          </div>

          <div class="rounded border border-emerald-500/35 bg-emerald-900/40 py-1.5 px-1 text-[10px] font-mono">
            <div class="flex items-center justify-center gap-1 text-emerald-300 font-semibold">
              <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>2. Verify</span>
            </div>
            <span class="text-[8.5px] text-slate-300">Argon2id Enclave</span>
          </div>

          <div class="rounded border border-emerald-500/20 bg-emerald-950/40 py-1.5 px-1 text-[10px] font-mono">
            <div class="flex items-center justify-center gap-1 text-slate-300 font-semibold">
              <SvgIcon name="Lock" class="size-3 text-emerald-400/70" />
              <span>3. Authorize</span>
            </div>
            <span class="text-[8.5px] text-slate-400">Postgres Session</span>
          </div>
        </div>
      </div>

      
      {#if showTelemetry}<div class="relative z-10 mt-3 grid grid-cols-3 gap-2 border-t border-emerald-500/20 pt-3 text-center">
          <div class="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Session Cipher
            </div>
            <div class="text-xs font-bold text-white font-mono">
              AES-256-GCM
            </div>
          </div>
          <div class="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Role Guard
            </div>
            <div class="text-xs font-bold text-emerald-300 font-mono">
              Zero-Trust
            </div>
          </div>
          <div class="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-1.5">
            <div class="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Token Ingestion
            </div>
            <div class="text-xs font-bold text-teal-300 font-mono">
              HttpOnly
            </div>
          </div>
        </div>{/if}
    </div>
