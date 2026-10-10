"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  UsersRound,
  CalendarDays,
  Receipt,
  CreditCard,
  Briefcase,
  FolderLock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Bell,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Metric = {
  label: string;
  value: string;
  note: string;
  href: string;
  icon: typeof UsersRound;
};

export function Overview({ fullName }: { fullName: string }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [employeesResponse, approvalsResponse, notificationsResponse] =
          await Promise.all([
            fetch("/api/app/employees?limit=1"),
            fetch("/api/app/approvals"),
            fetch("/api/app/notifications?unread=true"),
          ]);
        const [employeesBody, approvalsBody, notificationsBody] =
          await Promise.all([
            employeesResponse.json(),
            approvalsResponse.json(),
            notificationsResponse.json(),
          ]);

        if (!active) return;

        const pendingApprovalsCount = approvalsBody.success && Array.isArray(approvalsBody.tasks)
          ? approvalsBody.tasks.filter((task: { status: string }) => task.status === "pending").length
          : 0;

        setMetrics([
          {
            label: "Workforce Directory",
            value: employeesBody.success
              ? String(employeesBody.total ?? employeesBody.employees?.length ?? 0)
              : "—",
            note: employeesBody.success ? "Active team members" : "Unavailable",
            href: "/app/employees",
            icon: UsersRound,
          },
          {
            label: "Pending Approvals",
            value: approvalsBody.success ? String(pendingApprovalsCount) : "—",
            note: approvalsBody.success
              ? pendingApprovalsCount === 0
                ? "All caught up"
                : "Action required"
              : "Unavailable",
            href: "/app/approvals",
            icon: Clock3,
          },
          {
            label: "Unread Notifications",
            value: notificationsBody.success ? String(notificationsBody.unreadCount ?? 0) : "—",
            note: notificationsBody.success
              ? notificationsBody.unreadCount > 0
                ? "Requires review"
                : "No unread alerts"
              : "Unavailable",
            href: "/app/notifications",
            icon: Bell,
          },
        ]);
      } catch (cause) {
        if (active)
          setError(cause instanceof Error ? cause.message : "Some workspace metrics are unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const timeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const actionModules = [
    {
      title: "Attendance & Time",
      description: "Log today’s shifts, punches, and inspect live timesheet records.",
      href: "/app/attendance",
      icon: Clock3,
      badge: "Operational",
    },
    {
      title: "Leave & Time Off",
      description: "Review accrued leave quotas, holiday schedules, and submit requests.",
      href: "/app/leave",
      icon: CalendarDays,
      badge: "Self-Service",
    },
    {
      title: "Expense Claims",
      description: "Upload receipts, log business disbursements, and track reimbursements.",
      href: "/app/expenses",
      icon: Receipt,
      badge: "Financial",
    },
    {
      title: "Compensation & Payslips",
      description: "Access verified salary statements, deductions, and payment histories.",
      href: "/app/payroll/payslips",
      icon: CreditCard,
      badge: "Payroll",
    },
    {
      title: "Talent & ATS",
      description: "Track candidate pipelines, job requisitions, and recruitment intelligence.",
      href: "/app/recruitment",
      icon: Briefcase,
      badge: "Hiring",
    },
    {
      title: "Documents & Vault",
      description: "Browse organization policies, compliance files, and personal records.",
      href: "/app/documents",
      icon: FolderLock,
      badge: "Secure",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Executive Welcome Banner */}
      <section className="rounded-2xl border border-border/80 bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Organization Workspace
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
                Live Enterprise Session
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {timeGreeting()}, {fullName}.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              Welcome to your unified human capital management cockpit. Track team operations, review real-time approvals, and access key workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="secondary" size="sm" className="gap-1.5">
              <Link href="/app/profile">
                <User className="h-3.5 w-3.5 text-muted" />
                <span>My Profile</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/app/notifications">
                <Bell className="h-3.5 w-3.5" />
                <span>Notifications</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* KPI Metrics Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3].map((item) => (
              <Card key={item} className="border-border/80 bg-surface shadow-xs">
                <CardContent className="p-5">
                  <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                </CardContent>
              </Card>
            ))
          : metrics.map(({ label, value, note, href, icon: Icon }) => (
              <Link key={label} href={href} className="group">
                <Card className="h-full border-border/80 bg-surface shadow-xs transition-all hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5">
                  <CardContent className="flex items-start justify-between p-5">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {label}
                      </p>
                      <p className="text-3xl font-bold text-foreground tracking-tight">
                        {value}
                      </p>
                      <p className="text-xs text-muted flex items-center gap-1.5 pt-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{note}</span>
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </section>

      {/* Operational Modules & Capabilities Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Workspace Modules</h2>
            <p className="text-xs text-muted">Quick access to people operations, payroll, and organizational tools</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actionModules.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="group border-border/80 bg-surface shadow-xs transition-all hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground mt-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <p className="text-xs text-muted leading-relaxed">
                    {item.description}
                  </p>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <Button asChild size="sm" variant="ghost" className="w-full justify-between text-xs px-2 group-hover:text-primary">
                    <Link href={item.href}>
                      <span>Open {item.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Trust & Architecture Assurance Footer Banner */}
      <section className="rounded-xl border border-border/80 bg-slate-50/70 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong className="text-foreground">Enterprise Multi-Tenancy:</strong> Strict Postgres row-level security isolation active for this workspace.
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Encrypted Session · Audit Logged</span>
          </div>
        </div>
      </section>
    </div>
  );
}
