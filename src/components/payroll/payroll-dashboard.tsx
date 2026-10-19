"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  CreditCard,
  CheckCircle,
  Layers,
  Link as LinkIcon,
  UserCheck,
} from "lucide-react";

type Period = {
  id: string;
  month: number;
  year: number;
  status: string;
  periodStart: string;
  periodEnd: string;
};

type Run = {
  id: string;
  runNumber: string;
  status: string;
  employeeCount: number;
  grossTotal: number;
  deductionTotal: number;
  netTotal: number;
  employerContributionTotal: number;
  warningCount: number;
  errorCount: number;
};

type Structure = {
  id: string;
  name: string;
  currency: string;
  effectiveFrom: string;
  status: string;
};

type Component = {
  id: string;
  code: string;
  name: string;
  type: string;
  calculationMethod: string;
};

type Employee = {
  id: string;
  displayName: string;
  employeeId: string;
};

type Assignment = {
  assignment: {
    id: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
  };
  employeeName: string;
  structureName: string;
};

type ProfileRow = {
  profile: {
    id: string;
    employeeId: string;
    status: string;
    effectiveDate: string;
    taxRegime: string;
    pfApplicable: boolean;
    esiApplicable: boolean;
    professionalTaxApplicable: boolean;
    tdsApplicable: boolean;
  };
  employee: {
    id: string;
    displayName: string;
    employeeId: string;
    status: string;
  };
};

type ReviewRow = {
  employee: { displayName: string; employeeId: string };
  snapshot?: {
    grossEarnings: number;
    totalDeductions: number;
    netSalary: number;
    employerContributions: number;
    lopDays: number;
    payableDays: number;
    inputSnapshot: string;
  };
  lineItems: Array<{ name: string; type: string; amount: number }>;
};

const money = (value: number) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? "Unable to load payroll data.");
  }
  return body;
}

