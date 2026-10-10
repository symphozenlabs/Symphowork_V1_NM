import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Button } from "@/components/ui/button";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";
import { FileText } from "lucide-react";

export default async function PayrollPage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Compensation & Payroll
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Statutory Calculation Engine
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Payroll Operations & Runs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage effective-dated salary structures, attendance-integrated gross-to-net calculations, statutory deductions, and approval sign-offs.
          </p>
        </div>

        <div className="shrink-0">
          <Button asChild variant="secondary" size="sm" className="gap-1.5">
            <Link href="/app/payroll/payslips">
              <FileText className="h-4 w-4" />
              <span>My Payslips</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Payroll Dashboard */}
      <PayrollDashboard />
    </div>
  );
}
