"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Mail,
  RotateCcw,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecoveryPipelineHudProps {
  className?: string;
  showTelemetry?: boolean;
}

export function RecoveryPipelineHud({
  className,
  showTelemetry = true,
}: RecoveryPipelineHudProps) {
  const [activeStation, setActiveStation] = useState<string | null>(null);

  const recoveryStations = [
    {
      id: "station-identity",
      number: "01",
      title: "IDENTITY ANCHOR",
      sub: "Email Existence Guard",
      x: 55,
      y: 140,
      icon: UserCheck,
      badge: "Lookup",
    },
    {
      id: "station-token",
      number: "02",
      title: "TOKEN ENCLAVE",
      sub: "One-Time 15-Min TTL",
      x: 160,
      y: 85,
      icon: KeyRound,
      badge: "Cryptographic",
    },
    {
      id: "station-dispatch",
      number: "03",
      title: "SECURE DISPATCH",
      sub: "Out-of-Band Envelope",
      x: 265,
      y: 195,
      icon: Mail,
      badge: "Zero-Knowledge",
    },
    {
      id: "station-rekey",
      number: "04",
      title: "ATOMIC RE-KEY",
      sub: "Session Invalidation",
      x: 365,
      y: 140,
      icon: RotateCcw,
      badge: "Destination",
    },
  ];

  // S-Curve Recovery Rail Path string
  const railPath = "M 55 140 C 110 140, 110 85, 160 85 C 210 85, 210 195, 265 195 C 320 195, 320 140, 365 140";

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-cyan-500/30 bg-[#020D12]/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden text-white font-sans select-none",
        className
      )}
      role="region"
      aria-label="SymphoWork Account Recovery Command Display"
    >
      {/* ── Background: Directional Rail Grid ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full bg-cyan-500/10 blur-[65px]" />
        {/* Directional matrix pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#06B6D4_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
      </div>

      {/* ── Top Bar: Recovery Telemetry & Channel Mode ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-300 font-mono">
                Account Recovery Pathway
              </span>
              <span className="rounded bg-cyan-950/90 border border-cyan-500/40 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">
                RECOVERY ENCLAVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Directional cryptographic password reset rail
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/70 px-2.5 py-1 text-[10px] font-mono text-cyan-300">
          <ShieldAlert className="size-3 text-cyan-300 animate-pulse" />
          <span className="font-semibold">CHANNEL: SECURE</span>
        </div>
      </div>

      {/* ── Directional Recovery Pathway SVG ── */}
      <div className="relative z-10 py-1">
        <svg
          viewBox="0 0 420 280"
          className="w-full h-auto overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="recovery-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Recovery Rail Gradient */}
            <linearGradient id="rail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* ── Baseline Directional Railway Track ── */}
          <path
            d={railPath}
            fill="none"
            stroke="rgba(6,182,212,0.2)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d={railPath}
            fill="none"
            stroke="url(#rail-grad)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="hud-rail-dash"
          />

          {/* ── Traveling Recovery Envelope Particle ── */}
          <g filter="url(#recovery-glow)">
            <circle r="4" fill="#22D3EE" className="hud-live-particle">
              <animateMotion
                dur="3.6s"
                repeatCount="indefinite"
                path={railPath}
              />
            </circle>
          </g>

          {/* Secondary Trail Particle */}
          <circle r="2.5" fill="#67E8F9" className="hud-live-particle opacity-80">
            <animateMotion
              dur="3.6s"
              begin="0.3s"
              repeatCount="indefinite"
              path={railPath}
            />
          </circle>

          {/* Directional Arrow Indicators on Rail Segments */}
          <polygon points="105,108 112,112 105,116" fill="rgba(34,211,238,0.5)" />
          <polygon points="210,138 217,142 210,146" fill="rgba(34,211,238,0.5)" />
          <polygon points="315,164 322,168 315,172" fill="rgba(34,211,238,0.5)" />

          {/* ── Recovery Checkpoint Stations ── */}
          {recoveryStations.map((station) => {
            const isHovered = activeStation === station.id;
            const isTop = station.y < 140;
            return (
              <g
                key={station.id}
                transform={`translate(${station.x}, ${station.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setActiveStation(station.id)}
                onMouseLeave={() => setActiveStation(null)}
                tabIndex={0}
                role="button"
                aria-label={`${station.title}: ${station.sub}`}
                onFocus={() => setActiveStation(station.id)}
                onBlur={() => setActiveStation(null)}
              >
                {/* Station Halo */}
                <circle
                  cx="0"
                  cy="0"
                  r={isHovered ? 18 : 14}
                  fill={isHovered ? "rgba(6,182,212,0.3)" : "rgba(8,47,73,0.85)"}
                  stroke={isHovered ? "#22D3EE" : "rgba(34,211,238,0.6)"}
                  strokeWidth={isHovered ? 2 : 1.25}
                  filter={isHovered ? "url(#recovery-glow)" : undefined}
                  className="transition-all duration-200"
                />

                {/* Station Number Badge */}
                <circle cx="0" cy="0" r="5" fill="#083344" />
                <circle cx="0" cy="0" r="2.5" fill="#67E8F9" className="animate-pulse" />

                {/* Station Label & Step */}
                <text
                  x="0"
                  y={isTop ? -21 : 26}
                  textAnchor="middle"
                  fill={isHovered ? "#FFFFFF" : "#CFFAFE"}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {station.number}. {station.title}
                </text>
                <text
                  x="0"
                  y={isTop ? -30 : 34}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="6"
                  fontFamily="monospace"
                  className={isHovered ? "fill-cyan-300" : ""}
                >
                  {station.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Directional Recovery Step Timeline ── */}
      <div className="relative z-10 mt-1 rounded-lg border border-cyan-500/20 bg-cyan-950/45 p-2.5 backdrop-blur-xs">
        <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
          <span className="text-cyan-300 font-bold uppercase tracking-wider">
            Atomic Recovery Checklist
          </span>
          <span className="text-cyan-400/90 text-[10px]">
            ZERO-KNOWLEDGE DISPATCH
          </span>
        </div>

        {/* 4 Linear Checkpoints */}
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="rounded border border-cyan-500/30 bg-cyan-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span className="text-cyan-300 font-semibold block">1. Identity</span>
            <span className="text-[8px] text-slate-400">Account Valid</span>
          </div>

          <div className="rounded border border-cyan-500/30 bg-cyan-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span className="text-cyan-300 font-semibold block">2. Token</span>
            <span className="text-[8px] text-slate-400">Time-Bound</span>
          </div>

          <div className="rounded border border-cyan-500/30 bg-cyan-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span className="text-cyan-300 font-semibold block">3. Dispatch</span>
            <span className="text-[8px] text-slate-400">Encrypted Email</span>
          </div>

          <div className="rounded border border-cyan-500/20 bg-cyan-950/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span className="text-slate-300 font-semibold block">4. Re-Key</span>
            <span className="text-[8px] text-slate-400">Invalidate Old</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Telemetry Grid ── */}
      {showTelemetry && (
        <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 border-t border-cyan-500/20 pt-3 text-center">
          <div className="rounded-md bg-cyan-950/50 border border-cyan-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Token TTL
            </div>
            <div className="text-xs font-bold text-white font-mono">
              15 Minutes
            </div>
          </div>
          <div className="rounded-md bg-cyan-950/50 border border-cyan-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Delivery Channel
            </div>
            <div className="text-xs font-bold text-cyan-300 font-mono">
              Out-of-Band
            </div>
          </div>
          <div className="rounded-md bg-cyan-950/50 border border-cyan-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Audit Trail
            </div>
            <div className="text-xs font-bold text-emerald-300 font-mono">
              Tamper-Proof
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
