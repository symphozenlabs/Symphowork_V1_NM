<script lang="ts">
import type {Snippet} from 'svelte';
let{title,description,platform=false,children,footer}:{title:string;description:string;platform?:boolean;children:Snippet;footer?:Snippet}=$props();
const isPlatformConsole=$derived(platform||title.toLowerCase().includes('console')||description.toLowerCase().includes('platform'));

import SvgIcon from "$lib/components/ui/Icon.svelte";


</script>
<div class="min-h-screen w-full lg:grid lg:grid-cols-12 bg-background">
      
      <div class="relative hidden lg:col-span-5 lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-[#0D3324] via-[#174734] to-[#0A261B] p-8 xl:p-12 text-white overflow-hidden shadow-2xl">
        
        <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div class="auth-ambient-mesh absolute -inset-[20%] opacity-40"></div>
          <div class="auth-ambient-orb-1 absolute -top-24 -left-24 size-80 xl:size-96 rounded-full bg-emerald-400/20 blur-3xl"></div>
          <div class="auth-ambient-orb-2 absolute top-1/2 -right-24 size-72 xl:size-80 rounded-full bg-emerald-300/15 blur-3xl"></div>
          <div class="auth-ambient-orb-3 absolute -bottom-24 left-1/4 size-80 xl:size-96 rounded-full bg-accent/25 blur-3xl"></div>
        </div>

        
        <div class="relative z-10 space-y-4 xl:space-y-5 shrink-0">
          <a href="/" class="group inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl transition-transform hover:scale-[1.02]" aria-label="SymphoWork Home">
            <img src="/symphowork-logo-white.png" alt="SymphoWork" width={240} height={80} class="h-14 xl:h-18 w-auto object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]" />
          </a>

          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
              <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                {#if isPlatformConsole}{"Platform Multi-Tenant Cluster Console"}{:else}{"Enterprise Human Capital Management"}{/if}
              </span>
            </div>
          </div>
        </div>

        
        <div class="relative z-10 space-y-6 xl:space-y-8 my-auto py-4 xl:py-6">
          <div class="space-y-2.5">
            <h2 class="text-2xl font-extrabold tracking-tight text-white xl:text-3xl leading-tight">
              {#if isPlatformConsole}{"Unified control over multi-tenant infrastructure."}{:else}{"Transform workforce operations with certainty."}{/if}
            </h2>
            <p class="text-xs xl:text-sm text-slate-200/90 leading-relaxed max-w-md">
              {#if isPlatformConsole}{"Enterprise orchestration for workspace provisioning, commercial subscription tiers, system telemetry, and governance audit trails."}{:else}{"A unified platform orchestrating employee lifecycles, attendance tracking, shift scheduling, automated leave policies, and payroll."}{/if}
            </p>
          </div>

          
          <div class="space-y-3 xl:space-y-3.5 max-w-md">
            {#if isPlatformConsole}
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <SvgIcon name="CheckCircle2" class="size-3.5" />
                  </div>
                  <p class="text-xs text-slate-200">
                    <strong class="text-white">Tenant Isolation:</strong> Strict Postgres row-level security boundaries across organizations
                  </p>
                </div>
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <SvgIcon name="CheckCircle2" class="size-3.5" />
                  </div>
                  <p class="text-xs text-slate-200">
                    <strong class="text-white">Commercial Engine:</strong> Modular feature entitlements, pricing tiers, and quota enforcement
                  </p>
                </div>
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <SvgIcon name="CheckCircle2" class="size-3.5" />
                  </div>
                  <p class="text-xs text-slate-200">
                    <strong class="text-white">Audit & Governance:</strong> Tamper-evident ledger logging all privileged operator changes
                  </p>
                </div>
              {:else}
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <SvgIcon name="CheckCircle2" class="size-3.5" />
                  </div>
                  <p class="text-xs text-slate-200">
                    <strong class="text-white">Workforce Lifecycle:</strong> End-to-end recruitment, onboarding, directory, and employee records
                  </p>
                </div>
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <SvgIcon name="CheckCircle2" class="size-3.5" />
                  </div>
                  <p class="text-xs text-slate-200">
                    <strong class="text-white">Time & Compensation:</strong> Automated shift attendance, leave workflows, and payroll runs
                  </p>
                </div>
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <SvgIcon name="CheckCircle2" class="size-3.5" />
                  </div>
                  <p class="text-xs text-slate-200">
                    <strong class="text-white">Enterprise Security:</strong> Role-based access control, encrypted sessions, and privacy safeguards
                  </p>
                </div>
              {/if}
          </div>
        </div>

        
        <div class="relative z-10 border-t border-white/10 pt-4 xl:pt-5 shrink-0">
          <div class="flex items-center gap-2 text-xs text-slate-300">
            <SvgIcon name="ShieldCheck" class="size-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>High-integrity enterprise architecture · Zero-trust role enforcement</span>
          </div>
          <p class="mt-1.5 text-[11px] text-slate-400">
            © {new Date().getFullYear()} SymphoWork Inc. All rights reserved.
          </p>
        </div>
      </div>

      
      <div class="flex min-h-screen flex-col justify-between p-6 sm:p-10 lg:col-span-7 lg:p-12 xl:p-16 bg-gradient-to-b from-[#F7F8FB] to-[#F1F5F0]">
        
        <div class="w-full lg:hidden text-center pb-6">
          <a href="/" class="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-opacity hover:opacity-90" aria-label="SymphoWork Home">
            <img src="/symphowork-logo.png" alt="SymphoWork" width={180} height={56} class="h-14 sm:h-16 w-auto object-contain" />
          </a>
        </div>

        
        <div class="mx-auto my-auto w-full max-w-lg">
          <div class="rounded-2xl border border-[#DCE6DA] bg-surface p-6 sm:p-10 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
            <header class="space-y-2">
              <div class="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                <SvgIcon name="Lock" class="size-3 text-primary" aria-hidden="true" />
                <span>
                  {#if isPlatformConsole}{"Platform Administration"}{:else}{"Secure Identity Gateway"}{/if}
                </span>
              </div>
              <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              <p class="text-sm leading-relaxed text-muted">{description}</p>
            </header>

            <div class="mt-6">{@render children?.()}</div>

            {#if footer}<div class="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted">
                {@render footer?.()}
              </div>{/if}
          </div>

          
          <div class="mt-6 flex items-center justify-center gap-2 text-xs text-muted lg:hidden">
            <SvgIcon name="ShieldCheck" class="size-3.5 text-primary" aria-hidden="true" />
            <span>Enterprise-grade security · SOC 2 compliant architecture</span>
          </div>
        </div>

        
        <footer class="text-center text-xs text-muted pt-6">
          <p>© {new Date().getFullYear()} SymphoWork Inc. High-integrity workforce operations.</p>
        </footer>
      </div>
    </div>
