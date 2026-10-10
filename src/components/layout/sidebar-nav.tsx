"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileText,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  MessageCircle,
  ReceiptText,
  Settings2,
  ShieldCheck,
  ToggleLeft,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isRouteActive } from "./nav-utils";

export interface NavItemDef {
  label: string;
  href: string;
  iconKey: string;
}

export interface NavGroupDef {
  title?: string;
  items: NavItemDef[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  people: UsersRound,
  attendance: Clock3,
  leave: CalendarCheck2,
  approvals: ClipboardCheck,
  expenses: ReceiptText,
  payroll: Banknote,
  payslips: FileText,
  recruitment: BriefcaseBusiness,
  work: ListTodo,
  chat: MessageCircle,
  billing: Banknote,
  reports: BarChart3,
  settings: Settings2,
  workflows: Settings2,
  // Platform Console icons
  organizations: Building2,
  provisioning: Gauge,
  plans: CreditCard,
  subscriptions: WalletCards,
  usage: Gauge,
  analytics: BarChart3,
  features: ToggleLeft,
  support: LifeBuoy,
  health: ShieldCheck,
  configuration: Settings2,
  users: UsersRound,
  audit: Activity,
};

export function SidebarNav({ groups }: { groups: NavGroupDef[] }) {
  const pathname = usePathname();

  const allHrefs = React.useMemo(
    () => groups.flatMap((group) => group.items.map((item) => item.href)),
    [groups]
  );

  return (
    <nav aria-label="Sidebar navigation" className="space-y-6">
      {groups.map((group, groupIdx) => {
        if (!group.items.length) return null;
        return (
          <div key={group.title || `group-${groupIdx}`} className="space-y-1">
            {group.title && (
              <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#174734]">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = ICON_MAP[item.iconKey] || LayoutDashboard;
              const active = isRouteActive(pathname, item.href, allHrefs);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                    active
                      ? "bg-surface text-primary font-semibold shadow-xs border border-[#CDE0CC]"
                      : "text-slate-600 hover:bg-[#E2EDE1] hover:text-primary"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active ? "text-primary" : "text-slate-500 group-hover:text-primary"
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span
                      className="ml-auto h-3.5 w-1 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
