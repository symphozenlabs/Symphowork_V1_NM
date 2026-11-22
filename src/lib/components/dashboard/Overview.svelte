<script lang="ts">
type Metric = {
  label: string;
  value: string;
  note: string;
  href: string;
  icon: string;
};

interface DashboardInitialMetrics {
  workforceCount?: number;
  pendingApprovalsCount?: number;
  unreadNotificationsCount?: number;
}

function buildMetricsFromInitial({
  canReadEmployees,
  canViewApprovals,
  initialMetrics,
}: {
  canReadEmployees?: boolean;
  canViewApprovals?: boolean;
  initialMetrics?: DashboardInitialMetrics;
}): Metric[] {
  if (!initialMetrics) return [];
  const next: Metric[] = [];
  if (canReadEmployees !== false && initialMetrics.workforceCount !== undefined) {
    next.push({
      label: "Workforce Directory",
      value: String(initialMetrics.workforceCount),
      note: "Active team members",
      href: "/app/employees",
      icon: "UsersRound",
    });
  }
  if (canViewApprovals !== false && initialMetrics.pendingApprovalsCount !== undefined) {
    next.push({
      label: "Pending Approvals",
      value: String(initialMetrics.pendingApprovalsCount),
      note: initialMetrics.pendingApprovalsCount === 0 ? "All caught up" : "Action required",
      href: "/app/approvals",
      icon: "Clock3",
    });
  }
  if (initialMetrics.unreadNotificationsCount !== undefined) {
    next.push({
      label: "Unread Notifications",
      value: String(initialMetrics.unreadNotificationsCount),
      note: initialMetrics.unreadNotificationsCount > 0 ? "Requires review" : "No unread alerts",
      href: "/app/notifications",
      icon: "Bell",
    });
  }
  return next;
}


let {fullName,canReadEmployees=true,canViewApprovals=true,canViewAts=false,initialMetrics}:{fullName:string;canReadEmployees?:boolean;canViewApprovals?:boolean;canViewAts?:boolean;initialMetrics:DashboardInitialMetrics}=$props();
const metrics=$derived(buildMetricsFromInitial({canReadEmployees,canViewApprovals,initialMetrics}));
const loading=false;const error='';
const timeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
import SvgIcon from "$lib/components/ui/Icon.svelte";
import LinkButton from "$lib/components/ui/LinkButton.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
const actionModules = $derived([
    {
      title: "Attendance & Time",
      description: "Log today’s shifts, punches, and inspect live timesheet records.",
      href: "/app/attendance",
      icon: "Clock3",
      badge: "Operational",
    },
    {
      title: "Leave & Time Off",
      description: "Review accrued leave quotas, holiday schedules, and submit requests.",
      href: "/app/leave",
      icon: "CalendarDays",
      badge: "Self-Service",
    },
    {
      title: "Expense Claims",
      description: "Upload receipts, log business disbursements, and track reimbursements.",
      href: "/app/expenses",
      icon: "Receipt",
      badge: "Financial",
    },
    {
      title: "Compensation & Payslips",
      description: "Access verified salary statements, deductions, and payment histories.",
      href: "/app/payroll/payslips",
      icon: "CreditCard",
      badge: "Payroll",
    },
    ...(canViewAts
      ? [
          {
            title: "Talent & ATS",
            description: "Track candidate pipelines, job requisitions, and recruitment intelligence.",
            href: "/app/recruitment",
            icon: "Briefcase",
            badge: "Hiring",
          },
        ]
      : []),
    {
      title: "Documents & Vault",
      description: "Browse organization policies, compliance files, and personal records.",
      href: "/app/documents",
      icon: "FolderLock",
      badge: "Secure",
    },
  ]);
</script>
<div class="space-y-8"><section class="rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs"><div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div class="space-y-2"><div class="flex items-center gap-2"><span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Organization Workspace
              </span><span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">Live Enterprise Session
              </span></div><h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">{timeGreeting()}, {fullName}.
            </h1><p class="max-w-2xl text-sm leading-relaxed text-muted">Welcome to your unified human capital management cockpit. Track team operations, review real-time approvals, and access key workflows.
            </p></div><div class="flex flex-wrap items-center gap-3"><LinkButton variant="secondary" size="sm" class="gap-1.5" href="/app/profile"><SvgIcon name="User" class="h-3.5 w-3.5 text-muted" /><span>My Profile</span></LinkButton><LinkButton size="sm" class="gap-1.5" href="/app/notifications"><SvgIcon name="Bell" class="h-3.5 w-3.5" /><span>Notifications</span><SvgIcon name="ArrowUpRight" class="h-3.5 w-3.5" /></LinkButton></div></div></section>{#if error}<div role="alert" class="rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-destructive">{error}</div>{/if}<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{#if loading}{#each [1, 2, 3] as item}<Card class="border-border/80 bg-surface shadow-xs"><CardContent class="p-5"><div class="h-20 animate-pulse rounded-lg bg-slate-100" ></div></CardContent></Card>{/each}{:else}{#each metrics as { label, value, note, href, icon: Icon }}<a href={href} class="group"><Card class="h-full border-border/80 bg-surface shadow-xs transition-all hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5"><CardContent class="flex items-start justify-between p-5"><div class="space-y-1"><p class="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p><p class="text-3xl font-bold text-foreground tracking-tight">{value}</p><p class="text-xs text-muted flex items-center gap-1.5 pt-1"><span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" ></span><span>{note}</span></p></div><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><SvgIcon name={Icon} class="h-5 w-5" /></div></CardContent></Card></a>{/each}{/if}</section><section class="space-y-4"><div class="flex items-center justify-between"><div><h2 class="text-lg font-bold text-foreground">Workspace Modules</h2><p class="text-xs text-muted">Quick access to people operations, payroll, and organizational tools</p></div></div><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{#each actionModules as item}{@const Icon = item.icon}<Card class="group border-border/80 bg-surface shadow-xs transition-all hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5"><CardHeader class="p-5 pb-3"><div class="flex items-start justify-between gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><SvgIcon name={Icon} class="h-5 w-5" /></div><span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">{item.badge}</span></div><CardTitle class="text-base font-semibold text-foreground mt-3 group-hover:text-primary transition-colors">{item.title}</CardTitle><p class="text-xs text-muted leading-relaxed">{item.description}</p></CardHeader><CardContent class="p-5 pt-0"><LinkButton size="sm" variant="ghost" class="w-full justify-between text-xs px-2 group-hover:text-primary" href={item.href}><span>Open {item.title}</span><SvgIcon name="ChevronRight" class="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" /></LinkButton></CardContent></Card>{/each}</div></section><section class="rounded-xl border border-border/80 bg-slate-50/70 p-4"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted"><div class="flex items-center gap-2"><SvgIcon name="ShieldCheck" class="h-4 w-4 text-primary shrink-0" /><span><strong class="text-foreground">Enterprise Multi-Tenancy:</strong>Strict Postgres row-level security isolation active for this workspace.
            </span></div><div class="flex items-center gap-2 text-slate-500 font-mono text-[11px]"><SvgIcon name="CheckCircle2" class="h-3.5 w-3.5 text-emerald-600" /><span>Encrypted Session · Audit Logged</span></div></div></section></div>
