"use client";

import React from "react";
import type { SystemRole } from "@/modules/rbac/permissions";

interface IllustrationProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  selected?: boolean;
}

export function HRAdminIllustration({ className, selected = false, ...props }: IllustrationProps) {
  const primary = selected ? "#059669" : "#0d9488";
  const accent = selected ? "#10b981" : "#14b8a6";
  const bg = selected ? "#ecfdf5" : "#f0fdfa";
  const ring = selected ? "#a7f3d0" : "#ccfbf1";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} strokeWidth="2" />
      {/* Governance Shield Backdrop */}
      <path
        d="M60 22L84 32V58C84 75 73.5 88.5 60 94C46.5 88.5 36 75 36 58V32L60 22Z"
        fill="#ffffff"
        stroke={primary}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner Badge Tone */}
      <path
        d="M60 27L79 35.5V57C79 71 70.5 82 60 87C49.5 82 41 71 41 57V35.5L60 27Z"
        fill={selected ? "#d1fae5" : "#e6fffa"}
        opacity="0.75"
      />
      {/* People Governance Figures */}
      {/* Head */}
      <circle cx="60" cy="46" r="8" fill={primary} />
      {/* Body / Shoulders */}
      <path
        d="M48 68C48 61.3726 53.3726 56 60 56C66.6274 56 72 61.3726 72 68V72H48V68Z"
        fill={primary}
      />
      {/* Org Badge Key Accent */}
      <rect x="56" y="74" width="8" height="10" rx="2" fill={accent} />
      <circle cx="60" cy="79" r="1.5" fill="#ffffff" />
      {/* Star / Sparkle of Authority */}
      <path
        d="M60 30L61.5 34.5L66 36L61.5 37.5L60 42L58.5 37.5L54 36L58.5 34.5L60 30Z"
        fill={accent}
      />
    </svg>
  );
}

export function HRExecutiveIllustration({ className, selected = false, ...props }: IllustrationProps) {
  const primary = selected ? "#0284c7" : "#0ea5e9";
  const accent = selected ? "#38bdf8" : "#7dd3fc";
  const bg = selected ? "#f0f9ff" : "#f8fafc";
  const ring = selected ? "#bae6fd" : "#e2e8f0";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} strokeWidth="2" />
      {/* ID Clipboard Card */}
      <rect
        x="34"
        y="26"
        width="52"
        height="68"
        rx="6"
        fill="#ffffff"
        stroke={primary}
        strokeWidth="2.5"
      />
      {/* Clip at top */}
      <rect x="48" y="22" width="24" height="8" rx="3" fill={primary} />
      <circle cx="60" cy="26" r="2" fill="#ffffff" />
      {/* Avatar Badge on card */}
      <circle cx="60" cy="45" r="9" fill={selected ? "#e0f2fe" : "#f1f5f9"} stroke={primary} strokeWidth="1.5" />
      <circle cx="60" cy="43" r="4.5" fill={primary} />
      <path
        d="M53 54C53 50.5 56 48 60 48C64 48 67 50.5 67 54"
        stroke={primary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Details checklist lines */}
      <line x1="44" y1="62" x2="68" y2="62" stroke={primary} strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="70" x2="62" y2="70" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="78" x2="56" y2="78" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      {/* Onboarding Verified Stamp */}
      <circle cx="74" cy="74" r="8" fill={primary} />
      <path d="M71 74L73.5 76.5L78 72" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FinanceAdminIllustration({ className, selected = false, ...props }: IllustrationProps) {
  const primary = selected ? "#d97706" : "#f59e0b";
  const accent = selected ? "#b45309" : "#d97706";
  const bg = selected ? "#fffbeb" : "#fefce8";
  const ring = selected ? "#fde68a" : "#fef08a";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} strokeWidth="2" />
      {/* Financial Ledger / Calculator Card */}
      <rect
        x="36"
        y="28"
        width="48"
        height="64"
        rx="7"
        fill="#ffffff"
        stroke={primary}
        strokeWidth="2.5"
      />
      {/* Ledger Display Window */}
      <rect x="42" y="34" width="36" height="14" rx="3" fill={selected ? "#fef3c7" : "#fffbeb"} stroke={primary} strokeWidth="1.5" />
      {/* Mini Trend Line inside window */}
      <path d="M46 43L52 39L57 42L64 37L73 40" stroke={accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {/* Keypad Buttons Grid */}
      <circle cx="48" cy="56" r="3" fill={primary} />
      <circle cx="60" cy="56" r="3" fill={primary} />
      <circle cx="72" cy="56" r="3" fill={primary} />
      <circle cx="48" cy="66" r="3" fill={primary} />
      <circle cx="60" cy="66" r="3" fill={primary} />
      <circle cx="72" cy="66" r="3" fill={accent} />
      <circle cx="48" cy="76" r="3" fill={primary} />
      <rect x="57" y="73" width="18" height="6" rx="3" fill={accent} />
      {/* Golden Coin Token Accent */}
      <circle cx="82" cy="40" r="10" fill="#fde68a" stroke={primary} strokeWidth="2" />
      <text x="82" y="44" textAnchor="middle" fill={accent} fontSize="11" fontWeight="bold" fontFamily="sans-serif">₹</text>
    </svg>
  );
}

