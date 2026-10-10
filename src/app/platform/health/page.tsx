import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformHealth, type HealthStatus } from "@/modules/platform/health";
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Mail,
  Cpu,
  CreditCard,
  Radio,
  Workflow,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default async function HealthPage() {
  let data;
  try {
    data = await getPlatformHealth();
  } catch {
    redirect("/platform/login");
  }

  const statusThemes: Record<
    HealthStatus,
    { badgeBg: string; badgeText: string; dot: string; icon: typeof CheckCircle2 }
  > = {
    healthy: {
      badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      badgeText: "Operational",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    },
    degraded: {
      badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
      badgeText: "Degraded",
      dot: "bg-amber-500",
      icon: AlertTriangle,
    },
    unavailable: {
      badgeBg: "bg-rose-50 border-rose-200 text-rose-700",
      badgeText: "Unavailable",
      dot: "bg-rose-500",
      icon: XCircle,
    },
    not_configured: {
      badgeBg: "bg-slate-100 border-slate-200 text-slate-600",
      badgeText: "Not Configured",
      dot: "bg-slate-400",
      icon: HelpCircle,
    },
    unknown: {
      badgeBg: "bg-slate-100 border-slate-200 text-slate-600",
      badgeText: "Unknown",
      dot: "bg-slate-400",
      icon: HelpCircle,
    },
  };

  const componentIcons: Record<string, typeof Server> = {
    application: Server,
    database: Database,
    storage: HardDrive,
    email: Mail,
    ai: Cpu,
    billing: CreditCard,
    realtime: Radio,
    backgroundJobs: Workflow,
  };

  const componentLabels: Record<string, string> = {
    application: "Application Runtime",
    database: "Postgres Database",
    storage: "Object Storage (S3 / Blob)",
    email: "Email Dispatcher",
    ai: "AI & Inference Gateway",
    billing: "Commercial Billing Adapter",
    realtime: "Real-time Gateway",
    backgroundJobs: "Background Job Queue",
  };

  const entries = Object.entries(data.components);
  const operationalCount = entries.filter(([, c]) => c.status === "healthy").length;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Platform Health
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {operationalCount} of {entries.length} services operational
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Health & Infrastructure Probes
          </h1>
          <p className="mt-1 text-sm text-muted">
            Continuous health telemetry and subsystem probe status across core platform services.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Last probe: {new Date(data.checkedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Component Probes Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {entries.map(([name, component]) => {
          const status = component.status as HealthStatus;
          const theme = statusThemes[status] || statusThemes.unknown;
          const Icon = componentIcons[name] || Activity;
          const StatusIcon = theme.icon;
          const label = componentLabels[name] || name;
          const detail =
            "detail" in component && component.detail
              ? component.detail
              : status === "not_configured"
              ? "Service provider not configured in runtime environment."
              : "Status probe passed.";

          return (
            <Card
              key={name}
              className="border-border/80 bg-surface shadow-xs transition-shadow hover:shadow-sm"
            >
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold text-foreground truncate">
                        {label}
                      </CardTitle>
                      <p className="text-[11px] font-mono text-muted uppercase tracking-wider">
                        {name}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${theme.badgeBg}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                    {theme.badgeText}
                  </span>
                  <StatusIcon className="h-4 w-4 text-slate-400" />
                </div>

                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                  {detail}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Governance & Probe Architecture Note */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted leading-relaxed">
              <strong className="text-foreground">Probe Governance:</strong> Subsystem probes execute non-destructive checks against local and connected cloud providers. Simple environment variable presence is distinguished from live active provider connectivity.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
