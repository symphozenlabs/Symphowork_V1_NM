import { Bell, BriefcaseBusiness, CalendarCheck2, ChevronDown, ClipboardCheck, Clock3, LayoutDashboard, Menu, Search, Settings2, UsersRound, ReceiptText, Banknote, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Overview", href: "/app", icon: LayoutDashboard, active: true },
  { label: "People", href: "/app/employees", icon: UsersRound },
  { label: "Attendance", href: "/app/attendance", icon: Clock3 },
  { label: "Leave", href: "/app/leave", icon: CalendarCheck2 },
  { label: "Approvals", href: "/app/approvals", icon: ClipboardCheck },
  { label: "Expenses", href: "/app/expenses", icon: ReceiptText },
  { label: "Payroll", href: "/app/payroll", icon: Banknote },
  { label: "Payslips", href: "/app/payroll/payslips", icon: FileText },
  { label: "Recruitment", href: "/app", icon: BriefcaseBusiness },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-[#10233f] text-white lg:block">
        <div className="flex h-full flex-col px-5 py-6">
          <div className="flex items-center gap-3 px-2"><div className="grid size-9 place-items-center rounded-xl bg-[#35d39c] text-lg font-black text-[#10233f]">S</div><div><p className="font-bold tracking-tight">SymphoWork</p><p className="text-xs text-blue-100/60">Workspace foundation</p></div></div>
          <nav aria-label="Primary navigation" className="mt-10 space-y-1">{navItems.map(({ label, href, icon: Icon, active }) => <a key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-white/12 text-white" : "text-blue-100/65 hover:bg-white/8 hover:text-white"}`}><Icon className="size-4" aria-hidden="true" />{label}</a>)}</nav>
          <div className="mt-auto space-y-1"><a href="/app/settings/workflows" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-100/65 hover:bg-white/8 hover:text-white"><Settings2 className="size-4" />Settings</a><div className="mt-5 flex items-center gap-3 border-t border-white/10 px-2 pt-5"><div className="grid size-9 place-items-center rounded-full bg-[#c9d9f5] text-xs font-bold text-[#10233f]">AM</div><div className="min-w-0"><p className="truncate text-sm font-semibold">Alex Morgan</p><p className="truncate text-xs text-blue-100/55">Workspace admin</p></div></div></div>
        </div>
      </aside>
      <div className="lg:pl-64"><header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button><div className="hidden items-center gap-2 text-sm text-muted md:flex"><span>Workspace</span><span>/</span><span className="font-semibold text-foreground">Overview</span></div><div className="relative md:hidden"><Search className="absolute left-3 top-2.5 size-4 text-muted" /><input className="h-9 w-44 rounded-lg border bg-surface pl-9 text-sm" placeholder="Search" aria-label="Search workspace" /></div></div><div className="flex items-center gap-2"><a href="/app/notifications" aria-label="Notifications" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted hover:bg-surface"><Bell className="size-4" /><span className="hidden sm:inline">Notifications</span></a><Button variant="secondary" size="sm" className="hidden sm:inline-flex">Help center</Button><Button variant="ghost" size="sm" aria-label="Account menu"><span className="grid size-7 place-items-center rounded-full bg-[#d9e7ff] text-xs font-bold">AM</span><ChevronDown className="size-4" /></Button></div></header><main className="mx-auto max-w-[1440px] p-5 md:p-8">{children}</main></div>
    </div>
  );
}
