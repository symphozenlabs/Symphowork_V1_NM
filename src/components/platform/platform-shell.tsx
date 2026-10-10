import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SidebarNav, type NavGroupDef } from "@/components/layout/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/modules/identity/auth";
import LogoutButton from "@/components/layout/logout-button";
import { platformConsoleTitle } from "@/modules/platform/authorization";

const platformNavGroups: NavGroupDef[] = [
  {
    items: [
      { label: "Overview", href: "/platform", iconKey: "overview" },
    ],
  },
  {
    title: "Tenants & Plans",
    items: [
      { label: "Organizations", href: "/platform/organizations", iconKey: "organizations" },
      { label: "Provisioning", href: "/platform/provisioning", iconKey: "provisioning" },
      { label: "Plans", href: "/platform/plans", iconKey: "plans" },
      { label: "Subscriptions", href: "/platform/subscriptions", iconKey: "subscriptions" },
      { label: "Usage", href: "/platform/usage", iconKey: "usage" },
    ],
  },
  {
    title: "Operations & Governance",
    items: [
      { label: "Analytics", href: "/platform/analytics", iconKey: "analytics" },
      { label: "Features", href: "/platform/features", iconKey: "features" },
      { label: "Support", href: "/platform/support", iconKey: "support" },
      { label: "Health", href: "/platform/health", iconKey: "health" },
      { label: "Configuration", href: "/platform/configuration", iconKey: "configuration" },
      { label: "Platform users", href: "/platform/users", iconKey: "users" },
      { label: "Audit", href: "/platform/audit", iconKey: "audit" },
    ],
  },
];

const allPlatformItems = platformNavGroups.flatMap((group) =>
  group.items.map(({ label, href }) => ({ label, href }))
);

export async function PlatformShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const consoleTitle = platformConsoleTitle(user?.platformRole);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-[#D5E1D4] bg-[#EDF3EC] text-foreground lg:flex lg:flex-col shadow-xs">
        <div className="shrink-0 px-5 pt-6 pb-4 border-b border-[#D5E1D4] bg-[#E3EFE2]/80">
          <div className="flex items-center justify-between">
            <Link
              href="/platform"
              className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-90"
              aria-label="SymphoWork Platform Console"
            >
              <Image
                src="/symphowork-logo.png"
                alt="SymphoWork"
                width={150}
                height={40}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>
            <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-primary/20 shadow-xs">
              Console
            </span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden px-4 pb-6 pt-5 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
          <SidebarNav groups={platformNavGroups} />

          <div className="mt-auto pt-6">
            <div className="rounded-xl border border-[#D5E1D4] bg-surface p-3 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#174734]">
                Platform Identity
              </p>
              <p className="mt-1 text-xs font-bold text-foreground truncate">{consoleTitle}</p>
              <p className="mt-0.5 text-[11px] text-muted">Cluster Control Plane</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <MobileNav
              items={allPlatformItems}
              label="Open platform navigation"
            />
            <Breadcrumb type="platform" />
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="neutral" className="hidden sm:inline-flex bg-sidebar-active text-sidebar-active-text border-primary/15 font-medium">
              Platform console
            </Badge>
            {user && <LogoutButton />}
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