export function ManagerIllustration({ className, selected = false, ...props }: IllustrationProps) {
  const primary = selected ? "#4f46e5" : "#6366f1";
  const accent = selected ? "#4338ca" : "#4f46e5";
  const bg = selected ? "#eef2ff" : "#f5f3ff";
  const ring = selected ? "#c7d2fe" : "#ddd6fe";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} strokeWidth="2" />
      {/* Department Structure Tree Node */}
      {/* Top Leadership Node */}
      <circle cx="60" cy="38" r="10" fill={primary} />
      <path d="M56 38L59 41L65 35" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Connecting Stem Lines */}
      <line x1="60" y1="48" x2="60" y2="58" stroke={accent} strokeWidth="2" />
      <line x1="38" y1="58" x2="82" y2="58" stroke={accent} strokeWidth="2" />
      <line x1="38" y1="58" x2="38" y2="68" stroke={accent} strokeWidth="2" />
      <line x1="60" y1="58" x2="60" y2="68" stroke={accent} strokeWidth="2" />
      <line x1="82" y1="58" x2="82" y2="68" stroke={accent} strokeWidth="2" />
      {/* Subordinate Pod Nodes */}
      <circle cx="38" cy="74" r="7" fill="#ffffff" stroke={primary} strokeWidth="2" />
      <circle cx="38" cy="74" r="3" fill={primary} />
      <circle cx="60" cy="74" r="7" fill="#ffffff" stroke={primary} strokeWidth="2" />
      <circle cx="60" cy="74" r="3" fill={primary} />
      <circle cx="82" cy="74" r="7" fill="#ffffff" stroke={primary} strokeWidth="2" />
      <circle cx="82" cy="74" r="3" fill={primary} />
      {/* Management Briefcase / Desk Anchor */}
      <rect x="48" y="86" width="24" height="10" rx="3" fill={primary} />
      <path d="M56 86V83C56 82 57 81 58 81H62C63 81 64 82 64 83V86" stroke={primary} strokeWidth="1.5" />
    </svg>
  );
}

