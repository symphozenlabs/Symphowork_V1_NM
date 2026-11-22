<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Input from "$lib/components/ui/Input.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
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
let periods=$state<Period[]>(untrack(()=>([])));
const setPeriods=(next:typeof periods|((previous:typeof periods)=>typeof periods))=>{periods=typeof next==="function"?(next as (previous:typeof periods)=>typeof periods)(periods):next;};
let runs=$state<Run[]>(untrack(()=>([])));
const setRuns=(next:typeof runs|((previous:typeof runs)=>typeof runs))=>{runs=typeof next==="function"?(next as (previous:typeof runs)=>typeof runs)(runs):next;};
let structures=$state<Structure[]>(untrack(()=>([])));
const setStructures=(next:typeof structures|((previous:typeof structures)=>typeof structures))=>{structures=typeof next==="function"?(next as (previous:typeof structures)=>typeof structures)(structures):next;};
let components=$state<Component[]>(untrack(()=>([])));
const setComponents=(next:typeof components|((previous:typeof components)=>typeof components))=>{components=typeof next==="function"?(next as (previous:typeof components)=>typeof components)(components):next;};
let employees=$state<Employee[]>(untrack(()=>([])));
const setEmployees=(next:typeof employees|((previous:typeof employees)=>typeof employees))=>{employees=typeof next==="function"?(next as (previous:typeof employees)=>typeof employees)(employees):next;};
let assignments=$state<Assignment[]>(untrack(()=>([])));
const setAssignments=(next:typeof assignments|((previous:typeof assignments)=>typeof assignments))=>{assignments=typeof next==="function"?(next as (previous:typeof assignments)=>typeof assignments)(assignments):next;};
let profiles=$state<ProfileRow[]>(untrack(()=>([])));
const setProfiles=(next:typeof profiles|((previous:typeof profiles)=>typeof profiles))=>{profiles=typeof next==="function"?(next as (previous:typeof profiles)=>typeof profiles)(profiles):next;};
let review=$state<{ run: Run; rows: ReviewRow[] } | null>(untrack(()=>(null)));
const setReview=(next:typeof review|((previous:typeof review)=>typeof review))=>{review=typeof next==="function"?(next as (previous:typeof review)=>typeof review)(review):next;};
let loading=$state(untrack(()=>(true)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let configAvailable=$state(untrack(()=>(true)));
const setConfigAvailable=(next:typeof configAvailable|((previous:typeof configAvailable)=>typeof configAvailable))=>{configAvailable=typeof next==="function"?(next as (previous:typeof configAvailable)=>typeof configAvailable)(configAvailable):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let error=$state(untrack(()=>("")));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let showConfig=$state(untrack(()=>(false)));
const setShowConfig=(next:typeof showConfig|((previous:typeof showConfig)=>typeof showConfig))=>{showConfig=typeof next==="function"?(next as (previous:typeof showConfig)=>typeof showConfig)(showConfig):next;};
let showAssignment=$state(untrack(()=>(false)));
const setShowAssignment=(next:typeof showAssignment|((previous:typeof showAssignment)=>typeof showAssignment))=>{showAssignment=typeof next==="function"?(next as (previous:typeof showAssignment)=>typeof showAssignment)(showAssignment):next;};
let showProfiles=$state(untrack(()=>(false)));
const setShowProfiles=(next:typeof showProfiles|((previous:typeof showProfiles)=>typeof showProfiles))=>{showProfiles=typeof next==="function"?(next as (previous:typeof showProfiles)=>typeof showProfiles)(showProfiles):next;};
let showLinkModal=$state<string | null>(untrack(()=>(null)));
const setShowLinkModal=(next:typeof showLinkModal|((previous:typeof showLinkModal)=>typeof showLinkModal))=>{showLinkModal=typeof next==="function"?(next as (previous:typeof showLinkModal)=>typeof showLinkModal)(showLinkModal):next;};
let structureForm=$state(untrack(()=>({ name: "", currency: "INR", effectiveFrom: "" })));
const setStructureForm=(next:typeof structureForm|((previous:typeof structureForm)=>typeof structureForm))=>{structureForm=typeof next==="function"?(next as (previous:typeof structureForm)=>typeof structureForm)(structureForm):next;};
let componentForm=$state(untrack(()=>({ code: "", name: "", type: "earning", calculationMethod: "fixed" })));
const setComponentForm=(next:typeof componentForm|((previous:typeof componentForm)=>typeof componentForm))=>{componentForm=typeof next==="function"?(next as (previous:typeof componentForm)=>typeof componentForm)(componentForm):next;};
let linkForm=$state(untrack(()=>({ componentId: "", fixedAmount: "", percentage: "", displayOrder: "1" })));
const setLinkForm=(next:typeof linkForm|((previous:typeof linkForm)=>typeof linkForm))=>{linkForm=typeof next==="function"?(next as (previous:typeof linkForm)=>typeof linkForm)(linkForm):next;};
let assignmentForm=$state(untrack(()=>({ employeeId: "", structureId: "", effectiveFrom: "", effectiveTo: "", revisionReason: "" })));
const setAssignmentForm=(next:typeof assignmentForm|((previous:typeof assignmentForm)=>typeof assignmentForm))=>{assignmentForm=typeof next==="function"?(next as (previous:typeof assignmentForm)=>typeof assignmentForm)(assignmentForm):next;};
let profileForm=$state(untrack(()=>({
    employeeId: "",
    status: "eligible" as "eligible" | "ineligible" | "on_hold",
    effectiveDate: new Date().toISOString().slice(0, 10),
    taxRegime: "new" as "new" | "old",
    pfApplicable: false,
    esiApplicable: false,
    professionalTaxApplicable: false,
    tdsApplicable: true,
  })));
const setProfileForm=(next:typeof profileForm|((previous:typeof profileForm)=>typeof profileForm))=>{profileForm=typeof next==="function"?(next as (previous:typeof profileForm)=>typeof profileForm)(profileForm):next;};
let finalizingRunId=$state<string | null>(untrack(()=>(null)));
const setFinalizingRunId=(next:typeof finalizingRunId|((previous:typeof finalizingRunId)=>typeof finalizingRunId))=>{finalizingRunId=typeof next==="function"?(next as (previous:typeof finalizingRunId)=>typeof finalizingRunId)(finalizingRunId):next;};
let payingRun=$state<Run | null>(untrack(()=>(null)));
const setPayingRun=(next:typeof payingRun|((previous:typeof payingRun)=>typeof payingRun))=>{payingRun=typeof next==="function"?(next as (previous:typeof payingRun)=>typeof payingRun)(payingRun):next;};
let paymentForm=$state(untrack(()=>({
    paymentReference: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
  })));
const setPaymentForm=(next:typeof paymentForm|((previous:typeof paymentForm)=>typeof paymentForm))=>{paymentForm=typeof next==="function"?(next as (previous:typeof paymentForm)=>typeof paymentForm)(paymentForm):next;};
const load=$derived.by(()=>{return async () => {
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
  };});
$effect(()=>{load;return untrack(() => {
    void load();
  });});
const action = async (url: string, options: RequestInit) => {
    if (busy) return null;
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
const createPeriod = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const result = await action("/api/app/payroll/periods", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ month: Number(data.get("month")), year: Number(data.get("year")) }),
    });
    if (!result) return;
    form.reset();
  };
