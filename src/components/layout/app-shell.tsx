import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SidebarNav, type NavGroupDef } from "@/components/layout/sidebar-nav";
import { getSessionUser } from "@/modules/identity/auth";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { getRolePermissionSet } from "@/modules/tenancy/authorization";
import LogoutButton from "@/components/layout/logout-button";

const baseNavItems = [
  { label: "Overview", href: "/app", iconKey: "overview" },
  { label: "People", href: "/app/employees", iconKey: "people" },
  { label: "Attendance", href: "/app/attendance", iconKey: "attendance" },
  { label: "Leave", href: "/app/leave", iconKey: "leave" },
  { label: "Approvals", href: "/app/approvals", iconKey: "approvals" },
  { label: "Expenses", href: "/app/expenses", iconKey: "expenses" },
  { label: "Payroll", href: "/app/payroll", iconKey: "payroll" },
  { label: "Payslips", href: "/app/payroll/payslips", iconKey: "payslips" },
  { label: "Recruitment", href: "/app/recruitment", iconKey: "recruitment" },
  { label: "Projects & tasks", href: "/app/work", iconKey: "work" },
  { label: "Internal chat", href: "/app/chat", iconKey: "chat" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  let canManageSettings = false;
  let canManageWorkflows = false;
  let canViewBilling = false;
  let canViewReports = false;

  if (user) {
    try {
      const tenant = await resolveTenantContext();
      if (tenant.organization && tenant.membership) {
        if (user.platformRole === "PLATFORM_OWNER") {
          canManageSettings = true;
          canManageWorkflows = true;
          canViewBilling = true;
          canViewReports = true;
        } else {
          const permSet = await getRolePermissionSet(tenant.membership.roleId);
          canManageSettings = permSet.has("organization.settings.read");
          canManageWorkflows = permSet.has("workflow.manage");
          canViewBilling = permSet.has("billing.view");
          canViewReports = permSet.has("report.employee");
        }
      }
    } catch {
      /* unauthenticated/platform-only navigation keeps admin links hidden */
    }
  }

  // Construct structured navigation groups
  const navGroups: NavGroupDef[] = [
    {
      title: "Core Modules",
      items: baseNavItems,
    },
  ];

  const intelligenceItems = [];
  if (canViewBilling) {
    intelligenceItems.push({ label: "Billing & usage", href: "/app/settings/billing", iconKey: "billing" });
  }
  if (canViewReports) {
    intelligenceItems.push({ label: "Reports", href: "/app/reports", iconKey: "reports" });
  }
  if (intelligenceItems.length > 0) {
    navGroups.push({
      title: "Intelligence & Finance",
      items: intelligenceItems,
    });
  }

  const adminItems = [];
  if (canManageSettings) {
    adminItems.push({ label: "Organization settings", href: "/app/settings", iconKey: "settings" });
  }
  if (canManageWorkflows) {
    adminItems.push({ label: "Workflow settings", href: "/app/settings/workflows", iconKey: "workflows" });
  }
  if (adminItems.length > 0) {
    navGroups.push({
      title: "Administration",
      items: adminItems,
    });
  }

  // Flatten items for mobile navigation drawer
  const mobileNavItems = [
    ...baseNavItems.map(({ label, href }) => ({ label, href })),
    ...(canViewBilling ? [{ label: "Billing & usage", href: "/app/settings/billing" }] : []),
    ...(canViewReports ? [{ label: "Reports", href: "/app/reports" }] : []),
    ...(canManageSettings ? [{ label: "Organization settings", href: "/app/settings" }] : []),
    ...(canManageWorkflows ? [{ label: "Workflow settings", href: "/app/settings/workflows" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 
        Desktop Sidebar:
        Strictly preserves classnames required by layout tests:
        - aside: fixed, inset-y-0, left-0, w-64, hidden, lg:flex, lg:flex-col
        - child[0]: shrink-0, px-5, pt-6
        - child[1]: flex, flex-1, min-h-0, overflow-y-auto, overflow-x-hidden, [scrollbar-width:thin]
      */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-[#D9E5D7] bg-[#EFF4EE] text-foreground lg:flex lg:flex-col shadow-xs">
        <div className="shrink-0 px-5 pt-6 pb-4 border-b border-[#D9E5D7] bg-[#E8F0E6]/70">
          <Link
            href="/app"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg transition-opacity hover:opacity-90"
            aria-label="SymphoWork Workspace Home"
          >
            <Image
              src="/symphowork-logo.png"
              alt="SymphoWork"
              width={160}
              height={44}
              priority
              className="h-10.5 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden px-4 pb-6 pt-5 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
          <SidebarNav groups={navGroups} />

          <div className="mt-auto pt-6">
            <div className="flex items-center gap-3 rounded-xl border border-[#D9E5D7] bg-surface p-2.5 shadow-xs">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-white border border-primary/20 shadow-xs">
                {user?.fullName.slice(0, 2).toUpperCase() ?? "SW"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{user?.fullName ?? "Workspace"}</p>
                <p className="truncate text-[11px] text-muted">{user?.email ?? "Signed in"}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper: preserves lg:pl-64 required by tests */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <MobileNav items={mobileNavItems} />
            <Breadcrumb type="workspace" />
            <div className="relative hidden sm:block md:hidden">
              <Search className="absolute left-3 top-2.5 size-4 text-muted" />
              <input
                className="h-9 w-36 sm:w-44 rounded-lg border border-border bg-background pl-9 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Search"
                aria-label="Search workspace"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/app/notifications"
              aria-label="Notifications"
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-slate-100/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Bell className="size-4" />
              <span className="hidden sm:inline">Notifications</span>
            </Link>
            <span className="hidden text-xs text-muted sm:inline">{user?.fullName ?? "Workspace"}</span>
            <LogoutButton />
            <Link
              href="/app/profile"
              aria-label="Open profile"
              className="grid size-8 place-items-center rounded-full bg-sidebar-active text-xs font-bold text-sidebar-active-text border border-primary/15 transition-all hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {user?.fullName.slice(0, 2).toUpperCase() ?? "SW"}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
