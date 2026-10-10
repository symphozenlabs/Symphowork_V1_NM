"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Network,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthCommandCanvasProps {
  mode: "login" | "register";
}

export function AuthCommandCanvas({ mode }: AuthCommandCanvasProps) {
  const isLogin = mode === "login";

  return (
    <aside
      className="relative hidden lg:flex lg:col-span-5 xl:col-span-5 2xl:col-span-5 flex-col justify-between overflow-y-auto bg-[#04110B] p-8 xl:p-10 text-white border-r border-[#153D2A]/70 select-none min-h-screen"
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
      <header className="relative z-10 flex flex-col items-start gap-4 shrink-0">
        <Link
          href="/"
          className="group inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl transition-transform hover:scale-[1.01]"
          aria-label="SymphoWork Enterprise Home"
        >
          {/* Prominent Official SymphoWork Artwork with dedicated space */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-xl bg-emerald-500/10 blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
            <Image
              src="/symphowork-logo-white.png"
              alt="SymphoWork"
              width={200}
              height={56}
              priority
              className="relative h-12 xl:h-14 w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
            />
          </div>
        </Link>

        {/* State-Specific Dynamic Telemetry Pill */}
        <div className="relative">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-mono font-medium backdrop-blur-md transition-colors duration-300",
              isLogin
                ? "border-emerald-400/30 bg-emerald-950/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                : "border-teal-400/30 bg-teal-950/50 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.12)]"
            )}
          >
            {isLogin ? (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                <span className="tracking-wide uppercase">Workforce Command Layer</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3 text-teal-300 animate-pulse" />
                <span className="tracking-wide uppercase">Workspace Genesis Matrix</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Layer 3: Main Composition (Synchronized Dual States) ── */}
      <div className="relative z-10 my-auto py-6 flex-1 flex flex-col justify-center min-h-0">
        {/* State A: /login — Workforce Operations Experience */}
        <div
          className={cn(
            "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-4",
            isLogin
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-3 scale-[0.98] pointer-events-none absolute inset-x-0 top-6"
          )}
          aria-hidden={!isLogin}
          inert={!isLogin}
        >
          {/* Headline & Narrative */}
          <div className="space-y-2">
            <h2 className="text-2xl xl:text-[28px] font-extrabold tracking-tight leading-snug text-white">
              Unified workforce intelligence.{" "}
              <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Complete operational clarity.
              </span>
            </h2>
            <p className="text-xs xl:text-sm text-slate-300/80 leading-relaxed max-w-sm">
              Orchestrate employee lifecycles, roster scheduling, and zero-trust policies from a single synchronized command layer.
            </p>
          </div>

          {/* Abstract Workforce Intelligence Matrix Visual */}
          <div className="relative rounded-2xl border border-emerald-500/20 bg-[#081F15]/80 p-3.5 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.35)] overflow-hidden">
            {/* Ambient Background Grid inside Visual */}
            <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

            <div className="relative flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <div className="flex items-center gap-2">
                <Network className="size-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                  Real-Time Workforce Mesh
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/90">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SYNC: OPTIMAL</span>
              </div>
            </div>

            {/* Interactive SVG Network Map */}
            <div className="py-2">
              <svg
                viewBox="0 0 380 110"
                className="w-full h-auto"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Orbital Guide Ring */}
                <circle cx="190" cy="55" r="42" fill="none" stroke="rgba(52,211,153,0.12)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Circuit Grid Rays */}
                <line x1="190" y1="55" x2="60" y2="28" stroke="rgba(52,211,153,0.3)" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="55" x2="320" y2="28" stroke="rgba(52,211,153,0.3)" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="55" x2="75" y2="85" stroke="rgba(52,211,153,0.3)" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="55" x2="305" y2="85" stroke="rgba(52,211,153,0.3)" strokeWidth="1.2" strokeDasharray="3 3" />

                {/* Animated Data Packets along Traces */}
                <circle cx="125" cy="42" r="2.5" fill="#34D399" className="command-data-pulse" />
                <circle cx="255" cy="42" r="2.5" fill="#34D399" className="command-data-pulse" />
                <circle cx="132" cy="70" r="2.5" fill="#34D399" className="command-data-pulse" />
                <circle cx="248" cy="70" r="2.5" fill="#34D399" className="command-data-pulse" />

                {/* Central Command Core */}
                <circle cx="190" cy="55" r="18" fill="rgba(16,185,129,0.1)" stroke="rgba(52,211,153,0.4)" strokeWidth="1" />
                <circle cx="190" cy="55" r="11" fill="rgba(6,78,59,0.6)" stroke="#10B981" strokeWidth="1.5" />
                <circle cx="190" cy="55" r="4" fill="#6EE7B7" />

                {/* Node 1: Roster Lifecycle */}
                <g transform="translate(60, 28)">
                  <circle cx="0" cy="0" r="11" fill="rgba(6,78,59,0.8)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="3.5" fill="#34D399" />
                  <text x="0" y="19" textAnchor="middle" fill="#A7F3D0" fontSize="8" fontFamily="monospace" fontWeight="600">
                    ROSTER
                  </text>
                </g>

                {/* Node 2: Shift Scheduling */}
                <g transform="translate(320, 28)">
                  <circle cx="0" cy="0" r="11" fill="rgba(6,78,59,0.8)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="3.5" fill="#34D399" />
                  <text x="0" y="19" textAnchor="middle" fill="#A7F3D0" fontSize="8" fontFamily="monospace" fontWeight="600">
                    SHIFTS
                  </text>
                </g>

                {/* Node 3: Policy Engine */}
                <g transform="translate(75, 85)">
                  <circle cx="0" cy="0" r="11" fill="rgba(6,78,59,0.8)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="3.5" fill="#34D399" />
                  <text x="0" y="-14" textAnchor="middle" fill="#A7F3D0" fontSize="8" fontFamily="monospace" fontWeight="600">
                    POLICY
                  </text>
                </g>

                {/* Node 4: Compensation / Payroll */}
                <g transform="translate(305, 85)">
                  <circle cx="0" cy="0" r="11" fill="rgba(6,78,59,0.8)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="3.5" fill="#34D399" />
                  <text x="0" y="-14" textAnchor="middle" fill="#A7F3D0" fontSize="8" fontFamily="monospace" fontWeight="600">
                    PAYROLL
                  </text>
                </g>
              </svg>
            </div>

            {/* Live Telemetry Row */}
            <div className="grid grid-cols-3 gap-2 border-t border-emerald-500/15 pt-2 text-center">
              <div className="rounded-md bg-emerald-950/40 py-1 px-1.5">
                <div className="text-[9px] text-slate-400 uppercase">Active Nodes</div>
                <div className="text-xs font-bold text-white font-mono">1,420 Live</div>
              </div>
              <div className="rounded-md bg-emerald-950/40 py-1 px-1.5">
                <div className="text-[9px] text-slate-400 uppercase">Policy Guard</div>
                <div className="text-xs font-bold text-emerald-300 font-mono">Zero-Trust</div>
              </div>
              <div className="rounded-md bg-emerald-950/40 py-1 px-1.5">
                <div className="text-[9px] text-slate-400 uppercase">Sync Latency</div>
                <div className="text-xs font-bold text-teal-300 font-mono">12ms</div>
              </div>
            </div>
          </div>

          {/* Restrained Capability Indicators */}
          <div className="grid grid-cols-2 gap-2.5 max-w-sm">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-2 transition-colors hover:border-emerald-500/35">
              <Radio className="size-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-200 truncate">Automated Roster Telemetry</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-2 transition-colors hover:border-emerald-500/35">
              <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-200 truncate">Zero-Trust Role Guard</span>
            </div>
          </div>
        </div>

        {/* State B: /register — Organization Genesis Experience */}
        <div
          className={cn(
            "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-4",
            !isLogin
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-3 scale-[0.98] pointer-events-none absolute inset-x-0 top-6"
          )}
          aria-hidden={isLogin}
          inert={isLogin}
        >
          {/* Headline & Narrative */}
          <div className="space-y-2">
            <h2 className="text-2xl xl:text-[28px] font-extrabold tracking-tight leading-snug text-white">
              Architect your workspace.{" "}
              <span className="block bg-gradient-to-r from-teal-300 via-emerald-300 to-mint-200 bg-clip-text text-transparent">
                Empower every team.
              </span>
            </h2>
            <p className="text-xs xl:text-sm text-slate-300/80 leading-relaxed max-w-sm">
              Configure organizational boundaries, department hierarchies, and operator roles with instant multi-tenant provisioning.
            </p>
          </div>

          {/* Abstract Organization Genesis Blueprint Visual */}
          <div className="relative rounded-2xl border border-teal-500/20 bg-[#081F17]/80 p-3.5 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.35)] overflow-hidden">
            {/* Ambient Isometric Blueprint Grid inside Visual */}
            <div className="absolute inset-0 bg-[radial-gradient(#14B8A6_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

            <div className="relative flex items-center justify-between border-b border-teal-500/15 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="size-3.5 text-teal-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">
                  Workspace Genesis Blueprint
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-400/90">
                <span className="size-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>TENANT: READY</span>
              </div>
            </div>

            {/* Architectural Isometric Hierarchy SVG */}
            <div className="py-2">
              <svg
                viewBox="0 0 380 110"
                className="w-full h-auto"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Expanding Structural Blueprint Vectors */}
                <line x1="190" y1="22" x2="80" y2="64" stroke="rgba(20,184,166,0.35)" strokeWidth="1.5" />
                <line x1="190" y1="22" x2="190" y2="66" stroke="rgba(20,184,166,0.35)" strokeWidth="1.5" />
                <line x1="190" y1="22" x2="300" y2="64" stroke="rgba(20,184,166,0.35)" strokeWidth="1.5" />

                {/* Branch Connections to Pods */}
                <line x1="80" y1="64" x2="50" y2="98" stroke="rgba(20,184,166,0.25)" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="80" y1="64" x2="110" y2="98" stroke="rgba(20,184,166,0.25)" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="300" y1="64" x2="270" y2="98" stroke="rgba(20,184,166,0.25)" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="300" y1="64" x2="330" y2="98" stroke="rgba(20,184,166,0.25)" strokeWidth="1" strokeDasharray="2 2" />

                {/* Organization Root Hub */}
                <g transform="translate(190, 22)">
                  <polygon points="0,-12 12,0 0,12 -12,0" fill="rgba(19,78,74,0.8)" stroke="#2DD4BF" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="3" fill="#A7F3D0" />
                  <text x="0" y="-16" textAnchor="middle" fill="#CCFBF1" fontSize="8" fontFamily="monospace" fontWeight="700">
                    ENTERPRISE ROOT
                  </text>
                </g>

                {/* Department Node A: Operations */}
                <g transform="translate(80, 64)">
                  <rect x="-13" y="-9" width="26" height="18" rx="4" fill="rgba(19,78,74,0.7)" stroke="rgba(45,212,191,0.5)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="2.5" fill="#2DD4BF" />
                  <text x="0" y="18" textAnchor="middle" fill="#99F6E4" fontSize="7.5" fontFamily="monospace">
                    OPERATIONS
                  </text>
                </g>

                {/* Department Node B: Tech & Core */}
                <g transform="translate(190, 66)">
                  <rect x="-13" y="-9" width="26" height="18" rx="4" fill="rgba(19,78,74,0.7)" stroke="rgba(45,212,191,0.5)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="2.5" fill="#2DD4BF" />
                  <text x="0" y="18" textAnchor="middle" fill="#99F6E4" fontSize="7.5" fontFamily="monospace">
                    TECH & CORE
                  </text>
                </g>

                {/* Department Node C: People & HR */}
                <g transform="translate(300, 64)">
                  <rect x="-13" y="-9" width="26" height="18" rx="4" fill="rgba(19,78,74,0.7)" stroke="rgba(45,212,191,0.5)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="2.5" fill="#2DD4BF" />
                  <text x="0" y="18" textAnchor="middle" fill="#99F6E4" fontSize="7.5" fontFamily="monospace">
                    PEOPLE & HR
                  </text>
                </g>

                {/* Sub-node leaves */}
                <circle cx="50" cy="98" r="3" fill="rgba(45,212,191,0.5)" />
                <circle cx="110" cy="98" r="3" fill="rgba(45,212,191,0.5)" />
                <circle cx="270" cy="98" r="3" fill="rgba(45,212,191,0.5)" />
                <circle cx="330" cy="98" r="3" fill="rgba(45,212,191,0.5)" />
              </svg>
            </div>

            {/* Live Genesis Configuration Row */}
            <div className="grid grid-cols-3 gap-2 border-t border-teal-500/15 pt-2 text-center">
              <div className="rounded-md bg-teal-950/40 py-1 px-1.5">
                <div className="text-[9px] text-slate-400 uppercase">Topology</div>
                <div className="text-xs font-bold text-white font-mono">Multi-Tier</div>
              </div>
              <div className="rounded-md bg-teal-950/40 py-1 px-1.5">
                <div className="text-[9px] text-slate-400 uppercase">Isolation</div>
                <div className="text-xs font-bold text-teal-300 font-mono">Dedicated</div>
              </div>
              <div className="rounded-md bg-teal-950/40 py-1 px-1.5">
                <div className="text-[9px] text-slate-400 uppercase">Scaling</div>
                <div className="text-xs font-bold text-emerald-300 font-mono">Uncapped</div>
              </div>
            </div>
          </div>

          {/* Restrained Capability Indicators */}
          <div className="grid grid-cols-2 gap-2.5 max-w-sm">
            <div className="flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-950/30 px-2.5 py-2 transition-colors hover:border-teal-500/35">
              <Zap className="size-3.5 text-teal-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-200 truncate">Instant Workspace Boot</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-950/30 px-2.5 py-2 transition-colors hover:border-teal-500/35">
              <Layers className="size-3.5 text-teal-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-200 truncate">Zero-Leakage Isolation</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Layer 4: Infrastructure & Cryptographic Security Footer ── */}
      <footer className="relative z-10 shrink-0 border-t border-emerald-800/30 pt-4 mt-auto">
        <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="font-medium text-slate-200">
              {isLogin
                ? "Enterprise cluster active · Zero-trust session guard"
                : "Multi-tenant isolation · Instant workspace genesis"}
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
