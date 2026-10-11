"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  KeyRound,
  Layers,
  Radio,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkforceNetworkHud } from "@/components/hud/workforce-network-hud";

export type AuthMode = "login" | "register" | "forgot-password";

interface AuthCommandCanvasProps {
  mode: AuthMode;
}

export function AuthCommandCanvas({ mode }: AuthCommandCanvasProps) {
  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isRecovery = mode === "forgot-password";

  return (
    <aside
      className="relative hidden lg:flex lg:col-span-5 xl:col-span-5 2xl:col-span-5 flex-col justify-between overflow-y-auto bg-[#04110B] p-6 xl:p-8 2xl:p-10 text-white border-r border-[#153D2A]/70 select-none min-h-screen"
      aria-label="SymphoWork Brand & Architectural Command Canvas"
    >
      {/* ── Layer 1: Architectural Ambient Lighting & Coordinate Grid ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Top-left focused ambient emerald flare */}
        <div className="absolute -top-28 -left-28 size-[420px] rounded-full bg-emerald-500/12 blur-[100px] command-ambient-glow" />

        {/* Center-right focal depth glow */}
        <div className="absolute top-1/2 -right-20 size-[360px] -translate-y-1/2 rounded-full bg-teal-500/10 blur-[90px]" />

        {/* Bottom subtle grounding glow */}
        <div className="absolute -bottom-20 left-1/4 size-[320px] rounded-full bg-emerald-700/12 blur-[100px]" />

        {/* Precision Architectural Grid with Crosshairs */}
        <svg
          className="absolute inset-0 size-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="command-grid-pattern"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 44 0 L 0 0 0 44"
                fill="none"
                stroke="#34D399"
                strokeWidth="0.75"
              />
              <circle cx="0" cy="0" r="0.75" fill="#34D399" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#command-grid-pattern)" />
        </svg>
      </div>

      {/* ── Layer 2: Dedicated Brand Lockup & Dynamic Edition Pill ── */}
      <header className="relative z-10 flex flex-col items-start gap-3.5 shrink-0">
        <Link
          href="/"
          className="group inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl transition-transform hover:scale-[1.01]"
          aria-label="SymphoWork Enterprise Home"
        >
          {/* Prominent Official SymphoWork Artwork */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-xl bg-emerald-500/10 blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
            <Image
              src="/symphowork-logo-white.png"
              alt="SymphoWork"
              width={200}
              height={56}
              priority
              className="relative h-11 xl:h-13 w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
            />
          </div>
        </Link>

        {/* State-Specific Dynamic Telemetry Pill */}
        <div className="relative">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-mono font-medium backdrop-blur-md transition-colors duration-300",
              isLogin &&
                "border-emerald-400/30 bg-emerald-950/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.12)]",
              isRegister &&
                "border-teal-400/30 bg-teal-950/60 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.12)]",
              isRecovery &&
                "border-cyan-400/30 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.12)]"
            )}
          >
            {isLogin && (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                <span className="tracking-wide uppercase">Workforce Command Layer</span>
              </>
            )}
            {isRegister && (
              <>
                <Sparkles className="size-3 text-teal-300 animate-pulse" />
                <span className="tracking-wide uppercase">Workspace Genesis Matrix</span>
              </>
            )}
            {isRecovery && (
              <>
                <RotateCcw className="size-3 text-cyan-300 animate-spin" style={{ animationDuration: "8s" }} />
                <span className="tracking-wide uppercase">Account Recovery Enclave</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Layer 3: Main Dynamic Experience (Synchronized Tri-State) ── */}
      <div className="relative z-10 my-auto py-4 flex-1 flex flex-col justify-center min-h-0">
        {/* STATE A: /login — Workforce Operations Experience */}
        {isLogin && (
          <div className="animate-fade-in flex flex-col gap-3.5">
            <div className="space-y-1.5">
              <h2 className="text-xl xl:text-2xl font-extrabold tracking-tight leading-snug text-white">
                Unified workforce intelligence.{" "}
                <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Complete operational clarity.
                </span>
              </h2>
              <p className="text-xs text-slate-300/80 leading-relaxed max-w-sm">
                Orchestrate employee lifecycles, roster scheduling, and zero-trust policies from a single synchronized command layer.
              </p>
            </div>

            <WorkforceNetworkHud variant="auth" />

            <div className="grid grid-cols-2 gap-2 max-w-sm pt-1">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-1.5 transition-colors hover:border-emerald-500/35">
                <Radio className="size-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-200 truncate">Automated Roster Telemetry</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-1.5 transition-colors hover:border-emerald-500/35">
                <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-200 truncate">Zero-Trust Role Guard</span>
              </div>
            </div>
          </div>
        )}

        {/* STATE B: /register — Organization Genesis Experience */}
        {isRegister && (
          <div className="animate-fade-in flex flex-col gap-3.5">
            <div className="space-y-1.5">
              <h2 className="text-xl xl:text-2xl font-extrabold tracking-tight leading-snug text-white">
                Architect your workspace.{" "}
                <span className="block bg-gradient-to-r from-teal-300 via-emerald-300 to-mint-200 bg-clip-text text-transparent">
                  Empower every team.
                </span>
              </h2>
              <p className="text-xs text-slate-300/80 leading-relaxed max-w-sm">
                Configure organizational boundaries, department hierarchies, and operator roles with instant multi-tenant provisioning.
              </p>
            </div>

            <WorkforceNetworkHud variant="onboarding" />

            <div className="grid grid-cols-2 gap-2 max-w-sm pt-1">
              <div className="flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-950/30 px-2.5 py-1.5 transition-colors hover:border-teal-500/35">
                <Zap className="size-3.5 text-teal-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-200 truncate">Instant Workspace Boot</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-950/30 px-2.5 py-1.5 transition-colors hover:border-teal-500/35">
                <Layers className="size-3.5 text-teal-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-200 truncate">Zero-Leakage Isolation</span>
              </div>
            </div>
          </div>
        )}

        {/* STATE C: /forgot-password — Account Recovery Experience */}
        {isRecovery && (
          <div className="animate-fade-in flex flex-col gap-3.5">
            <div className="space-y-1.5">
              <h2 className="text-xl xl:text-2xl font-extrabold tracking-tight leading-snug text-white">
                Secure account recovery.{" "}
                <span className="block bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  Zero-knowledge dispatch.
                </span>
              </h2>
              <p className="text-xs text-slate-300/80 leading-relaxed max-w-sm">
                Request high-integrity password reset credentials dispatched through zero-knowledge cryptographic authorization channels.
              </p>
            </div>

            <WorkforceNetworkHud variant="recovery" />

            <div className="grid grid-cols-2 gap-2 max-w-sm pt-1">
              <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-950/30 px-2.5 py-1.5 transition-colors hover:border-cyan-500/35">
                <KeyRound className="size-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-200 truncate">Time-Bound Reset Token</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-950/30 px-2.5 py-1.5 transition-colors hover:border-cyan-500/35">
                <ShieldAlert className="size-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-200 truncate">Tamper-Evident Ledger</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Layer 4: Infrastructure & Cryptographic Security Footer ── */}
      <footer className="relative z-10 shrink-0 border-t border-emerald-800/30 pt-3.5 mt-auto">
        <div className="flex flex-col gap-1 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="font-medium text-slate-200">
              {isLogin && "Enterprise cluster active · Zero-trust session guard"}
              {isRegister && "Multi-tenant isolation · Instant workspace genesis"}
              {isRecovery && "Zero-knowledge dispatch · Secure cryptographic recovery"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Continuous compliance monitoring</span>
            <span>© {new Date().getFullYear()} SymphoWork Inc.</span>
          </div>
        </div>
      </footer>
    </aside>
  );
}
