"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Lock,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginIdentityHudProps {
  className?: string;
  showTelemetry?: boolean;
}

export function LoginIdentityHud({
  className,
  showTelemetry = true,
}: LoginIdentityHudProps) {
  const [activeFactor, setActiveFactor] = useState<string | null>(null);

  const securityFactors = [
    {
      id: "factor-cred",
      title: "CREDENTIAL DIGEST",
      sub: "Argon2id Salted Hash",
      x: 60,
      y: 60,
      angle: "315°",
      icon: KeyRound,
    },
    {
      id: "factor-device",
      title: "DEVICE TELEMETRY",
      sub: "HttpOnly Signature",
      x: 360,
      y: 60,
      angle: "045°",
      icon: Radio,
    },
    {
      id: "factor-policy",
      title: "ZERO-TRUST RBAC",
      sub: "Deterministic Matrix",
      x: 60,
      y: 220,
      angle: "225°",
      icon: ShieldCheck,
    },
    {
      id: "factor-session",
      title: "SESSION ENCLAVE",
      sub: "Postgres RLS Partition",
      x: 360,
      y: 220,
      angle: "135°",
      icon: Lock,
    },
  ];

  const cx = 210;
  const cy = 140;

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-emerald-500/30 bg-[#030E08]/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden text-white font-sans select-none",
        className
      )}
      role="region"
      aria-label="SymphoWork Identity Authentication Command Display"
    >
      {/* ── Background: Deep Radar Grid & Ambient Core Flare ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Core focal flare */}
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 rounded-full bg-emerald-500/15 blur-[60px]" />
        {/* Radar crosshairs & coordinate ring texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:22px_22px] opacity-10" />
      </div>

      {/* ── Top Bar: Gateway Telemetry & Verification Mode ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-300 font-mono">
                Identity Authentication Gateway
              </span>
              <span className="rounded bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400">
                ACTIVE SCAN
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Concentric zero-trust verification perimeter
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-2.5 py-1 text-[10px] font-mono text-emerald-300">
          <Fingerprint className="size-3 text-emerald-400 animate-pulse" />
          <span className="font-semibold">SCANNER: ARMED</span>
        </div>
      </div>

      {/* ── Concentric Security Core SVG Visualization ── */}
      <div className="relative z-10 py-1">
        <svg
          viewBox="0 0 420 280"
          className="w-full h-auto overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow Filter */}
            <filter id="login-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* High-Contrast Radar Sweep Gradient */}
            <radialGradient id="login-sweep-grad" cx="210" cy="140" r="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ── Concentric Security Rings Layer ── */}
          {/* Static Outer Scope Ring (Radius 120) with Angular Notches */}
          <circle
            cx={cx}
            cy={cy}
            r="120"
            fill="none"
            stroke="rgba(52,211,153,0.14)"
            strokeWidth="1"
          />
          <circle
            cx={cx}
            cy={cy}
            r="120"
            fill="none"
            stroke="rgba(52,211,153,0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 28"
          />

          {/* Middle Verification Orbit (Radius 85) with Clockwise Restrained Rotation */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="24s"
              repeatCount="indefinite"
            />
            <circle
              cx={cx}
              cy={cy}
              r="85"
              fill="none"
              stroke="rgba(52,211,153,0.3)"
              strokeWidth="1.25"
              strokeDasharray="16 8"
            />
          </g>

          {/* Inner Cryptographic Shield Orbit (Radius 52) with Counter-Clockwise Rotation */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`360 ${cx} ${cy}`}
              to={`0 ${cx} ${cy}`}
              dur="16s"
              repeatCount="indefinite"
            />
            <circle
              cx={cx}
              cy={cy}
              r="52"
              fill="none"
              stroke="rgba(20,184,166,0.4)"
              strokeWidth="1.25"
              strokeDasharray="8 6"
            />
          </g>

          {/* Crosshair Coordinate Rays */}
          <line x1={cx - 128} y1={cy} x2={cx + 128} y2={cy} stroke="rgba(52,211,153,0.15)" strokeWidth="0.75" strokeDasharray="3 3" />
          <line x1={cx} y1={cy - 128} x2={cx} y2={cy + 128} stroke="rgba(52,211,153,0.15)" strokeWidth="0.75" strokeDasharray="3 3" />

          {/* ── Concentric Sonar Pulses from Gateway Center ── */}
          <circle cx={cx} cy={cy} r="24" fill="none" stroke="#34D399" strokeWidth="1">
            <animate attributeName="r" values="24;115" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r="24" fill="none" stroke="#6EE7B7" strokeWidth="1">
            <animate attributeName="r" values="24;115" begin="1.6s" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="3.2s" repeatCount="indefinite" />
          </circle>

          {/* ── Active Rotating Radar Scanning Beam ── */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="4.8s"
              repeatCount="indefinite"
            />
            {/* Luminous Triangular Sweep Sector */}
            <path
              d={`M ${cx} ${cy} L ${cx + 120} ${cy} A 120 120 0 0 0 ${cx + 95} ${cy - 72} Z`}
              fill="url(#login-sweep-grad)"
            />
            {/* Bright Scanning Beam Line */}
            <line
              x1={cx}
              y1={cy}
              x2={cx + 120}
              y2={cy}
              stroke="#34D399"
              strokeWidth="2"
              filter="url(#login-glow)"
            />
          </g>

          {/* ── Inward Authentication Signals & Particles ── */}
          {securityFactors.map((factor) => {
            const isHovered = activeFactor === factor.id;
            return (
              <g key={`sig-${factor.id}`}>
                {/* Guide Trace from Factor into Core */}
                <line
                  x1={factor.x}
                  y1={factor.y}
                  x2={cx}
                  y2={cy}
                  stroke={isHovered ? "rgba(52,211,153,0.85)" : "rgba(52,211,153,0.3)"}
                  strokeWidth={isHovered ? 2 : 1.25}
                  strokeDasharray={isHovered ? "none" : "3 3"}
                  className="transition-colors duration-200"
                />

                {/* Primary Fast Inward Ingestion Particle */}
                <circle
                  r={isHovered ? 4 : 3}
                  fill="#34D399"
                  filter="url(#login-glow)"
                  className="hud-live-particle"
                >
                  <animateMotion
                    dur="2.0s"
                    repeatCount="indefinite"
                    path={`M ${factor.x} ${factor.y} L ${cx} ${cy}`}
                  />
                </circle>

                {/* Secondary Trailing Signal */}
                <circle
                  r="2"
                  fill="#A7F3D0"
                  className="hud-live-particle opacity-80"
                >
                  <animateMotion
                    dur="2.0s"
                    begin="0.35s"
                    repeatCount="indefinite"
                    path={`M ${factor.x} ${factor.y} L ${cx} ${cy}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* ── Central Gateway Core Enclave ── */}
          <g transform={`translate(${cx}, ${cy})`}>
            {/* Outer Protective Vault Halo */}
            <circle
              cx="0"
              cy="0"
              r="34"
              fill="rgba(6,78,59,0.25)"
              stroke="rgba(52,211,153,0.45)"
              strokeWidth="1.25"
            />
            {/* Solid Vault Core Body */}
            <circle
              cx="0"
              cy="0"
              r="24"
              fill="rgba(4,42,26,0.95)"
              stroke="#10B981"
              strokeWidth="2"
              filter="url(#login-glow)"
            />
            {/* Pulsing Luminous Heart */}
            <circle cx="0" cy="0" r="10" fill="#34D399" className="animate-pulse" />
            <circle cx="0" cy="0" r="4" fill="#FFFFFF" />

            {/* Core Badging */}
            <text
              x="0"
              y="45"
              textAnchor="middle"
              fill="#A7F3D0"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="700"
              letterSpacing="0.5"
            >
              IDENTITY GATEWAY
            </text>
            <text
              x="0"
              y="54"
              textAnchor="middle"
              fill="#6EE7B7"
              fontSize="6.5"
              fontFamily="monospace"
              opacity="0.85"
            >
              ENCLAVE·ZERO-TRUST
            </text>
          </g>

          {/* ── Perimeter Security Factors ── */}
          {securityFactors.map((factor) => {
            const isHovered = activeFactor === factor.id;
            const isTop = factor.y < cy;
            return (
              <g
                key={factor.id}
                transform={`translate(${factor.x}, ${factor.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setActiveFactor(factor.id)}
                onMouseLeave={() => setActiveFactor(null)}
                tabIndex={0}
                role="button"
                aria-label={`${factor.title}: ${factor.sub}`}
                onFocus={() => setActiveFactor(factor.id)}
                onBlur={() => setActiveFactor(null)}
              >
                {/* Outer Ring */}
                <circle
                  cx="0"
                  cy="0"
                  r={isHovered ? 16 : 13}
                  fill={isHovered ? "rgba(16,185,129,0.35)" : "rgba(6,78,59,0.8)"}
                  stroke={isHovered ? "#34D399" : "rgba(52,211,153,0.6)"}
                  strokeWidth={isHovered ? 2 : 1.25}
                  className="transition-all duration-200"
                />
                {/* Inner Indicator */}
                <circle
                  cx="0"
                  cy="0"
                  r={isHovered ? 5.5 : 4}
                  fill={isHovered ? "#6EE7B7" : "#34D399"}
                />

                {/* Label */}
                <text
                  x="0"
                  y={isTop ? -19 : 24}
                  textAnchor="middle"
                  fill={isHovered ? "#FFFFFF" : "#A7F3D0"}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {factor.title}
                </text>
                <text
                  x="0"
                  y={isTop ? -27 : 32}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="6"
                  fontFamily="monospace"
                  className={isHovered ? "fill-emerald-300" : ""}
                >
                  {factor.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Sequential Verification Pipeline Strip (Ingest → Verify → Authorize) ── */}
      <div className="relative z-10 mt-1 rounded-lg border border-emerald-500/20 bg-emerald-950/45 p-2.5 backdrop-blur-xs">
        <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
          <span className="text-emerald-300 font-bold uppercase tracking-wider">
            Verification Sequence
          </span>
          <span className="text-emerald-400/90 text-[10px]">
            LATENCY: 8ms · ZERO-LEAKAGE
          </span>
        </div>

        {/* 3 Sequential Stages */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded border border-emerald-500/35 bg-emerald-900/40 py-1.5 px-1 text-[10px] font-mono">
            <div className="flex items-center justify-center gap-1 text-emerald-300 font-semibold">
              <CheckCircle2 className="size-3 text-emerald-400" />
              <span>1. Ingest</span>
            </div>
            <span className="text-[8.5px] text-slate-300">Credential Parse</span>
          </div>

          <div className="rounded border border-emerald-500/35 bg-emerald-900/40 py-1.5 px-1 text-[10px] font-mono">
            <div className="flex items-center justify-center gap-1 text-emerald-300 font-semibold">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>2. Verify</span>
            </div>
            <span className="text-[8.5px] text-slate-300">Argon2id Enclave</span>
          </div>

          <div className="rounded border border-emerald-500/20 bg-emerald-950/40 py-1.5 px-1 text-[10px] font-mono">
            <div className="flex items-center justify-center gap-1 text-slate-300 font-semibold">
              <Lock className="size-3 text-emerald-400/70" />
              <span>3. Authorize</span>
            </div>
            <span className="text-[8.5px] text-slate-400">Postgres Session</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Telemetry Grid ── */}
      {showTelemetry && (
        <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 border-t border-emerald-500/20 pt-3 text-center">
          <div className="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Session Cipher
            </div>
            <div className="text-xs font-bold text-white font-mono">
              AES-256-GCM
            </div>
          </div>
          <div className="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Role Guard
            </div>
            <div className="text-xs font-bold text-emerald-300 font-mono">
              Zero-Trust
            </div>
          </div>
          <div className="rounded-md bg-emerald-950/50 border border-emerald-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Token Ingestion
            </div>
            <div className="text-xs font-bold text-teal-300 font-mono">
              HttpOnly
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
