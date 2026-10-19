"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, X } from "lucide-react";

type LineItem = {
  code: string;
  name: string;
  type: string;
  amount: number;
  taxable: boolean;
};

type Payslip = {
  payslip: {
    payslipNumber: string;
    generatedAt: string;
  };
  run: {
    runNumber: string;
  };
  period: {
    month: number;
    year: number;
    periodStart: string;
    periodEnd: string;
  };
  snapshot: {
    payableDays: number;
    lopDays: number;
    grossEarnings: number;
    totalDeductions: number;
    netSalary: number;
    employerContributions: number;
  };
  employee: {
    displayName: string;
    employeeId: string;
  };
  lineItems: LineItem[];
};

const formatMoney = (val: number) =>
  `₹${Number(val ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function PayslipList() {
  const [items, setItems] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  useEffect(() => {
    void fetch("/api/app/payroll/payslips")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.success) {
          throw new Error(body.error?.message ?? "Unable to load payslips.");
        }
        setItems(body.payslips);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Unable to load payslips.")
      )
      .finally(() => setLoading(false));
  }, []);

  const earnings = selectedPayslip?.lineItems.filter((l) => l.type === "earning") ?? [];
  const deductions = selectedPayslip?.lineItems.filter((l) => l.type === "deduction") ?? [];
  const contributions =
    selectedPayslip?.lineItems.filter((l) => l.type === "employer_contribution") ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Finalized Payslips</CardTitle>
              <p className="mt-1 text-xs text-muted">
                Official itemized salary slips and compensation vouchers.
              </p>
            </div>
            <FileText className="size-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted">Loading payslips…</p>
          ) : error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted">
              Finalized payslips will appear here once payroll runs are completed and finalized.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.payslip.payslipNumber}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-surface p-4 transition-all hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {item.payslip.payslipNumber}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Finalized
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      Period: {String(item.period.month).padStart(2, "0")}/{item.period.year} ({item.period.periodStart} to {item.period.periodEnd}) · Run: {item.run.runNumber}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
                    <div>
                      <p className="text-xs text-muted">Gross Earnings</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(item.snapshot.grossEarnings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Deductions</p>
                      <p className="font-medium text-danger">
                        -{formatMoney(item.snapshot.totalDeductions)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Net Pay</p>
                      <p className="text-base font-bold text-primary">
                        {formatMoney(item.snapshot.netSalary)}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedPayslip(item)}
                      className="gap-1.5"
                    >
                      <FileText className="size-3.5" />
                      <span>View Itemized Voucher</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itemized Printable Payslip Modal */}
      {selectedPayslip && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:static print:bg-transparent print:p-0"
        >
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl print:max-h-none print:w-full print:shadow-none">
            {/* Modal Actions Header - Hidden during print */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-3.5 backdrop-blur-xs print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span className="text-sm font-semibold text-slate-800">
                  Payslip Voucher · {selectedPayslip.payslip.payslipNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 font-semibold"
                >
                  <Printer className="size-4" />
                  <span>Print / Save PDF</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslip(null)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
                  aria-label="Close payslip modal"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Printable Corporate Payslip Sheet */}
            <div className="p-8 text-slate-900 print:p-6" id="printable-payslip">
              {/* Header */}
              <div className="border-b border-slate-300 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                      SYMPHOWORK HRMS
                    </h2>
                    <p className="text-xs text-slate-500">
                      Standard Salary Voucher & Compensation Record
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      CONFIRMED & FINALIZED
                    </span>
                    <p className="mt-1 text-xs font-mono text-slate-500">
                      {selectedPayslip.payslip.payslipNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employee & Pay Period Details */}
              <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs sm:grid-cols-4">
                <div>
                  <p className="text-slate-500 font-medium">Employee Name</p>
                  <p className="font-bold text-slate-900">
                    {selectedPayslip.employee.displayName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Employee ID</p>
                  <p className="font-semibold text-slate-900">
                    {selectedPayslip.employee.employeeId}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Pay Period</p>
                  <p className="font-semibold text-slate-900">
                    {String(selectedPayslip.period.month).padStart(2, "0")}/{selectedPayslip.period.year}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Status</p>
                  <p className="font-semibold text-emerald-700">
                    Finalized
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Payable Days</p>
                  <p className="font-semibold text-emerald-700">
                    {selectedPayslip.snapshot.payableDays}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Loss of Pay (LOP)</p>
                  <p className="font-semibold text-rose-700">
                    {selectedPayslip.snapshot.lopDays} day(s)
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Cycle Range</p>
                  <p className="text-slate-700">
                    {selectedPayslip.period.periodStart} → {selectedPayslip.period.periodEnd}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Payroll Run</p>
                  <p className="font-mono text-slate-700">
                    {selectedPayslip.run.runNumber}
                  </p>
                </div>
              </div>

              {/* Itemized Earnings & Deductions Breakdown Tables */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {/* Earnings Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="bg-slate-100 px-4 py-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Earnings Breakdown
                    </h3>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                        <th className="px-4 py-2">Component</th>
                        <th className="px-4 py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {earnings.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-center text-slate-400">
                            No earning components
                          </td>
                        </tr>
                      ) : (
                        earnings.map((e, idx) => (
                          <tr key={`${e.code}-${idx}`} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-800">
                              {e.name}
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-medium text-slate-900">
                              {formatMoney(e.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                        <td className="px-4 py-2.5">Gross Earnings</td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-700">
                          {formatMoney(selectedPayslip.snapshot.grossEarnings)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Deductions Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="bg-slate-100 px-4 py-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Deductions Breakdown
                    </h3>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                        <th className="px-4 py-2">Component</th>
                        <th className="px-4 py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deductions.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-center text-slate-400">
                            No deduction components
                          </td>
                        </tr>
                      ) : (
                        deductions.map((d, idx) => (
                          <tr key={`${d.code}-${idx}`} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-800">
                              {d.name}
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-medium text-rose-700">
                              {formatMoney(d.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                        <td className="px-4 py-2.5">Total Deductions</td>
                        <td className="px-4 py-2.5 text-right font-mono text-rose-700">
                          {formatMoney(selectedPayslip.snapshot.totalDeductions)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Employer Contributions Table if available */}
              {contributions.length > 0 && (
                <div className="mt-5 rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50">
                  <p className="font-bold text-slate-700 mb-2">Employer Statutory Contributions</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {contributions.map((c, idx) => (
                      <div key={`${c.code}-${idx}`} className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="text-slate-600">{c.name}:</span>
                        <span className="font-mono font-medium">{formatMoney(c.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-slate-900 sm:col-span-3 pt-1">
                      <span>Total Contributions:</span>
                      <span className="font-mono">{formatMoney(selectedPayslip.snapshot.employerContributions)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Pay Banner */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4.5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Net Disbursable Salary
                  </p>
                  <p className="text-xs text-emerald-800">
                    Gross Earnings minus Deductions (LOP double deduction safeguarded)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-emerald-950 font-mono">
                    {formatMoney(selectedPayslip.snapshot.netSalary)}
                  </p>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-8 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
                <p>This is a computer-generated payslip voucher from SymphoWork V1 HRMS. No physical signature is required.</p>
                <p className="mt-0.5">Finalized snapshot generated on {new Date(selectedPayslip.payslip.generatedAt).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
