import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveApplicationForm } from "@/components/leave/leave-application-form";
import { CalendarDays } from "lucide-react";

export default async function LeavePage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Leave Operations
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Self-Service Time Off
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Time Off & Leave Requests
          </h1>
          <p className="mt-1 text-sm text-muted">
            Check accrued leave balances, plan vacations, and submit time-off requests to your configured sequential approval workflow.
          </p>
        </div>
      </div>

      {/* Main Leave Request Card */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Apply for Leave
              </CardTitle>
              <p className="text-xs text-muted">
                Available balances are reserved upon submission and deducted once approved
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <LeaveApplicationForm />
        </CardContent>
      </Card>
    </div>
  );
}
