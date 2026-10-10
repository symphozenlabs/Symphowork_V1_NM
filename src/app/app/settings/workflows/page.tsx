import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowSettings } from "@/components/workflows/workflow-settings";
import { ArrowLeft, GitFork, ShieldCheck } from "lucide-react";

export default async function WorkflowSettingsPage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Organization Settings
        </Link>
      </div>

      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <GitFork className="h-3 w-3" />
              Process Automation & Governance
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Sequential Multi-Tier Routing
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Approval Workflows & Policy Rules
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configure versioned sequential approval chains for employee leave, attendance regularization, and operational expenses.
          </p>
        </div>
      </div>

      {/* Main Workflow Settings Card */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GitFork className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Organizational Workflow Rules & Routing Tiers
              </CardTitle>
              <p className="text-xs text-muted">
                Sequential approval chains automatically enforce role-based segregation of duties
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <WorkflowSettings />
        </CardContent>
      </Card>
    </div>
  );
}
