import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayslipList } from "@/components/payroll/payslip-list";
import { ArrowLeft, FileText } from "lucide-react";

export default async function PayslipsPage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          href="/app/payroll"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Payroll Overview</span>
        </Link>
      </div>

      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Employee Self-Service
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Verified Statements
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Finalized Payslips
          </h1>
          <p className="mt-1 text-sm text-muted">
            Access and download itemized monthly compensation statements, tax withholdings, and statutory contribution breakdowns.
          </p>
        </div>
      </div>

      {/* Payslips Card Container */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Salary Statement History
              </CardTitle>
              <p className="text-xs text-muted">
                Only finalized and approved payslips associated with your employee account are displayed
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <PayslipList />
        </CardContent>
      </Card>
    </div>
  );
}