const createStructure = async (event: SubmitEvent) => {
    event.preventDefault();
    const result = await action("/api/app/payroll/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "structure", ...structureForm }),
    });
    if (!result) return;
    setStructureForm({ name: "", currency: "INR", effectiveFrom: "" });
  };
const activateStructure = async (structureId: string) => {
    await action("/api/app/payroll/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "activate_structure", structureId }),
    });
  };
const linkComponent = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!showLinkModal) return;
    const result = await action("/api/app/payroll/config", {
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
    if (!result) return;
    setShowLinkModal(null);
    setLinkForm({ componentId: "", fixedAmount: "", percentage: "", displayOrder: "1" });
  };
const createComponent = async (event: SubmitEvent) => {
    event.preventDefault();
    const result = await action("/api/app/payroll/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "component", ...componentForm }),
    });
    if (!result) return;
    setComponentForm({ code: "", name: "", type: "earning", calculationMethod: "fixed" });
  };
const saveProfile = async (event: SubmitEvent) => {
    event.preventDefault();
    const result = await action("/api/app/payroll/profiles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    if (!result) return;
    setShowProfiles(false);
  };
const assignSalary = async (event: SubmitEvent) => {
    event.preventDefault();
    const result = await action("/api/app/payroll/salary-assignments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(assignmentForm),
    });
    if (!result) return;
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
const recordPayment = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!payingRun) return;
    const result = await action(`/api/app/payroll/runs/${payingRun.id}/pay`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(paymentForm),
    });
    if (!result) return;
    setPayingRun(null);
    setPaymentForm({ paymentReference: "", paymentDate: new Date().toISOString().slice(0, 10), notes: "" });
  };