export function TeamLeadIllustration({ className, selected = false, ...props }: IllustrationProps) {
  const primary = selected ? "#0f766e" : "#14b8a6";
  const accent = selected ? "#0d9488" : "#2dd4bf";
  const bg = selected ? "#f0fdfa" : "#ecfdf5";
  const ring = selected ? "#99f6e4" : "#a7f3d0";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} strokeWidth="2" />
      {/* Agile Sprint Flag & Pod Hub */}
      {/* Central Hub Ring */}
      <circle cx="60" cy="62" r="16" fill="#ffffff" stroke={primary} strokeWidth="2.5" />
      <circle cx="60" cy="62" r="6" fill={primary} />
      {/* Satellite Pod Members */}
      <circle cx="32" cy="46" r="6" fill="#ffffff" stroke={primary} strokeWidth="2" />
      <circle cx="88" cy="46" r="6" fill="#ffffff" stroke={primary} strokeWidth="2" />
      <circle cx="40" cy="84" r="6" fill="#ffffff" stroke={primary} strokeWidth="2" />
      <circle cx="80" cy="84" r="6" fill="#ffffff" stroke={primary} strokeWidth="2" />
      {/* Collaboration Links */}
      <line x1="38" y1="50" x2="48" y2="56" stroke={accent} strokeWidth="1.75" strokeDasharray="2 2" />
      <line x1="82" y1="50" x2="72" y2="56" stroke={accent} strokeWidth="1.75" strokeDasharray="2 2" />
      <line x1="45" y1="80" x2="52" y2="72" stroke={accent} strokeWidth="1.75" strokeDasharray="2 2" />
      <line x1="75" y1="80" x2="68" y2="72" stroke={accent} strokeWidth="1.75" strokeDasharray="2 2" />
      {/* Leadership Sprint Flag */}
      <path d="M60 46V22" stroke={primary} strokeWidth="2" strokeLinecap="round" />
      <path d="M60 22L76 28L60 34V22Z" fill={accent} stroke={primary} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function ProjectManagerIllustration({ className, selected = false, ...props }: IllustrationProps) {
  const primary = selected ? "#7c3aed" : "#8b5cf6";
  const accent = selected ? "#6d28d9" : "#7c3aed";
  const bg = selected ? "#f5f3ff" : "#faf5ff";
  const ring = selected ? "#ddd6fe" : "#e9d5ff";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} strokeWidth="2" />
      {/* Kanban Board Layout */}
      <rect
        x="32"
        y="28"
        width="56"
        height="64"
        rx="7"
        fill="#ffffff"
        stroke={primary}
        strokeWidth="2.5"
      />
      {/* Board Column Dividers */}
      <line x1="50" y1="36" x2="50" y2="84" stroke={ring} strokeWidth="1.5" />
      <line x1="70" y1="36" x2="70" y2="84" stroke={ring} strokeWidth="1.5" />
      {/* Column Headers */}
      <rect x="36" y="34" width="10" height="4" rx="1.5" fill={primary} opacity="0.6" />
      <rect x="54" y="34" width="12" height="4" rx="1.5" fill={primary} opacity="0.6" />
      <rect x="74" y="34" width="10" height="4" rx="1.5" fill={primary} opacity="0.6" />
      {/* Task Cards Column 1 (To Do) */}
      <rect x="35" y="42" width="12" height="12" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="35" y="58" width="12" height="10" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      {/* Task Cards Column 2 (In Progress) */}
      <rect x="53" y="42" width="14" height="16" rx="2" fill={selected ? "#ede9fe" : "#f5f3ff"} stroke={primary} strokeWidth="1.25" />
      <circle cx="60" cy="50" r="2.5" fill={primary} />
      {/* Task Cards Column 3 (Completed) */}
      <rect x="73" y="42" width="12" height="10" rx="2" fill="#f0fdf4" stroke="#86efac" strokeWidth="1" />
      <path d="M76 47L78 49L82 45" stroke="#16a34a" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="73" y="56" width="12" height="10" rx="2" fill="#f0fdf4" stroke="#86efac" strokeWidth="1" />
      <path d="M76 61L78 63L82 59" stroke="#16a34a" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      {/* Milestone Compass / Pin on Board */}
      <circle cx="82" cy="28" r="8" fill={accent} />
      <path d="M82 23L84 27L88 28L84 29L82 33L80 29L76 28L80 27L82 23Z" fill="#ffffff" />
    </svg>
  );
}

