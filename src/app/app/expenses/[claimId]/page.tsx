import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDetail } from "@/components/expenses/expense-detail";
import { ArrowLeft, Receipt } from "lucide-react";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ claimId: string }>;
}) {
  if (!(await getSessionUser())) redirect("/login");
  const { claimId } = await params;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          href="/app/expenses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Expense Claims
        </Link>
      </div>

      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Financial Audit
            </span>
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Claim: {claimId}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Claim Details & Verification
          </h1>
          <p className="mt-1 text-sm text-muted">
            Inspect itemized line entries, attached financial documents, and the multi-step approval sequence.
          </p>
        </div>
      </div>

      {/* Main Claim Detail Card */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Claim Status & Settlement Review
              </CardTitle>
              <p className="text-xs text-muted">
                Line items, currency conversions, and reviewer notes recorded in the organizational ledger
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ExpenseDetail claimId={claimId} />
        </CardContent>
      </Card>
    </div>
  );
}
