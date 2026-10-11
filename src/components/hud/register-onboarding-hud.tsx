"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegisterOnboardingHudProps {
  className?: string;
  showTelemetry?: boolean;
}

export function RegisterOnboardingHud({
  className,
  showTelemetry = true,
}: RegisterOnboardingHudProps) {
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);

  const departments = [
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
  ];

  // Emerging member nodes entering the organization
  const joiningMembers = [
    { id: "m-1", label: "MEMBER #1", targetX: 80, x: 50, y: 220, role: "Operator" },
    { id: "m-2", label: "MEMBER #2", targetX: 80, x: 110, y: 220, role: "Supervisor" },
    { id: "m-3", label: "NEW OPERATOR", targetX: 210, x: 210, y: 225, role: "Admin Tier", isPrimary: true },
    { id: "m-4", label: "MEMBER #3", targetX: 340, x: 310, y: 220, role: "Specialist" },
    { id: "m-5", label: "MEMBER #4", targetX: 340, x: 370, y: 220, role: "Analyst" },
  ];

  const rootX = 210;
  const rootY = 40;

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-teal-500/30 bg-[#020F0A]/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden text-white font-sans select-none",
        className
      )}
      role="region"
      aria-label="SymphoWork Workforce Onboarding Command Display"
    >
      {/* ── Background: Isometric Blueprint Coordinates ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 size-72 rounded-full bg-teal-500/12 blur-[65px]" />
        {/* Isometric architectural grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#14B8A6_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
      </div>

      {/* ── Top Bar: Genesis Telemetry & Onboarding Mode ── */}
      <div className="relative z-10 flex items-center justify-between border-b border-teal-500/20 pb-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-teal-300 font-mono">
                Workforce Onboarding Tree
              </span>
              <span className="rounded bg-teal-950/90 border border-teal-500/40 px-1.5 py-0.5 text-[9px] font-mono text-teal-300">
                GENESIS
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Hierarchical organization mapping & tenant setup
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-950/70 px-2.5 py-1 text-[10px] font-mono text-teal-300">
          <Sparkles className="size-3 text-teal-300 animate-pulse" />
          <span className="font-semibold">TENANT: EXPANDING</span>
        </div>
      </div>

      {/* ── Hierarchical Organization Topology Map SVG ── */}
      <div className="relative z-10 py-1">
        <svg
          viewBox="0 0 420 280"
          className="w-full h-auto overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="onboard-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Tree Branch Connectors: Root to Departments ── */}
          <line x1={rootX} y1={rootY + 16} x2={departments[0].x} y2={departments[0].y - 14} stroke="rgba(45,212,191,0.35)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={rootX} y1={rootY + 16} x2={departments[1].x} y2={departments[1].y - 14} stroke="rgba(45,212,191,0.5)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1={rootX} y1={rootY + 16} x2={departments[2].x} y2={departments[2].y - 14} stroke="rgba(45,212,191,0.35)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Downward Provisioning Particles from Root to Departments */}
          <circle r="2.5" fill="#2DD4BF" filter="url(#onboard-glow)" className="hud-live-particle">
            <animateMotion dur="2.4s" repeatCount="indefinite" path={`M ${rootX} ${rootY + 16} L ${departments[0].x} ${departments[0].y - 14}`} />
          </circle>
          <circle r="3" fill="#34D399" filter="url(#onboard-glow)" className="hud-live-particle">
            <animateMotion dur="1.9s" repeatCount="indefinite" path={`M ${rootX} ${rootY + 16} L ${departments[1].x} ${departments[1].y - 14}`} />
          </circle>
          <circle r="2.5" fill="#2DD4BF" filter="url(#onboard-glow)" className="hud-live-particle">
            <animateMotion dur="2.6s" repeatCount="indefinite" path={`M ${rootX} ${rootY + 16} L ${departments[2].x} ${departments[2].y - 14}`} />
          </circle>

          {/* ── Sub-Branches: Departments to Newly Joining Members ── */}
          {joiningMembers.map((m) => (
            <g key={`branch-${m.id}`}>
              <line
                x1={m.targetX}
                y1={140}
                x2={m.x}
                y2={m.y - 10}
                stroke={m.isPrimary ? "rgba(45,212,191,0.6)" : "rgba(45,212,191,0.25)"}
                strokeWidth={m.isPrimary ? 1.5 : 1}
                strokeDasharray="2 2"
              />
              {/* Upward Ingestion Particle linking member into team */}
              <circle r={m.isPrimary ? 3 : 2} fill="#5EEAD4" className="hud-live-particle">
                <animateMotion dur={`${2.1 + (m.x % 3) * 0.4}s`} repeatCount="indefinite" path={`M ${m.x} ${m.y - 10} L ${m.targetX} 140`} />
              </circle>
            </g>
          ))}

          {/* ── Top Level: Organization Root Hub (Diamond Enclave) ── */}
          <g transform={`translate(${rootX}, ${rootY})`}>
            {/* Outer Diamond Hull */}
            <polygon
              points="0,-18 20,0 0,18 -20,0"
              fill="rgba(19,78,74,0.85)"
              stroke="#2DD4BF"
              strokeWidth="1.75"
              filter="url(#onboard-glow)"
            />
            <circle cx="0" cy="0" r="4.5" fill="#A7F3D0" className="animate-pulse" />

            <text x="0" y="-24" textAnchor="middle" fill="#CCFBF1" fontSize="8" fontFamily="monospace" fontWeight="700">
              TENANT ROOT
            </text>
            <text x="0" y="30" textAnchor="middle" fill="#99F6E4" fontSize="6.5" fontFamily="monospace" opacity="0.8">
              ORGANIZATION BOUNDARY
            </text>
          </g>

          {/* ── Mid Level: Department Pods (Rectangular Pods) ── */}
          {departments.map((dept) => {
            const isHovered = activeDepartment === dept.id;
            return (
              <g
                key={dept.id}
                transform={`translate(${dept.x}, ${dept.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setActiveDepartment(dept.id)}
                onMouseLeave={() => setActiveDepartment(null)}
                tabIndex={0}
                role="button"
                aria-label={`${dept.title}: ${dept.sub}`}
                onFocus={() => setActiveDepartment(dept.id)}
                onBlur={() => setActiveDepartment(null)}
              >
                {/* Pod Rect Card */}
                <rect
                  x="-36"
                  y="-14"
                  width="72"
                  height="28"
                  rx="6"
                  fill={isHovered ? "rgba(19,78,74,0.9)" : "rgba(15,48,40,0.85)"}
                  stroke={isHovered ? "#5EEAD4" : "rgba(45,212,191,0.5)"}
                  strokeWidth={isHovered ? 1.75 : 1}
                  className="transition-colors duration-200"
                />

                <circle cx="-24" cy="0" r="3" fill="#2DD4BF" />
                <text x="4" y="-2" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontFamily="monospace" fontWeight="700">
                  {dept.title}
                </text>
                <text x="4" y="7" textAnchor="middle" fill="#99F6E4" fontSize="5.5" fontFamily="monospace" opacity="0.8">
                  {dept.members}
                </text>
              </g>
            );
          })}

          {/* ── Bottom Level: Joining Member Nodes (Emerging Circles) ── */}
          {joiningMembers.map((m) => {
            return (
              <g key={m.id} transform={`translate(${m.x}, ${m.y})`}>
                {/* Expanding Admission Ripple for Primary Account Node */}
                {m.isPrimary && (
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill="none"
                    stroke="rgba(45,212,191,0.4)"
                    strokeWidth="1"
                    className="animate-ping"
                    style={{ animationDuration: "2.8s" }}
                  />
                )}

                {/* Member Node Core */}
                <circle
                  cx="0"
                  cy="0"
                  r={m.isPrimary ? 10 : 7}
                  fill={m.isPrimary ? "rgba(19,78,74,0.95)" : "rgba(13,56,48,0.85)"}
                  stroke={m.isPrimary ? "#5EEAD4" : "rgba(45,212,191,0.6)"}
                  strokeWidth={m.isPrimary ? 2 : 1.25}
                  filter={m.isPrimary ? "url(#onboard-glow)" : undefined}
                />
                <circle cx="0" cy="0" r={m.isPrimary ? 3.5 : 2} fill="#A7F3D0" />

                <text
                  x="0"
                  y={m.isPrimary ? 20 : 16}
                  textAnchor="middle"
                  fill={m.isPrimary ? "#CCFBF1" : "#99F6E4"}
                  fontSize={m.isPrimary ? "7" : "6"}
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {m.label}
                </text>
                <text
                  x="0"
                  y={m.isPrimary ? 27 : 23}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="5.5"
                  fontFamily="monospace"
                >
                  {m.role}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Genesis Blueprint Progress Strip ── */}
      <div className="relative z-10 mt-1 rounded-lg border border-teal-500/20 bg-teal-950/45 p-2.5 backdrop-blur-xs">
        <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
          <span className="text-teal-300 font-bold uppercase tracking-wider">
            Workspace Provisioning Blueprint
          </span>
          <span className="text-teal-400/90 text-[10px]">
            TOPOLOGY: MULTI-TIER TREE
          </span>
        </div>

        {/* 4 Staged Provisioning Steps */}
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="rounded border border-teal-500/30 bg-teal-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span className="text-teal-300 font-semibold block">1. Tenant</span>
            <span className="text-[8px] text-slate-400">Postgres RLS</span>
          </div>

          <div className="rounded border border-teal-500/30 bg-teal-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span className="text-teal-300 font-semibold block">2. Tree</span>
            <span className="text-[8px] text-slate-400">Departments</span>
          </div>

          <div className="rounded border border-teal-500/30 bg-teal-900/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span className="text-teal-300 font-semibold block">3. Ingest</span>
            <span className="text-[8px] text-slate-400">Operator Genesis</span>
          </div>

          <div className="rounded border border-teal-500/20 bg-teal-950/40 py-1 px-0.5 text-[9.5px] font-mono">
            <span className="text-slate-300 font-semibold block">4. Bind</span>
            <span className="text-[8px] text-slate-400">RBAC Grants</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Telemetry Grid ── */}
      {showTelemetry && (
        <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 border-t border-teal-500/20 pt-3 text-center">
          <div className="rounded-md bg-teal-950/50 border border-teal-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Topology
            </div>
            <div className="text-xs font-bold text-white font-mono">
              Hierarchical
            </div>
          </div>
          <div className="rounded-md bg-teal-950/50 border border-teal-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Isolation
            </div>
            <div className="text-xs font-bold text-teal-300 font-mono">
              Dedicated
            </div>
          </div>
          <div className="rounded-md bg-teal-950/50 border border-teal-500/15 py-1.5 px-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              Member Ingest
            </div>
            <div className="text-xs font-bold text-emerald-300 font-mono">
              Instant
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
