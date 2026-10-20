<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
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
let items=$state<Payslip[]>(untrack(()=>([])));
const setItems=(next:typeof items|((previous:typeof items)=>typeof items))=>{items=typeof next==="function"?(next as (previous:typeof items)=>typeof items)(items):next;};
let loading=$state(untrack(()=>(true)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let error=$state(untrack(()=>("")));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let selectedPayslip=$state<Payslip | null>(untrack(()=>(null)));
const setSelectedPayslip=(next:typeof selectedPayslip|((previous:typeof selectedPayslip)=>typeof selectedPayslip))=>{selectedPayslip=typeof next==="function"?(next as (previous:typeof selectedPayslip)=>typeof selectedPayslip)(selectedPayslip):next;};
$effect(()=>{return untrack(() => {
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
  });});
const earnings = $derived(selectedPayslip?.lineItems.filter((l) => l.type === "earning") ?? []);
const deductions = $derived(selectedPayslip?.lineItems.filter((l) => l.type === "deduction") ?? []);
const contributions = $derived(selectedPayslip?.lineItems.filter((l) => l.type === "employer_contribution") ?? []);
</script>
<div class="space-y-6">
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>My Finalized Payslips</CardTitle>
              <p class="mt-1 text-xs text-muted">
                Official itemized salary slips and compensation vouchers.
              </p>
            </div>
            <SvgIcon name="FileText" class="size-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {#if loading}<p class="text-sm text-muted">Loading payslips…</p>{:else}{#if error}<p role="alert" class="text-sm text-danger">
              {error}
            </p>{:else}{#if items.length === 0}<p class="text-sm text-muted">
              Finalized payslips will appear here once payroll runs are completed and finalized.
            </p>{:else}<div class="space-y-3">
              {#each items as item}<div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-surface p-4 transition-all hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-foreground">
                        {item.payslip.payslipNumber}
                      </span>
                      <span class="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Finalized
                      </span>
                    </div>
                    <p class="text-xs text-muted">
                      Period: {String(item.period.month).padStart(2, "0")}/{item.period.year} ({item.period.periodStart} to {item.period.periodEnd}) · Run: {item.run.runNumber}
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
                    <div>
                      <p class="text-xs text-muted">Gross Earnings</p>
                      <p class="font-medium text-foreground">
                        {formatMoney(item.snapshot.grossEarnings)}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-muted">Deductions</p>
                      <p class="font-medium text-danger">
                        -{formatMoney(item.snapshot.totalDeductions)}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-muted">Net Pay</p>
                      <p class="text-base font-bold text-primary">
                        {formatMoney(item.snapshot.netSalary)}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onclick={() => setSelectedPayslip(item)} class="gap-1.5">
                      <SvgIcon name="FileText" class="size-3.5" />
                      <span>View Itemized Voucher</span>
                    </Button>
                  </div>
                </div>{/each}
            </div>{/if}{/if}{/if}
        </CardContent>
      </Card>

      
      {#if selectedPayslip}<div role="dialog" aria-modal="true" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:static print:bg-transparent print:p-0">
          <div class="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl print:max-h-none print:w-full print:shadow-none">
            
            <div class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-3.5 backdrop-blur-xs print:hidden">
              <div class="flex items-center gap-2">
                <SvgIcon name="FileText" class="size-4 text-primary" />
                <span class="text-sm font-semibold text-slate-800">
                  Payslip Voucher · {selectedPayslip.payslip.payslipNumber}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <Button size="sm" onclick={() => window.print()} class="gap-1.5 font-semibold">
                  <SvgIcon name="Printer" class="size-4" />
                  <span>Print / Save PDF</span>
                </Button>
                <button type="button" onclick={() => setSelectedPayslip(null)} class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200" aria-label="Close payslip modal">
                  <SvgIcon name="X" class="size-5" />
                </button>
              </div>
            </div>

            
            <div class="p-8 text-slate-900 print:p-6" id="printable-payslip">
              
              <div class="border-b border-slate-300 pb-5">
                <div class="flex items-start justify-between">
                  <div>
                    <h2 class="text-2xl font-bold tracking-tight text-slate-950">
                      SYMPHOWORK HRMS
                    </h2>
                    <p class="text-xs text-slate-500">
                      Standard Salary Voucher & Compensation Record
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="inline-block rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      CONFIRMED & FINALIZED
                    </span>
                    <p class="mt-1 text-xs font-mono text-slate-500">
                      {selectedPayslip.payslip.payslipNumber}
                    </p>
                  </div>
                </div>
              </div>

              
              <div class="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs sm:grid-cols-4">
                <div>
                  <p class="text-slate-500 font-medium">Employee Name</p>
                  <p class="font-bold text-slate-900">
                    {selectedPayslip.employee.displayName}
                  </p>
                </div>
                <div>
                  <p class="text-slate-500 font-medium">Employee ID</p>
                  <p class="font-semibold text-slate-900">
                    {selectedPayslip.employee.employeeId}
                  </p>
                </div>
                <div>
                  <p class="text-slate-500 font-medium">Pay Period</p>
                  <p class="font-semibold text-slate-900">
                    {String(selectedPayslip.period.month).padStart(2, "0")}/{selectedPayslip.period.year}
                  </p>
                </div>
                <div>
                  <p class="text-slate-500 font-medium">Status</p>
                  <p class="font-semibold text-emerald-700">
                    Finalized
                  </p>
                </div>
                <div>
                  <p class="text-slate-500 font-medium">Payable Days</p>
                  <p class="font-semibold text-emerald-700">
                    {selectedPayslip.snapshot.payableDays}
                  </p>
                </div>
                <div>
                  <p class="text-slate-500 font-medium">Loss of Pay (LOP)</p>
                  <p class="font-semibold text-rose-700">
                    {selectedPayslip.snapshot.lopDays} day(s)
                  </p>
                </div>
                <div>
                  <p class="text-slate-500 font-medium">Cycle Range</p>
                  <p class="text-slate-700">
                    {selectedPayslip.period.periodStart} → {selectedPayslip.period.periodEnd}
                  </p>
                </div>
                <div>
                  <p class="text-slate-500 font-medium">Payroll Run</p>
                  <p class="font-mono text-slate-700">
                    {selectedPayslip.run.runNumber}
                  </p>
                </div>
              </div>

              
              <div class="mt-6 grid gap-6 md:grid-cols-2">
                
                <div class="overflow-hidden rounded-xl border border-slate-200">
                  <div class="bg-slate-100 px-4 py-2.5">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Earnings Breakdown
                    </h3>
                  </div>
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                        <th class="px-4 py-2">Component</th>
                        <th class="px-4 py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      {#if earnings.length === 0}<tr>
                          <td colspan={2} class="px-4 py-3 text-center text-slate-400">
                            No earning components
                          </td>
                        </tr>{:else}{#each earnings as e, idx}<tr class="hover:bg-slate-50/50">
                            <td class="px-4 py-2 font-medium text-slate-800">
                              {e.name}
                            </td>
                            <td class="px-4 py-2 text-right font-mono font-medium text-slate-900">
                              {formatMoney(e.amount)}
                            </td>
                          </tr>{/each}{/if}
                    </tbody>
                    <tfoot>
                      <tr class="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                        <td class="px-4 py-2.5">Gross Earnings</td>
                        <td class="px-4 py-2.5 text-right font-mono text-emerald-700">
                          {formatMoney(selectedPayslip.snapshot.grossEarnings)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                
                <div class="overflow-hidden rounded-xl border border-slate-200">
                  <div class="bg-slate-100 px-4 py-2.5">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Deductions Breakdown
                    </h3>
                  </div>
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                        <th class="px-4 py-2">Component</th>
                        <th class="px-4 py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      {#if deductions.length === 0}<tr>
                          <td colspan={2} class="px-4 py-3 text-center text-slate-400">
                            No deduction components
                          </td>
                        </tr>{:else}{#each deductions as d, idx}<tr class="hover:bg-slate-50/50">
                            <td class="px-4 py-2 font-medium text-slate-800">
                              {d.name}
                            </td>
                            <td class="px-4 py-2 text-right font-mono font-medium text-rose-700">
                              {formatMoney(d.amount)}
                            </td>
                          </tr>{/each}{/if}
                    </tbody>
                    <tfoot>
                      <tr class="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                        <td class="px-4 py-2.5">Total Deductions</td>
                        <td class="px-4 py-2.5 text-right font-mono text-rose-700">
                          {formatMoney(selectedPayslip.snapshot.totalDeductions)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              
              {#if contributions.length > 0}<div class="mt-5 rounded-xl border border-slate-200 p-3 text-xs bg-slate-50/50">
                  <p class="font-bold text-slate-700 mb-2">Employer Statutory Contributions</p>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {#each contributions as c, idx}<div class="flex justify-between border-b border-slate-200 pb-1">
                        <span class="text-slate-600">{c.name}:</span>
                        <span class="font-mono font-medium">{formatMoney(c.amount)}</span>
                      </div>{/each}
                    <div class="flex justify-between font-bold text-slate-900 sm:col-span-3 pt-1">
                      <span>Total Contributions:</span>
                      <span class="font-mono">{formatMoney(selectedPayslip.snapshot.employerContributions)}</span>
                    </div>
                  </div>
                </div>{/if}

              
              <div class="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4.5">
                <div>
                  <p class="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Net Disbursable Salary
                  </p>
                  <p class="text-xs text-emerald-800">
                    Gross Earnings minus Deductions (LOP double deduction safeguarded)
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-3xl font-extrabold text-emerald-950 font-mono">
                    {formatMoney(selectedPayslip.snapshot.netSalary)}
                  </p>
                </div>
              </div>

              
              <div class="mt-8 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
                <p>This is a computer-generated payslip voucher from SymphoWork V1 HRMS. No physical signature is required.</p>
                <p class="mt-0.5">Finalized snapshot generated on {new Date(selectedPayslip.payslip.generatedAt).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>{/if}
    </div>
