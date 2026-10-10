import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { ReportDashboard } from "@/components/reports/report-dashboard";
import { BarChart3, ShieldCheck } from "lucide-react";

export default async function ReportsPage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <BarChart3 className="h-3 w-3" />
              Business Intelligence & Analytics
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Role-Governed Telemetry
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Executive Operational Reporting
          </h1>
          <p className="mt-1 text-sm text-muted">
            Aggregated headcount distributions, attendance patterns, leave burn rates, expense totals, recruitment pipeline health, and payroll costs.
          </p>
        </div>
      </div>

      {/* Report Dashboard Component */}
      <ReportDashboard />
    </div>
  );
}