export function PayrollDashboard() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [review, setReview] = useState<{ run: Run; rows: ReviewRow[] } | null>(null);

  const [loading, setLoading] = useState(true);
  const [configAvailable, setConfigAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showConfig, setShowConfig] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState<string | null>(null);

  const [structureForm, setStructureForm] = useState({ name: "", currency: "INR", effectiveFrom: "" });
  const [componentForm, setComponentForm] = useState({ code: "", name: "", type: "earning", calculationMethod: "fixed" });
  const [linkForm, setLinkForm] = useState({ componentId: "", fixedAmount: "", percentage: "", displayOrder: "1" });
  const [assignmentForm, setAssignmentForm] = useState({ employeeId: "", structureId: "", effectiveFrom: "", effectiveTo: "", revisionReason: "" });
  const [profileForm, setProfileForm] = useState({
    employeeId: "",
    status: "eligible" as "eligible" | "ineligible" | "on_hold",
    effectiveDate: new Date().toISOString().slice(0, 10),
    taxRegime: "new" as "new" | "old",
    pfApplicable: false,
    esiApplicable: false,
    professionalTaxApplicable: false,
    tdsApplicable: true,
  });

  const [finalizingRunId, setFinalizingRunId] = useState<string | null>(null);
  const [payingRun, setPayingRun] = useState<Run | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentReference: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [period, run, employee, assignment] = await Promise.all([
        readJson<{ periods: Period[] }>("/api/app/payroll/periods"),
        readJson<{ runs: Run[] }>("/api/app/payroll/runs"),
        readJson<{ employees: Employee[] }>("/api/app/payroll/employee-options"),
        readJson<{ assignments: Assignment[] }>("/api/app/payroll/salary-assignments"),
      ]);
      setPeriods(period.periods);
      setRuns(run.runs);
      setEmployees(employee.employees);
      setAssignments(assignment.assignments);

      try {
        const [config, profs] = await Promise.all([
          readJson<{ structures: Structure[]; components: Component[] }>("/api/app/payroll/config"),
          readJson<{ profiles: ProfileRow[] }>("/api/app/payroll/profiles"),
        ]);
        setStructures(config.structures);
        setComponents(config.components);
        setProfiles(profs.profiles);
        setConfigAvailable(true);
      } catch {
        setConfigAvailable(false);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load payroll workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const action = async (url: string, options: RequestInit) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(url, options);
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Payroll action failed.");
      setMessage("Payroll update completed successfully.");
      await load();
      return body;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payroll action failed.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const createPeriod = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    await action("/api/app/payroll/periods", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ month: Number(data.get("month")), year: Number(data.get("year")) }),
    });
    form.reset();
  };

  const createStructure = async (event: React.FormEvent) => {
    event.preventDefault();
    await action("/api/app/payroll/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "structure", ...structureForm }),
    });
    setStructureForm({ name: "", currency: "INR", effectiveFrom: "" });
  };

  const activateStructure = async (structureId: string) => {
    await action("/api/app/payroll/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "activate_structure", structureId }),
    });
  };

  const linkComponent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!showLinkModal) return;
    await action("/api/app/payroll/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "link_component",
        structureId: showLinkModal,
        componentId: linkForm.componentId,
        fixedAmount: linkForm.fixedAmount ? Number(linkForm.fixedAmount) : undefined,
        percentage: linkForm.percentage ? Number(linkForm.percentage) : undefined,
        displayOrder: Number(linkForm.displayOrder) || 1,
      }),
    });
    setShowLinkModal(null);
    setLinkForm({ componentId: "", fixedAmount: "", percentage: "", displayOrder: "1" });
  };

  const createComponent = async (event: React.FormEvent) => {
    event.preventDefault();
    await action("/api/app/payroll/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "component", ...componentForm }),
    });
    setComponentForm({ code: "", name: "", type: "earning", calculationMethod: "fixed" });
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    await action("/api/app/payroll/profiles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    setShowProfiles(false);
  };

  const assignSalary = async (event: React.FormEvent) => {
    event.preventDefault();
    await action("/api/app/payroll/salary-assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(assignmentForm),
    });
    setShowAssignment(false);
  };

  const calculate = async (periodId: string) => {
    await action("/api/app/payroll/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ periodId }),
    });
  };

  const reviewRun = async (run: Run) => {
    try {
      const body = await readJson<{ run: Run; rows: ReviewRow[] }>(`/api/app/payroll/runs/${run.id}`);
      setReview(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load payroll review.");
    }
  };

  const recordPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payingRun) return;
    await action(`/api/app/payroll/runs/${payingRun.id}/pay`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(paymentForm),
    });
    setPayingRun(null);
    setPaymentForm({ paymentReference: "", paymentDate: new Date().toISOString().slice(0, 10), notes: "" });
  };

  const latest = runs[0];

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
          {message}
        </p>
      )}

      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted">Current period</p>
            <p className="mt-2 text-xl font-bold">
              {periods[0] ? `${String(periods[0].month).padStart(2, "0")}/${periods[0].year}` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted">Latest run</p>
            <p className="mt-2 text-xl font-bold capitalize">
              {latest?.status?.replaceAll("_", " ") ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted">Employees covered</p>
            <p className="mt-2 text-xl font-bold">{latest?.employeeCount ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted">Gross payroll</p>
            <p className="mt-2 text-xl font-bold">{latest ? money(latest.grossTotal) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted">Net payroll</p>
            <p className="mt-2 text-xl font-bold">{latest ? money(latest.netTotal) : "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setShowConfig(!showConfig)} disabled={!configAvailable} className="gap-1.5">
          <Layers className="size-4" />
          <span>{showConfig ? "Hide configuration" : "Salary structures & components"}</span>
        </Button>
        <Button variant="secondary" onClick={() => setShowAssignment(!showAssignment)} disabled={!configAvailable}>
          Assign salary structure
        </Button>
        <Button variant="secondary" onClick={() => setShowProfiles(!showProfiles)} disabled={!configAvailable} className="gap-1.5">
          <UserCheck className="size-4" />
          <span>Employee payroll profiles</span>
        </Button>

        <Card className="ml-auto border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            <form onSubmit={createPeriod} className="flex flex-wrap gap-2">
              <select required name="month" aria-label="Payroll month" className="h-10 rounded-lg border bg-surface px-3">
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {String(index + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <Input
                required
                name="year"
                aria-label="Payroll year"
                type="number"
                defaultValue={new Date().getFullYear()}
                className="w-28"
              />
              <Button type="submit" variant="secondary" disabled={busy}>
                Create period
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {!configAvailable && (
        <p className="text-sm text-muted">
          Payroll configuration is restricted to authorized Finance Admin, HR Admin, or Organization Owner roles.
        </p>
      )}

      {/* Salary Structures and Components Configuration View */}
      {showConfig && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Salary Structures Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Salary structures & lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={createStructure} className="grid gap-2 sm:grid-cols-3">
                <Input
                  required
                  placeholder="Structure name"
                  value={structureForm.name}
                  onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                />
                <Input
                  required
                  placeholder="Currency (e.g. INR)"
                  value={structureForm.currency}
                  onChange={(e) => setStructureForm({ ...structureForm, currency: e.target.value })}
                />
                <Input
                  required
                  type="date"
                  aria-label="Structure effective date"
                  value={structureForm.effectiveFrom}
                  onChange={(e) => setStructureForm({ ...structureForm, effectiveFrom: e.target.value })}
                />
                <Button type="submit" disabled={busy} className="sm:col-span-3">
                  Create draft structure
                </Button>
              </form>

              {structures.length === 0 ? (
                <p className="text-sm text-muted">No salary structures configured.</p>
              ) : (
                structures.map((structure) => (
                  <div key={structure.id} className="rounded-xl border p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{structure.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          structure.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {structure.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {structure.currency} · effective from {structure.effectiveFrom}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowLinkModal(structure.id)}
                        className="h-8 gap-1 text-xs"
                      >
                        <LinkIcon className="size-3" />
                        <span>Link component</span>
                      </Button>
                      {structure.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => activateStructure(structure.id)}
                          disabled={busy}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Activate structure
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Salary Components Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Salary components library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={createComponent} className="grid gap-2 sm:grid-cols-2">
                <Input
                  required
                  placeholder="Code (e.g. BASIC)"
                  value={componentForm.code}
                  onChange={(e) => setComponentForm({ ...componentForm, code: e.target.value })}
                />
                <Input
                  required
                  placeholder="Name (e.g. Basic Salary)"
                  value={componentForm.name}
                  onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                />
                <select
                  aria-label="Component type"
                  className="h-10 rounded-lg border bg-surface px-3 text-sm"
                  value={componentForm.type}
                  onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value })}
                >
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                  <option value="employer_contribution">Employer contribution</option>
                </select>
                <select
                  aria-label="Calculation method"
                  className="h-10 rounded-lg border bg-surface px-3 text-sm"
                  value={componentForm.calculationMethod}
                  onChange={(e) => setComponentForm({ ...componentForm, calculationMethod: e.target.value })}
                >
                  <option value="fixed">Fixed amount</option>
                  <option value="percentage">Percentage</option>
                  <option value="formula">Formula reference</option>
                </select>
                <Button type="submit" disabled={busy} className="sm:col-span-2">
                  Add component
                </Button>
              </form>

              {components.length === 0 ? (
                <p className="text-sm text-muted">No salary components configured.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {components.map((component) => (
                    <div key={component.id} className="rounded-lg border p-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold">
                          {component.code} · {component.name}
                        </span>
                        <span className="capitalize text-muted">{component.calculationMethod}</span>
                      </div>
                      <p className="mt-0.5 capitalize text-muted">{component.type.replaceAll("_", " ")}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Link Component Modal Dialog */}
      {showLinkModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Link component to structure</CardTitle>
              <p className="text-xs text-muted">
                Assign a fixed amount or percentage of salary to this structure.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={linkComponent} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted">Salary component</label>
                  <select
                    required
                    className="mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm"
                    value={linkForm.componentId}
                    onChange={(e) => setLinkForm({ ...linkForm, componentId: e.target.value })}
                  >
                    <option value="">Select component</option>
                    {components.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} · {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Fixed amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    value={linkForm.fixedAmount}
                    onChange={(e) => setLinkForm({ ...linkForm, fixedAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Percentage (% of basic/base)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50"
                    value={linkForm.percentage}
                    onChange={(e) => setLinkForm({ ...linkForm, percentage: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Display sequence order</label>
                  <Input
                    type="number"
                    value={linkForm.displayOrder}
                    onChange={(e) => setLinkForm({ ...linkForm, displayOrder: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowLinkModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={busy}>
                    Save component link
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee Payroll Profiles Management */}
      {showProfiles && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employee payroll profiles & eligibility</CardTitle>
                <p className="text-xs text-muted">
                  Configure payroll eligibility, statutory deductions (PF, ESI, PT), and income tax regimes.
                </p>
              </div>
              <UserCheck className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-4 rounded-xl border p-4 bg-slate-50/50">
              <div>
                <label className="text-xs font-medium text-muted">Employee</label>
                <select
                  required
                  aria-label="Profile employee"
                  className="mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm"
                  value={profileForm.employeeId}
                  onChange={(e) => setProfileForm({ ...profileForm, employeeId: e.target.value })}
                >
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.displayName} ({e.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted">Eligibility status</label>
                <select
                  aria-label="Profile status"
                  className="mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm"
                  value={profileForm.status}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      status: e.target.value as "eligible" | "ineligible" | "on_hold",
                    })
                  }
                >
                  <option value="eligible">Eligible</option>
                  <option value="ineligible">Ineligible</option>
                  <option value="on_hold">On hold</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted">Tax regime</label>
                <select
                  aria-label="Tax regime"
                  className="mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm"
                  value={profileForm.taxRegime}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, taxRegime: e.target.value as "new" | "old" })
                  }
                >
                  <option value="new">New regime</option>
                  <option value="old">Old regime</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted">Effective date</label>
                <Input
                  required
                  type="date"
                  value={profileForm.effectiveDate}
                  onChange={(e) => setProfileForm({ ...profileForm, effectiveDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-4 flex flex-wrap gap-4 pt-1 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.pfApplicable}
                    onChange={(e) => setProfileForm({ ...profileForm, pfApplicable: e.target.checked })}
                  />
                  <span>Provident Fund (PF)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.esiApplicable}
                    onChange={(e) => setProfileForm({ ...profileForm, esiApplicable: e.target.checked })}
                  />
                  <span>Employee State Insurance (ESI)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.professionalTaxApplicable}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, professionalTaxApplicable: e.target.checked })
                    }
                  />
                  <span>Professional Tax (PT)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.tdsApplicable}
                    onChange={(e) => setProfileForm({ ...profileForm, tdsApplicable: e.target.checked })}
                  />
                  <span>TDS / Income Tax</span>
                </label>
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <Button type="submit" disabled={busy}>
                  Save employee payroll profile
                </Button>
              </div>
            </form>

            {profiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted">Configured employee profiles ({profiles.length})</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {profiles.map(({ profile, employee }) => (
                    <div key={profile.id} className="rounded-xl border p-3 text-xs space-y-1 bg-surface">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">{employee.displayName}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                            profile.status === "eligible"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {profile.status}
                        </span>
                      </div>
                      <p className="text-muted">ID: {employee.employeeId} · {profile.taxRegime} tax regime</p>
                      <p className="text-[11px] text-slate-500">
                        PF: {profile.pfApplicable ? "✓" : "✗"} · ESI: {profile.esiApplicable ? "✓" : "✗"} · PT:{" "}
                        {profile.professionalTaxApplicable ? "✓" : "✗"} · TDS: {profile.tdsApplicable ? "✓" : "✗"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Salary Assignment View */}
      {showAssignment && (
        <Card>
          <CardHeader>
            <CardTitle>Effective-dated salary structure assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={assignSalary} className="grid gap-3 md:grid-cols-4">
              <select
                required
                aria-label="Salary employee"
                className="h-10 rounded-lg border bg-surface px-3 text-sm"
                value={assignmentForm.employeeId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, employeeId: e.target.value })}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.displayName} ({employee.employeeId})
                  </option>
                ))}
              </select>
              <select
                required
                aria-label="Salary structure"
                className="h-10 rounded-lg border bg-surface px-3 text-sm"
                value={assignmentForm.structureId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, structureId: e.target.value })}
              >
                <option value="">Select structure</option>
                {structures.map((structure) => (
                  <option key={structure.id} value={structure.id}>
                    {structure.name} ({structure.status})
                  </option>
                ))}
              </select>
              <Input
                required
                type="date"
                aria-label="Salary effective from"
                value={assignmentForm.effectiveFrom}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, effectiveFrom: e.target.value })}
              />
              <Input
                type="date"
                aria-label="Salary effective to"
                value={assignmentForm.effectiveTo}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, effectiveTo: e.target.value })}
              />
              <Input
                placeholder="Revision reason (e.g. Annual Appraisal)"
                value={assignmentForm.revisionReason}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, revisionReason: e.target.value })}
                className="md:col-span-3"
              />
              <Button type="submit" disabled={busy}>
                Assign structure
              </Button>
            </form>
            {assignments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-muted">Active assignments ({assignments.length})</p>
                {assignments.map((row) => (
                  <div key={row.assignment.id} className="rounded-lg border p-3 text-sm">
                    <span className="font-medium">
                      {row.employeeName} · {row.structureName}
                    </span>
                    <p className="mt-1 text-xs text-muted">
                      {row.assignment.effectiveFrom} → {row.assignment.effectiveTo ?? "open-ended"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payroll Periods */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll periods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted">Loading payroll periods…</p>
          ) : periods.length === 0 ? (
            <p className="text-sm text-muted">No payroll periods yet.</p>
          ) : (
            periods.map((period) => (
              <div key={period.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div>
                  <p className="font-semibold text-foreground">
                    {String(period.month).padStart(2, "0")}/{period.year}
                  </p>
                  <p className="text-xs capitalize text-muted">
                    {period.status.replaceAll("_", " ")} · {period.periodStart} to {period.periodEnd}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => calculate(period.id)}
                  disabled={busy || ["finalized", "processing", "under_review", "approved", "locked"].includes(period.status)}
                >
                  Calculate payroll
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Payroll Runs & Payment Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll runs & payment tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {runs.length === 0 ? (
            <p className="text-sm text-muted">No payroll runs yet.</p>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{run.runNumber}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          run.status === "locked"
                            ? "bg-emerald-100 text-emerald-800"
                            : run.status === "finalized"
                            ? "bg-indigo-100 text-indigo-800"
                            : run.status === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-surface text-muted"
                        }`}
                      >
                        {run.status === "locked" ? "Paid & Locked" : run.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {run.employeeCount} employee(s) · Gross: {money(run.grossTotal)} · Deductions: {money(run.deductionTotal)} · Net:{" "}
                      <strong className="text-foreground">{money(run.netTotal)}</strong>
                    </p>
                    <p className="text-xs text-muted">
                      Employer contributions: {money(run.employerContributionTotal)} · Warnings: {run.warningCount} · Errors: {run.errorCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => reviewRun(run)}>
                    Review calculations
                  </Button>
                  {run.status === "approved" && (
                    <Button size="sm" disabled={busy} onClick={() => setFinalizingRunId(run.id)}>
                      Finalize run
                    </Button>
                  )}
                  {run.status === "under_review" && (
                    <Button size="sm" variant="secondary" onClick={() => window.location.assign("/app/approvals")}>
                      Open approval inbox
                    </Button>
                  )}
                  {run.status === "finalized" && (
                    <Button
                      size="sm"
                      onClick={() => setPayingRun(run)}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <CreditCard className="size-3.5" />
                      <span>Record salary payment</span>
                    </Button>
                  )}
                  {run.status === "locked" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle className="size-3.5 text-emerald-600" />
                      Payment recorded · Immutable locked run
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Review Calculations Panel */}
      {review && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Run review · {review.run.runNumber}</CardTitle>
                <p className="text-sm text-muted">
                  Server-calculated payroll snapshots. Finalized and locked rows are permanent.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReview(null)}>
                Close review
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.rows.length === 0 ? (
              <p className="text-sm text-muted">No employee rows were generated.</p>
            ) : (
              review.rows.map((row) => (
                <div key={row.employee.employeeId} className="rounded-xl border p-4">
                  <div className="flex flex-wrap justify-between items-center">
                    <span className="font-semibold text-foreground">
                      {row.employee.displayName} ({row.employee.employeeId})
                    </span>
                    <span className="text-base font-bold text-primary">
                      Net {money(row.snapshot?.netSalary ?? 0)}
                    </span>
                  </div>
                  {row.snapshot && (
                    <p className="mt-1 text-sm text-muted">
                      Gross: {money(row.snapshot.grossEarnings)} · Deductions: {money(row.snapshot.totalDeductions)} · Employer:{" "}
                      {money(row.snapshot.employerContributions)} · Payable days: {row.snapshot.payableDays} · LOP: {row.snapshot.lopDays} day(s)
                    </p>
                  )}
                  <div className="mt-2.5 grid gap-1.5 text-xs text-muted sm:grid-cols-2 rounded-lg bg-slate-50 p-2.5">
                    {row.lineItems.map((line, index) => (
                      <span key={`${line.name}-${index}`} className="flex justify-between">
                        <span>{line.name}:</span>
                        <strong className="text-slate-800">{money(line.amount)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Record Payment Dialog */}
      {payingRun && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Record Payment for {payingRun.runNumber}
              </CardTitle>
              <p className="text-xs text-muted">
                Confirm salary disbursement reference. This will transition the run to locked status and preserve an audit log.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={recordPayment} className="space-y-3">
                <div>
                  <p className="text-xs text-muted">Disbursable Amount</p>
                  <p className="text-xl font-extrabold text-emerald-700 font-mono">
                    {money(payingRun.netTotal)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Payment Reference / UTR Number</label>
                  <Input
                    required
                    placeholder="e.g. HDFC-NEFT-20261019-01"
                    value={paymentForm.paymentReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Payment Date</label>
                  <Input
                    required
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Notes (Optional)</label>
                  <Input
                    placeholder="e.g. Batch bank disbursement confirmed"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <Button type="button" variant="secondary" onClick={() => setPayingRun(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    Confirm & Record Payment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Finalize Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(finalizingRunId)}
        onOpenChange={(open) => {
          if (!open) setFinalizingRunId(null);
        }}
        title="Finalize Approved Payroll Run"
        description="Finalize this approved payroll run? Once finalized, this payroll run and all generated employee salary vouchers become permanently immutable."
        confirmText="Finalize Run"
        cancelText="Cancel"
        variant="warning"
        isLoading={busy}
        onConfirm={async () => {
          if (!finalizingRunId) return;
          const id = finalizingRunId;
          setFinalizingRunId(null);
          await action(`/api/app/payroll/runs/${id}/finalize`, { method: "POST" });
          setReview(null);
        }}
      />
    </div>
  );
}