export function RecruiterIllustration({ className, selected = false, ...props }: IllustrationProps) {
  const primary = selected ? "#e11d48" : "#f43f5e";
  const accent = selected ? "#be123c" : "#e11d48";
  const bg = selected ? "#fff1f2" : "#ffe4e6";
  const ring = selected ? "#fecdd3" : "#fda4af";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} strokeWidth="2" />
      {/* Candidate Profile Card */}
      <rect
        x="36"
        y="30"
        width="48"
        height="60"
        rx="6"
        fill="#ffffff"
        stroke="#fda4af"
        strokeWidth="2"
      />
      <circle cx="60" cy="46" r="8" fill="#ffe4e6" stroke={primary} strokeWidth="1.5" />
      <circle cx="60" cy="44" r="4" fill={primary} />
      <path d="M54 54C54 51.5 56.5 49.5 60 49.5C63.5 49.5 66 51.5 66 54" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="44" y1="62" x2="68" y2="62" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="70" x2="60" y2="70" stroke="#fecdd3" strokeWidth="2" strokeLinecap="round" />
      {/* Talent Search Lens */}
      <circle cx="74" cy="64" r="15" fill="#ffffff" stroke={primary} strokeWidth="2.5" />
      <circle cx="74" cy="64" r="10" fill={selected ? "#ffe4e6" : "#fff1f2"} opacity="0.6" />
      {/* Star Candidate Spark */}
      <path
        d="M74 58L75.5 62L79.5 63.5L75.5 65L74 69L72.5 65L68.5 63.5L72.5 62L74 58Z"
        fill={accent}
      />
      {/* Lens Handle */}
      <line x1="84.5" y1="74.5" x2="94" y2="84" stroke={primary} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmployeeIllustration({ className, selected = false, ...props }: IllustrationProps) {
  const primary = selected ? "#059669" : "#10b981";
  const accent = selected ? "#334155" : "#475569";
  const bg = selected ? "#ecfdf5" : "#f1f5f9";
  const ring = selected ? "#a7f3d0" : "#cbd5e1";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="60" cy="60" r="54" fill={bg} stroke={ring} strokeWidth="2" />
      {/* Workstation Laptop */}
      <rect
        x="38"
        y="42"
        width="44"
        height="30"
        rx="4"
        fill={accent}
        stroke="#1e293b"
        strokeWidth="2"
      />
      {/* Laptop Screen */}
      <rect x="42" y="46" width="36" height="22" rx="2" fill="#ffffff" />
      {/* Code / Workspace Lines on screen */}
      <path d="M48 53L52 57L48 61" stroke={primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="56" y1="57" x2="72" y2="57" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="63" x2="64" y2="63" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      {/* Laptop Base Keyboard */}
      <path
        d="M32 74L35 72H85L88 74C89 74.8 88.5 76 87.5 76H32.5C31.5 76 31 74.8 32 74Z"
        fill="#cbd5e1"
        stroke="#64748b"
        strokeWidth="1.5"
      />
      {/* Desk Surface Line */}
      <line x1="26" y1="76" x2="94" y2="76" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      {/* ID Badge Lanyard Accent on Desk */}
      <rect x="80" y="66" width="10" height="14" rx="2" fill="#ffffff" stroke={primary} strokeWidth="1.25" />
      <circle cx="85" cy="71" r="2" fill={primary} />
      <line x1="82" y1="76" x2="88" y2="76" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function RoleIllustration({
  roleKey,
  selected = false,
  className = "w-16 h-16",
}: {
  roleKey: SystemRole;
  selected?: boolean;
  className?: string;
}) {
  switch (roleKey) {
    case "HR_ADMIN":
      return <HRAdminIllustration selected={selected} className={className} />;
    case "HR_EXECUTIVE":
      return <HRExecutiveIllustration selected={selected} className={className} />;
    case "FINANCE_ADMIN":
      return <FinanceAdminIllustration selected={selected} className={className} />;
    case "MANAGER":
      return <ManagerIllustration selected={selected} className={className} />;
    case "TEAM_LEAD":
      return <TeamLeadIllustration selected={selected} className={className} />;
    case "PROJECT_MANAGER":
      return <ProjectManagerIllustration selected={selected} className={className} />;
    case "RECRUITER":
      return <RecruiterIllustration selected={selected} className={className} />;
    case "EMPLOYEE":
    default:
      return <EmployeeIllustration selected={selected} className={className} />;
  }
}