const latest=$derived(runs[0]);
</script>
<div class="space-y-6">
      {#if error}<p role="alert" class="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>{/if}
      {#if message}<p role="status" class="rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
          {message}
        </p>{/if}

      
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted">Current period</p>
            <p class="mt-2 text-xl font-bold">
              {#if periods[0]}{`${String(periods[0].month).padStart(2, "0")}/${periods[0].year}`}{:else}{"—"}{/if}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted">Latest run</p>
            <p class="mt-2 text-xl font-bold capitalize">
              {latest?.status?.replaceAll("_", " ") ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted">Employees covered</p>
            <p class="mt-2 text-xl font-bold">{latest?.employeeCount ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted">Gross payroll</p>
            <p class="mt-2 text-xl font-bold">{#if latest}{money(latest.grossTotal)}{:else}{"—"}{/if}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <p class="text-xs text-muted">Net payroll</p>
            <p class="mt-2 text-xl font-bold">{#if latest}{money(latest.netTotal)}{:else}{"—"}{/if}</p>
          </CardContent>
        </Card>
      </div>

      
      <div class="flex flex-wrap items-center gap-2">
        <Button onclick={() => setShowConfig(!showConfig)} disabled={!configAvailable} class="gap-1.5">
          <SvgIcon name="Layers" class="size-4" />
          <span>{#if showConfig}{"Hide configuration"}{:else}{"Salary structures & components"}{/if}</span>
        </Button>
        <Button variant="secondary" onclick={() => setShowAssignment(!showAssignment)} disabled={!configAvailable}>
          Assign salary structure
        </Button>
        <Button variant="secondary" onclick={() => setShowProfiles(!showProfiles)} disabled={!configAvailable} class="gap-1.5">
          <SvgIcon name="UserCheck" class="size-4" />
          <span>Employee payroll profiles</span>
        </Button>

        <Card class="ml-auto border-0 bg-transparent shadow-none">
          <CardContent class="p-0">
            <form onsubmit={createPeriod} class="flex flex-wrap gap-2">
              <select required name="month" aria-label="Payroll month" class="h-10 rounded-lg border bg-surface px-3">
                {#each Array.from({length:12},(_,index)=>index+1) as month}<option value={month}>{String(month).padStart(2,"0")}</option>{/each}
              </select>
              <Input required name="year" aria-label="Payroll year" type="number" value={new Date().getFullYear()} class="w-28" />
              <Button type="submit" variant="secondary" disabled={busy}>
                Create period
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {#if !configAvailable}<p class="text-sm text-muted">
          Payroll configuration is restricted to authorized Finance Admin, HR Admin, or Organization Owner roles.
        </p>{/if}

      
      {#if showConfig}<div class="grid gap-5 lg:grid-cols-2">
          
          <Card>
            <CardHeader>
              <CardTitle>Salary structures & lifecycle</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <form onsubmit={createStructure} class="grid gap-2 sm:grid-cols-3">
                <Input required placeholder="Structure name" value={structureForm.name} onchange={(e) => setStructureForm({ ...structureForm, name: e.currentTarget.value })} />
                <Input required placeholder="Currency (e.g. INR)" value={structureForm.currency} onchange={(e) => setStructureForm({ ...structureForm, currency: e.currentTarget.value })} />
                <Input required type="date" aria-label="Structure effective date" value={structureForm.effectiveFrom} onchange={(e) => setStructureForm({ ...structureForm, effectiveFrom: e.currentTarget.value })} />
                <Button type="submit" disabled={busy} class="sm:col-span-3">
                  Create draft structure
                </Button>
              </form>

              {#if structures.length === 0}<p class="text-sm text-muted">No salary structures configured.</p>{:else}{#each structures as structure}<div class="rounded-xl border p-3 text-sm space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-foreground">{structure.name}</span>
                      <span class={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          structure.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                        {structure.status}
                      </span>
                    </div>
                    <p class="text-xs text-muted">
                      {structure.currency} · effective from {structure.effectiveFrom}
                    </p>
                    <div class="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="secondary" onclick={() => setShowLinkModal(structure.id)} class="h-8 gap-1 text-xs">
                        <SvgIcon name="LinkIcon" class="size-3" />
                        <span>Link component</span>
                      </Button>
                      {#if structure.status === "draft"}<Button size="sm" onclick={() => activateStructure(structure.id)} disabled={busy} class="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                          Activate structure
                        </Button>{/if}
                    </div>
                  </div>{/each}{/if}
            </CardContent>
          </Card>

          
          <Card>
            <CardHeader>
              <CardTitle>Salary components library</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <form onsubmit={createComponent} class="grid gap-2 sm:grid-cols-2">
                <Input required placeholder="Code (e.g. BASIC)" value={componentForm.code} onchange={(e) => setComponentForm({ ...componentForm, code: e.currentTarget.value })} />
                <Input required placeholder="Name (e.g. Basic Salary)" value={componentForm.name} onchange={(e) => setComponentForm({ ...componentForm, name: e.currentTarget.value })} />
                <select aria-label="Component type" class="h-10 rounded-lg border bg-surface px-3 text-sm" value={componentForm.type} onchange={(e) => setComponentForm({ ...componentForm, type: e.currentTarget.value })}>
                  <option value="earning">Earning</option>
                  <option value="deduction">Deduction</option>
                  <option value="employer_contribution">Employer contribution</option>
                </select>
                <select aria-label="Calculation method" class="h-10 rounded-lg border bg-surface px-3 text-sm" value={componentForm.calculationMethod} onchange={(e) => setComponentForm({ ...componentForm, calculationMethod: e.currentTarget.value })}>
                  <option value="fixed">Fixed amount</option>
                  <option value="percentage">Percentage</option>
                  <option value="formula">Formula reference</option>
                </select>
                <Button type="submit" disabled={busy} class="sm:col-span-2">
                  Add component
                </Button>
              </form>

              {#if components.length === 0}<p class="text-sm text-muted">No salary components configured.</p>{:else}<div class="max-h-80 overflow-y-auto space-y-2">
                  {#each components as component}<div class="rounded-lg border p-2.5 text-xs">
                      <div class="flex justify-between">
                        <span class="font-semibold">
                          {component.code} · {component.name}
                        </span>
                        <span class="capitalize text-muted">{component.calculationMethod}</span>
                      </div>
                      <p class="mt-0.5 capitalize text-muted">{component.type.replaceAll("_", " ")}</p>
                    </div>{/each}
                </div>{/if}
            </CardContent>
          </Card>
        </div>{/if}

      
      {#if showLinkModal}<div role="dialog" aria-modal="true" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card class="w-full max-w-md bg-white shadow-xl">
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Link component to structure</CardTitle>
              <p class="text-xs text-muted">
                Assign a fixed amount or percentage of salary to this structure.
              </p>
            </CardHeader>
            <CardContent>
              <form onsubmit={linkComponent} class="space-y-3">
                <div>
                  <label for="payroll-field-1" class="text-xs font-medium text-muted">Salary component</label>
                  <select id="payroll-field-1" required class="mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm" value={linkForm.componentId} onchange={(e) => setLinkForm({ ...linkForm, componentId: e.currentTarget.value })}>
                    <option value="">Select component</option>
                    {#each components as c}<option value={c.id}>
                        {c.code} · {c.name} ({c.type})
                      </option>{/each}
                  </select>
                </div>
                <div>
                  <label for="payroll-field-2" class="text-xs font-medium text-muted">Fixed amount (₹)</label>
                  <Input id="payroll-field-2" type="number" placeholder="e.g. 50000" value={linkForm.fixedAmount} onchange={(e) => setLinkForm({ ...linkForm, fixedAmount: e.currentTarget.value })} />
                </div>
                <div>
                  <label for="payroll-field-3" class="text-xs font-medium text-muted">Percentage (% of basic/base)</label>
                  <Input id="payroll-field-3" type="number" step="0.01" placeholder="e.g. 50" value={linkForm.percentage} onchange={(e) => setLinkForm({ ...linkForm, percentage: e.currentTarget.value })} />
                </div>
                <div>
                  <label for="payroll-field-4" class="text-xs font-medium text-muted">Display sequence order</label>
                  <Input id="payroll-field-4" type="number" value={linkForm.displayOrder} onchange={(e) => setLinkForm({ ...linkForm, displayOrder: e.currentTarget.value })} />
                </div>
                <div class="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onclick={() => setShowLinkModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={busy}>
                    Save component link
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>{/if}

      
      {#if showProfiles}<Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Employee payroll profiles & eligibility</CardTitle>
                <p class="text-xs text-muted">
                  Configure payroll eligibility, statutory deductions (PF, ESI, PT), and income tax regimes.
                </p>
              </div>
              <SvgIcon name="UserCheck" class="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <form onsubmit={saveProfile} class="grid gap-3 sm:grid-cols-4 rounded-xl border p-4 bg-slate-50/50">
              <div>
                <label for="payroll-field-5" class="text-xs font-medium text-muted">Employee</label>
                <select id="payroll-field-5" required aria-label="Profile employee" class="mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm" value={profileForm.employeeId} onchange={(e) => setProfileForm({ ...profileForm, employeeId: e.currentTarget.value })}>
                  <option value="">Select employee</option>
                  {#each employees as e}<option value={e.id}>
                      {e.displayName} ({e.employeeId})
                    </option>{/each}
                </select>
              </div>

              <div>
                <label for="payroll-field-6" class="text-xs font-medium text-muted">Eligibility status</label>
                <select id="payroll-field-6" aria-label="Profile status" class="mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm" value={profileForm.status} onchange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      status: e.currentTarget.value as "eligible" | "ineligible" | "on_hold",
                    })}>
                  <option value="eligible">Eligible</option>
                  <option value="ineligible">Ineligible</option>
                  <option value="on_hold">On hold</option>
                </select>
              </div>

              <div>
                <label for="payroll-field-7" class="text-xs font-medium text-muted">Tax regime</label>
                <select id="payroll-field-7" aria-label="Tax regime" class="mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm" value={profileForm.taxRegime} onchange={(e) =>
                    setProfileForm({ ...profileForm, taxRegime: e.currentTarget.value as "new" | "old" })}>
                  <option value="new">New regime</option>
                  <option value="old">Old regime</option>
                </select>
              </div>

              <div>
                <label for="payroll-field-8" class="text-xs font-medium text-muted">Effective date</label>
                <Input id="payroll-field-8" required type="date" value={profileForm.effectiveDate} onchange={(e) => setProfileForm({ ...profileForm, effectiveDate: e.currentTarget.value })} class="mt-1" />
              </div>

              <div class="sm:col-span-4 flex flex-wrap gap-4 pt-1 text-xs">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={profileForm.pfApplicable} onchange={(e) => setProfileForm({ ...profileForm, pfApplicable: e.currentTarget.checked })} />
                  <span>Provident Fund (PF)</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={profileForm.esiApplicable} onchange={(e) => setProfileForm({ ...profileForm, esiApplicable: e.currentTarget.checked })} />
                  <span>Employee State Insurance (ESI)</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={profileForm.professionalTaxApplicable} onchange={(e) =>
                      setProfileForm({ ...profileForm, professionalTaxApplicable: e.currentTarget.checked })} />
                  <span>Professional Tax (PT)</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={profileForm.tdsApplicable} onchange={(e) => setProfileForm({ ...profileForm, tdsApplicable: e.currentTarget.checked })} />
                  <span>TDS / Income Tax</span>
                </label>
              </div>

              <div class="sm:col-span-4 flex justify-end">
                <Button type="submit" disabled={busy}>
                  Save employee payroll profile
                </Button>
              </div>
            </form>

            {#if profiles.length > 0}<div class="space-y-2">
                <p class="text-xs font-semibold text-muted">Configured employee profiles ({profiles.length})</p>
                <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {#each profiles as { profile, employee }}<div class="rounded-xl border p-3 text-xs space-y-1 bg-surface">
                      <div class="flex justify-between items-center">
                        <span class="font-semibold text-foreground">{employee.displayName}</span>
                        <span class={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                            profile.status === "eligible"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                          {profile.status}
                        </span>
                      </div>
                      <p class="text-muted">ID: {employee.employeeId} · {profile.taxRegime} tax regime</p>
                      <p class="text-[11px] text-slate-500">
                        PF: {#if profile.pfApplicable}{"✓"}{:else}{"✗"}{/if} · ESI: {#if profile.esiApplicable}{"✓"}{:else}{"✗"}{/if} · PT:{" "}
                        {#if profile.professionalTaxApplicable}{"✓"}{:else}{"✗"}{/if} · TDS: {#if profile.tdsApplicable}{"✓"}{:else}{"✗"}{/if}
                      </p>
                    </div>{/each}
                </div>
              </div>{/if}
          </CardContent>
        </Card>{/if}

      
      {#if showAssignment}<Card>
          <CardHeader>
            <CardTitle>Effective-dated salary structure assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onsubmit={assignSalary} class="grid gap-3 md:grid-cols-4">
              <select required aria-label="Salary employee" class="h-10 rounded-lg border bg-surface px-3 text-sm" value={assignmentForm.employeeId} onchange={(e) => setAssignmentForm({ ...assignmentForm, employeeId: e.currentTarget.value })}>
                <option value="">Select employee</option>
                {#each employees as employee}<option value={employee.id}>
                    {employee.displayName} ({employee.employeeId})
                  </option>{/each}
              </select>
              <select required aria-label="Salary structure" class="h-10 rounded-lg border bg-surface px-3 text-sm" value={assignmentForm.structureId} onchange={(e) => setAssignmentForm({ ...assignmentForm, structureId: e.currentTarget.value })}>
                <option value="">Select structure</option>
                {#each structures as structure}<option value={structure.id}>
                    {structure.name} ({structure.status})
                  </option>{/each}
              </select>
              <Input required type="date" aria-label="Salary effective from" value={assignmentForm.effectiveFrom} onchange={(e) => setAssignmentForm({ ...assignmentForm, effectiveFrom: e.currentTarget.value })} />
              <Input type="date" aria-label="Salary effective to" value={assignmentForm.effectiveTo} onchange={(e) => setAssignmentForm({ ...assignmentForm, effectiveTo: e.currentTarget.value })} />
              <Input placeholder="Revision reason (e.g. Annual Appraisal)" value={assignmentForm.revisionReason} onchange={(e) => setAssignmentForm({ ...assignmentForm, revisionReason: e.currentTarget.value })} class="md:col-span-3" />
              <Button type="submit" disabled={busy}>
                Assign structure
              </Button>
            </form>
            {#if assignments.length > 0}<div class="mt-4 space-y-2">
                <p class="text-xs font-semibold text-muted">Active assignments ({assignments.length})</p>
                {#each assignments as row}<div class="rounded-lg border p-3 text-sm">
                    <span class="font-medium">
                      {row.employeeName} · {row.structureName}
                    </span>
                    <p class="mt-1 text-xs text-muted">
                      {row.assignment.effectiveFrom} → {row.assignment.effectiveTo ?? "open-ended"}
                    </p>
                  </div>{/each}
              </div>{/if}
          </CardContent>
        </Card>{/if}

      
      <Card>
        <CardHeader>
          <CardTitle>Payroll periods</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          {#if loading}<p class="text-sm text-muted">Loading payroll periods…</p>{:else}{#if periods.length === 0}<p class="text-sm text-muted">No payroll periods yet.</p>{:else}{#each periods as period}<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div>
                  <p class="font-semibold text-foreground">
                    {String(period.month).padStart(2, "0")}/{period.year}
                  </p>
                  <p class="text-xs capitalize text-muted">
                    {period.status.replaceAll("_", " ")} · {period.periodStart} to {period.periodEnd}
                  </p>
                </div>
                <Button variant="secondary" onclick={() => calculate(period.id)} disabled={busy || ["finalized", "processing", "under_review", "approved", "locked"].includes(period.status)}>
                  Calculate payroll
                </Button>
              </div>{/each}{/if}{/if}
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle>Payroll runs & payment tracking</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          {#if runs.length === 0}<p class="text-sm text-muted">No payroll runs yet.</p>{:else}{#each runs as run}<div class="rounded-xl border p-4 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-semibold text-foreground">{run.runNumber}</p>
                      <span class={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          run.status === "locked"
                            ? "bg-emerald-100 text-emerald-800"
                            : run.status === "finalized"
                            ? "bg-indigo-100 text-indigo-800"
                            : run.status === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-surface text-muted"
                        }`}>
                        {#if run.status === "locked"}{"Paid & Locked"}{:else}{run.status.replaceAll("_", " ")}{/if}
                      </span>
                    </div>
                    <p class="text-sm text-muted">
                      {run.employeeCount} employee(s) · Gross: {money(run.grossTotal)} · Deductions: {money(run.deductionTotal)} · Net:{" "}
                      <strong class="text-foreground">{money(run.netTotal)}</strong>
                    </p>
                    <p class="text-xs text-muted">
                      Employer contributions: {money(run.employerContributionTotal)} · Warnings: {run.warningCount} · Errors: {run.errorCount}
                    </p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 pt-1">
                  <Button size="sm" variant="secondary" onclick={() => reviewRun(run)}>
                    Review calculations
                  </Button>
                  {#if run.status === "approved"}<Button size="sm" disabled={busy} onclick={() => setFinalizingRunId(run.id)}>
                      Finalize run
                    </Button>{/if}
                  {#if run.status === "under_review"}<Button size="sm" variant="secondary" onclick={() => window.location.assign("/app/approvals")}>
                      Open approval inbox
                    </Button>{/if}
                  {#if run.status === "finalized"}<Button size="sm" onclick={() => setPayingRun(run)} class="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                      <SvgIcon name="CreditCard" class="size-3.5" />
                      <span>Record salary payment</span>
                    </Button>{/if}
                  {#if run.status === "locked"}<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <SvgIcon name="CheckCircle" class="size-3.5 text-emerald-600" />
                      Payment recorded · Immutable locked run
                    </span>{/if}
                </div>
              </div>{/each}{/if}
        </CardContent>
      </Card>

      
      {#if review}<Card>
          <CardHeader>
            <div class="flex justify-between items-start">
              <div>
                <CardTitle>Run review · {review.run.runNumber}</CardTitle>
                <p class="text-sm text-muted">
                  Server-calculated payroll snapshots. Finalized and locked rows are permanent.
                </p>
              </div>
              <Button variant="ghost" size="sm" onclick={() => setReview(null)}>
                Close review
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            {#if review.rows.length === 0}<p class="text-sm text-muted">No employee rows were generated.</p>{:else}{#each review.rows as row}<div class="rounded-xl border p-4">
                  <div class="flex flex-wrap justify-between items-center">
                    <span class="font-semibold text-foreground">
                      {row.employee.displayName} ({row.employee.employeeId})
                    </span>
                    <span class="text-base font-bold text-primary">
                      Net {money(row.snapshot?.netSalary ?? 0)}
                    </span>
                  </div>
                  {#if row.snapshot}<p class="mt-1 text-sm text-muted">
                      Gross: {money(row.snapshot.grossEarnings)} · Deductions: {money(row.snapshot.totalDeductions)} · Employer:{" "}
                      {money(row.snapshot.employerContributions)} · Payable days: {row.snapshot.payableDays} · LOP: {row.snapshot.lopDays} day(s)
                    </p>{/if}
                  <div class="mt-2.5 grid gap-1.5 text-xs text-muted sm:grid-cols-2 rounded-lg bg-slate-50 p-2.5">
                    {#each row.lineItems as line, index}<span class="flex justify-between">
                        <span>{line.name}:</span>
                        <strong class="text-slate-800">{money(line.amount)}</strong>
                      </span>{/each}
                  </div>
                </div>{/each}{/if}
          </CardContent>
        </Card>{/if}

      
      {#if payingRun}<div role="dialog" aria-modal="true" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card class="w-full max-w-md bg-white shadow-2xl">
            <CardHeader class="pb-3">
              <CardTitle class="text-base font-bold text-slate-900">
                Record Payment for {payingRun.runNumber}
              </CardTitle>
              <p class="text-xs text-muted">
                Confirm salary disbursement reference. This will transition the run to locked status and preserve an audit log.
              </p>
            </CardHeader>
            <CardContent>
              <form onsubmit={recordPayment} class="space-y-3">
                <div>
                  <p class="text-xs text-muted">Disbursable Amount</p>
                  <p class="text-xl font-extrabold text-emerald-700 font-mono">
                    {money(payingRun.netTotal)}
                  </p>
                </div>
                <div>
                  <label for="payroll-field-9" class="text-xs font-semibold text-slate-700">Payment Reference / UTR Number</label>
                  <Input id="payroll-field-9" required placeholder="e.g. HDFC-NEFT-20261019-01" value={paymentForm.paymentReference} onchange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.currentTarget.value })} class="mt-1 font-mono text-sm" />
                </div>
                <div>
                  <label for="payroll-field-10" class="text-xs font-semibold text-slate-700">Payment Date</label>
                  <Input id="payroll-field-10" required type="date" value={paymentForm.paymentDate} onchange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.currentTarget.value })} class="mt-1" />
                </div>
                <div>
                  <label for="payroll-field-11" class="text-xs font-semibold text-slate-700">Notes (Optional)</label>
                  <Input id="payroll-field-11" placeholder="e.g. Batch bank disbursement confirmed" value={paymentForm.notes} onchange={(e) => setPaymentForm({ ...paymentForm, notes: e.currentTarget.value })} class="mt-1" />
                </div>
                <div class="flex justify-end gap-2 pt-3">
                  <Button type="button" variant="secondary" onclick={() => setPayingRun(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={busy} class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    Confirm & Record Payment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>{/if}

      
      <ConfirmDialog open={Boolean(finalizingRunId)} onOpenChange={(open) => {
          if (!open) setFinalizingRunId(null);
        }} title="Finalize Approved Payroll Run" description="Finalize this approved payroll run? Once finalized, this payroll run and all generated employee salary vouchers become permanently immutable." confirmText="Finalize Run" cancelText="Cancel" variant="warning" isLoading={busy} onConfirm={async () => {
          if (!finalizingRunId) return;
          const id = finalizingRunId;
          setFinalizingRunId(null);
          const result = await action(`/api/app/payroll/runs/${id}/finalize`, { method: "POST" });
          if (result) setReview(null);
        }} />
    </div>
