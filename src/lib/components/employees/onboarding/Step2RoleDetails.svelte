<script lang="ts">
import{ROLE_METADATA,getAssignableRoles,type SystemRole}from'$lib/domain/rbac/permissions';import{ONBOARDING_WIZARD_STEPS,type OnboardingWizardStepId,type OnboardingWizardStepDefinition,type OnboardingWizardFormState,type MasterDataItem,type ManagerSummary}from'./types';import{isHrDepartment}from'$lib/domain/departments/hr';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import CustomSelect from "$lib/components/ui/CustomSelect.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface Step2RoleDetailsProps {
  form: OnboardingWizardFormState;
  onChange: (patch: Partial<OnboardingWizardFormState>) => void;
  errors: Record<string, string>;
  departments?: MasterDataItem[];
  designations?: MasterDataItem[];
  locations?: MasterDataItem[];
  shifts?: MasterDataItem[];
  employmentTypes?: MasterDataItem[];
  managers?: ManagerSummary[];
  isLoadingMasterData?: boolean;
}
let {
  form,
  onChange,
  errors,
  departments: propDepartments,
  designations: propDesignations,
  locations: propLocations,
  shifts: propShifts,
  employmentTypes: propEmploymentTypes,
  managers: propManagers,
  isLoadingMasterData: propIsLoading,
}:Step2RoleDetailsProps=$props();
const roleMeta=$derived(ROLE_METADATA[form.targetRole] || ROLE_METADATA.EMPLOYEE);
let internalDepartments=$state<MasterDataItem[]>(untrack(()=>([])));
const setInternalDepartments=(next:typeof internalDepartments|((previous:typeof internalDepartments)=>typeof internalDepartments))=>{internalDepartments=typeof next==="function"?(next as (previous:typeof internalDepartments)=>typeof internalDepartments)(internalDepartments):next;};
let internalDesignations=$state<MasterDataItem[]>(untrack(()=>([])));
const setInternalDesignations=(next:typeof internalDesignations|((previous:typeof internalDesignations)=>typeof internalDesignations))=>{internalDesignations=typeof next==="function"?(next as (previous:typeof internalDesignations)=>typeof internalDesignations)(internalDesignations):next;};
let internalLocations=$state<MasterDataItem[]>(untrack(()=>([])));
const setInternalLocations=(next:typeof internalLocations|((previous:typeof internalLocations)=>typeof internalLocations))=>{internalLocations=typeof next==="function"?(next as (previous:typeof internalLocations)=>typeof internalLocations)(internalLocations):next;};
let internalShifts=$state<MasterDataItem[]>(untrack(()=>([])));
const setInternalShifts=(next:typeof internalShifts|((previous:typeof internalShifts)=>typeof internalShifts))=>{internalShifts=typeof next==="function"?(next as (previous:typeof internalShifts)=>typeof internalShifts)(internalShifts):next;};
let internalEmploymentTypes=$state<MasterDataItem[]>(untrack(()=>([])));
const setInternalEmploymentTypes=(next:typeof internalEmploymentTypes|((previous:typeof internalEmploymentTypes)=>typeof internalEmploymentTypes))=>{internalEmploymentTypes=typeof next==="function"?(next as (previous:typeof internalEmploymentTypes)=>typeof internalEmploymentTypes)(internalEmploymentTypes):next;};
let internalManagers=$state<ManagerSummary[]>(untrack(()=>([])));
const setInternalManagers=(next:typeof internalManagers|((previous:typeof internalManagers)=>typeof internalManagers))=>{internalManagers=typeof next==="function"?(next as (previous:typeof internalManagers)=>typeof internalManagers)(internalManagers):next;};
let internalIsLoading=$state(untrack(()=>(false)));
const setInternalIsLoading=(next:typeof internalIsLoading|((previous:typeof internalIsLoading)=>typeof internalIsLoading))=>{internalIsLoading=typeof next==="function"?(next as (previous:typeof internalIsLoading)=>typeof internalIsLoading)(internalIsLoading):next;};
const departments=$derived(propDepartments ?? internalDepartments);
const designations=$derived(propDesignations ?? internalDesignations);
const locations=$derived(propLocations ?? internalLocations);
const allShifts=$derived(propShifts ?? internalShifts);
const shifts=$derived(allShifts.filter((s: MasterDataItem & { status?: string }) => !s.status || s.status === "active"));
const employmentTypes=$derived(propEmploymentTypes ?? internalEmploymentTypes);
const managers=$derived(propManagers ?? internalManagers);
const isLoadingMasterData=$derived(propIsLoading ?? internalIsLoading);
let teams=$state<MasterDataItem[]>(untrack(()=>([])));
const setTeams=(next:typeof teams|((previous:typeof teams)=>typeof teams))=>{teams=typeof next==="function"?(next as (previous:typeof teams)=>typeof teams)(teams):next;};
let isLoadingTeams=$state(untrack(()=>(false)));
const setIsLoadingTeams=(next:typeof isLoadingTeams|((previous:typeof isLoadingTeams)=>typeof isLoadingTeams))=>{isLoadingTeams=typeof next==="function"?(next as (previous:typeof isLoadingTeams)=>typeof isLoadingTeams)(isLoadingTeams):next;};
let teamError=$state<string | null>(untrack(()=>(null)));
const setTeamError=(next:typeof teamError|((previous:typeof teamError)=>typeof teamError))=>{teamError=typeof next==="function"?(next as (previous:typeof teamError)=>typeof teamError)(teamError):next;};
$effect(()=>{propDepartments;return untrack(() => {
    // If master data is passed via props, skip internal fetch
    if (propDepartments !== undefined) return;

    let isMounted = true;
    async function loadMasterData() {
      setInternalIsLoading(true);
      try {
        const [
          deptRes,
          desigRes,
          locRes,
          shiftRes,
          typeRes,
          empRes,
        ] = await Promise.allSettled([
          fetch("/api/app/master-data/departments").then((r) => r.json()),
          fetch("/api/app/master-data/designations").then((r) => r.json()),
          fetch("/api/app/master-data/locations").then((r) => r.json()),
          fetch("/api/app/master-data/shifts?status=active").then((r) => r.json()),
          fetch("/api/app/master-data/employment-types").then((r) => r.json()),
          fetch("/api/app/employees?pageSize=100").then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (deptRes.status === "fulfilled" && deptRes.value.items) {
          setInternalDepartments(deptRes.value.items);
        }
        if (desigRes.status === "fulfilled" && desigRes.value.items) {
          setInternalDesignations(desigRes.value.items);
        }
        if (locRes.status === "fulfilled" && locRes.value.items) {
          setInternalLocations(locRes.value.items);
        }
        if (shiftRes.status === "fulfilled" && shiftRes.value.items) {
          setInternalShifts(shiftRes.value.items);
        }
        if (typeRes.status === "fulfilled" && typeRes.value.items) {
          setInternalEmploymentTypes(typeRes.value.items);
        }
        if (empRes.status === "fulfilled" && empRes.value.rows) {
          setInternalManagers(
            empRes.value.rows.map((e: { id: string; displayName: string; employeeId: string }) => ({
              id: e.id,
              displayName: e.displayName,
              employeeId: e.employeeId,
            }))
          );
        }
      } catch {
        // Fall back gracefully if endpoints are restricted or empty
      } finally {
        if (isMounted) setInternalIsLoading(false);
      }
    }

    void loadMasterData();
    return () => {
      isMounted = false;
    };
  });});
const isEmployeeRole=$derived(form.targetRole === "EMPLOYEE");
const isLeadershipRole=$derived(form.targetRole === "MANAGER" ||
    form.targetRole === "TEAM_LEAD" ||
    form.targetRole === "PROJECT_MANAGER");
const isHrRole=$derived(form.targetRole === "HR_ADMIN" || form.targetRole === "HR_EXECUTIVE");
const isFinanceRole=$derived(form.targetRole === "FINANCE_ADMIN");
const isRecruiterRole=$derived(form.targetRole === "RECRUITER");
const isDeptRequired=$derived(form.targetRole === "MANAGER" ||
    form.targetRole === "TEAM_LEAD" ||
    form.targetRole === "PROJECT_MANAGER" ||
    form.targetRole === "EMPLOYEE" ||
    isHrRole);
const canAssignShift=$derived(form.targetRole !== "ORGANIZATION_OWNER");
const displayedDepartments=$derived(isHrRole
    ? departments.filter(isHrDepartment)
    : departments);
const hrDepartmentMissing=$derived(isHrRole && displayedDepartments.length === 0 && !isLoadingMasterData);
let onChangeRef=$state(untrack(()=>({current:onChange})));
$effect(()=>{const value=onChange;untrack(()=>{onChangeRef.current=value;});});
let teamIdRef=$state(untrack(()=>({current:form.teamId})));
$effect(()=>{const value=form.teamId;untrack(()=>{teamIdRef.current=value;});});
$effect(()=>{isHrRole;form.locationId;form.teamId;form.departmentId;departments;displayedDepartments;return untrack(() => {
    if (isHrRole) {
      if (form.locationId) {
        onChangeRef.current({ locationId: "" });
      }
      if (form.teamId) {
        onChangeRef.current({ teamId: "" });
      }
      if (form.departmentId && departments.length > 0) {
        const currentDept = departments.find((d) => d.id === form.departmentId);
        if (currentDept && !isHrDepartment(currentDept)) {
          onChangeRef.current({ departmentId: "" });
        }
      } else if (!form.departmentId && displayedDepartments.length === 1) {
        onChangeRef.current({ departmentId: displayedDepartments[0].id });
      }
    }
  });});
$effect(()=>{isHrRole;form.departmentId;return untrack(() => {
    let isMounted = true;

    if (isHrRole || !form.departmentId) {
      setTeams([]);
      setIsLoadingTeams(false);
      setTeamError(null);
      if (teamIdRef.current) {
        onChangeRef.current({ teamId: "" });
      }
      return;
    }

    async function loadDepartmentTeams() {
      setIsLoadingTeams(true);
      setTeamError(null);
      try {
        const res = await fetch(
          `/api/app/master-data/teams?departmentId=${encodeURIComponent(form.departmentId)}&status=active`
        );
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.success && Array.isArray(data.items)) {
          setTeams(data.items);
          if (teamIdRef.current && !data.items.some((t: MasterDataItem) => t.id === teamIdRef.current)) {
            onChangeRef.current({ teamId: "" });
          }
        } else {
          setTeams([]);
          setTeamError(data.error?.message || "Failed to load teams for this department.");
          if (teamIdRef.current) {
            onChangeRef.current({ teamId: "" });
          }
        }
      } catch {
        if (!isMounted) return;
        setTeams([]);
        setTeamError("Network error loading teams. Please try again.");
        if (teamIdRef.current) {
          onChangeRef.current({ teamId: "" });
        }
      } finally {
        if (isMounted) {
          setIsLoadingTeams(false);
        }
      }
    }

    void loadDepartmentTeams();

    return () => {
      isMounted = false;
    };
  });});
</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {roleMeta.title} Profile Details
          </h2>
          <p class="mt-0.5 text-xs text-muted">
            Configure identity credentials and organizational placement for this {roleMeta.title.toLowerCase()}.
          </p>
        </div>
        <div class="shrink-0">
          <span class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>●</span> {roleMeta.title}
          </span>
        </div>
      </div>

      
      <div class="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-xs text-slate-700 leading-relaxed">
        {#if isEmployeeRole}<p>
            Standard workforce profile: Collects personal identity, employment terms, department designation, and optional reporting structure.
          </p>{/if}
        {#if isHrRole}<p>
            People Operations role: Grants access to the Workforce Directory, onboarding lifecycle workflows, and document verifications.
          </p>{/if}
        {#if isFinanceRole}<p>
            Financial Operations role: Oversees payroll calculation batches, expense claim validations, and reimbursement processing.
          </p>{/if}
        {#if isLeadershipRole}<p>
            Departmental Leadership role: Manages direct reports, approves leave applications, and coordinates sprint deliverable assignments.
          </p>{/if}
        {#if isRecruiterRole}<p>
            Talent Acquisition role: Manages ATS job requisitions, candidate evaluation pipelines, and hiring offer workflows.
          </p>{/if}
      </div>

      
      <div class="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <SvgIcon name="User" class="size-4 text-primary" />
          <h3 class="text-sm font-bold text-foreground">
            Identity & Contact Credentials
          </h3>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-1.5">
            <label for="onboarding-role-field-1" class="text-xs font-semibold text-foreground">
              First name <span class="text-rose-500">*</span>
            </label>
            <Input id="onboarding-role-field-1" value={form.firstName} oninput={(e) => onChange({ firstName: e.currentTarget.value })} placeholder="e.g. Arjun" class={errors.firstName ? "border-rose-400 focus:border-rose-500" : ""} />
            {#if errors.firstName}<p class="text-[11px] font-medium text-rose-600">{errors.firstName}</p>{/if}
          </div>

          <div class="space-y-1.5">
            <label for="onboarding-role-field-2" class="text-xs font-semibold text-foreground">
              Middle name <span class="text-xs text-muted font-normal">(optional)</span>
            </label>
            <Input id="onboarding-role-field-2" value={form.middleName} oninput={(e) => onChange({ middleName: e.currentTarget.value })} placeholder="e.g. Kumar" />
          </div>

          <div class="space-y-1.5">
            <label for="onboarding-role-field-3" class="text-xs font-semibold text-foreground">
              Last name <span class="text-rose-500">*</span>
            </label>
            <Input id="onboarding-role-field-3" value={form.lastName} oninput={(e) => onChange({ lastName: e.currentTarget.value })} placeholder="e.g. Sharma" class={errors.lastName ? "border-rose-400 focus:border-rose-500" : ""} />
            {#if errors.lastName}<p class="text-[11px] font-medium text-rose-600">{errors.lastName}</p>{/if}
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <label for="onboarding-role-field-4" class="text-xs font-semibold text-foreground">
              Personal email <span class="text-rose-500">*</span>
            </label>
            <Input id="onboarding-role-field-4" type="email" value={form.personalEmail} oninput={(e) => onChange({ personalEmail: e.currentTarget.value })} placeholder="arjun.sharma@example.com" class={errors.personalEmail ? "border-rose-400 focus:border-rose-500" : ""} />
            <p class="text-[11px] text-muted">
              The invitation link and credential setup instructions will be sent here.
            </p>
            {#if errors.personalEmail}<p class="text-[11px] font-medium text-rose-600">{errors.personalEmail}</p>{/if}
          </div>

          <div class="space-y-1.5">
            <label for="onboarding-role-field-5" class="text-xs font-semibold text-foreground">
              Work email <span class="text-xs text-muted font-normal">(optional)</span>
            </label>
            <Input id="onboarding-role-field-5" type="email" value={form.workEmail} oninput={(e) => onChange({ workEmail: e.currentTarget.value })} placeholder="arjun@company.com" />
            <p class="text-[11px] text-muted">
              Corporate email alias for official notifications.
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <label for="onboarding-role-field-6" class="text-xs font-semibold text-foreground">
              Phone number <span class="text-xs text-muted font-normal">(optional)</span>
            </label>
            <Input id="onboarding-role-field-6" type="tel" value={form.phone} oninput={(e) => onChange({ phone: e.currentTarget.value })} placeholder="+91 98765 43210" />
          </div>

          {#if (isEmployeeRole || isLeadershipRole)}<div class="space-y-1.5">
              <label for="onboarding-role-field-7" class="text-xs font-semibold text-foreground">
                Joining date <span class="text-xs text-muted font-normal">(optional)</span>
              </label>
              <Input id="onboarding-role-field-7" type="date" value={form.joiningDate} oninput={(e) => onChange({ joiningDate: e.currentTarget.value })} />
            </div>{/if}
        </div>
      </div>

      
      <div class="rounded-2xl border border-border/80 bg-white p-5 shadow-xs space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <SvgIcon name="Building2" class="size-4 text-primary" />
          <h3 class="text-sm font-bold text-foreground">
            Organizational Hierarchy & Placement
          </h3>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          
          <div class="space-y-1.5">
            <label for="onboarding-role-field-8" class="text-xs font-semibold text-foreground">
              Department{" "}
              {#if isDeptRequired}<span class="text-rose-500">*</span>{:else}<span class="text-xs text-muted font-normal">(optional)</span>{/if}
            </label>
            <CustomSelect id="onboarding-role-field-8" value={form.departmentId} onChange={(value) => {
                const patch: Partial<OnboardingWizardFormState> = { departmentId: value };
                if (value !== form.departmentId) {
                  patch.teamId = "";
                }
                onChange(patch);
              }} options={displayedDepartments.map((d) => ({
                value: d.id,
                label: `${d.name}${d.code ? ` (${d.code})` : ""}`,
              }))} placeholder={isLoadingMasterData
                  ? "Loading departments…"
                  : isHrRole
                    ? "Select an HR department…"
                    : "Select a department…"} searchable={displayedDepartments.length > 6} searchPlaceholder="Search departments…" emptyMessage={isHrRole
                  ? "No HR department found."
                  : "No departments configured yet."} error={errors.departmentId} />
            {#if hrDepartmentMissing}<div class="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                <SvgIcon name="AlertTriangle" class="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p class="font-semibold">No active HR department configured</p>
                  <p class="text-[11px] text-amber-700 mt-0.5">
                    An Organization Owner or HR Administrator must configure an HR department in Settings &gt; Master Data &gt; Departments before onboarding {roleMeta.title.toLowerCase()} personnel.
                  </p>
                </div>
              </div>{:else}{#if displayedDepartments.length === 0 && !isLoadingMasterData}{#if isDeptRequired}<div class="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                  <SvgIcon name="AlertTriangle" class="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p class="font-semibold">No active departments configured</p>
                    <p class="text-[11px] text-amber-700 mt-0.5">
                      An Organization Owner must create at least one department before onboarding a {roleMeta.title.toLowerCase()}.
                    </p>
                  </div>
                </div>{:else}<p class="text-[11px] text-muted">No departments configured yet (optional for {roleMeta.title}).</p>{/if}{:else}{/if}{/if}
            {#if errors.departmentId}<p class="text-[11px] font-medium text-rose-600">{errors.departmentId}</p>{/if}
          </div>

          
          <div class="space-y-1.5">
            <label for="onboarding-role-field-9" class="text-xs font-semibold text-foreground">
              Designation / Title <span class="text-xs text-muted font-normal">(optional)</span>
            </label>
            <CustomSelect id="onboarding-role-field-9" value={form.designationId} onChange={(value) => onChange({ designationId: value })} options={designations.map((d) => ({
                value: d.id,
                label: `${d.name}${d.code ? ` (${d.code})` : ""}`,
              }))} placeholder={isLoadingMasterData ? "Loading designations…" : "Select a designation…"} searchable={designations.length > 6} searchPlaceholder="Search designations…" emptyMessage="No designations configured yet." error={errors.designationId} />
            {#if designations.length === 0 && !isLoadingMasterData}<p class="text-[11px] text-muted">
                No designations configured yet. You can configure job titles in Settings &gt; Master Data.
              </p>{/if}
          </div>
        </div>

        
        {#if !isHrRole}<div class="grid gap-4 sm:grid-cols-2">
            {#if (isEmployeeRole || isLeadershipRole)}<div class="space-y-1.5">
                <label for="onboarding-role-field-10" class="text-xs font-semibold text-foreground">
                  Team / Squad <span class="text-xs text-muted font-normal">(optional)</span>
                </label>
                <CustomSelect id="onboarding-role-field-10" value={form.teamId} onChange={(value) => onChange({ teamId: value })} options={!form.departmentId
                      ? []
                      : teams.map((t) => ({
                          value: t.id,
                          label: `${t.name}${t.code ? ` (${t.code})` : ""}`,
                        }))} placeholder={!form.departmentId
                      ? "Select a department first"
                      : isLoadingTeams
                        ? "Loading department teams…"
                        : teamError
                          ? "Error loading teams"
                          : teams.length === 0
                            ? "No teams available in this department"
                            : "Select a team…"} disabled={!form.departmentId || isLoadingTeams} searchable={teams.length > 6} searchPlaceholder="Search teams…" emptyMessage={!form.departmentId
                      ? "Please select a department first."
                      : teamError
                        ? teamError
                        : "No active teams configured for this department."} error={errors.teamId} />
                {#if !form.departmentId}<p class="text-[11px] text-muted">Select a department above to see available teams.</p>{:else}{#if teamError}<p class="text-[11px] font-medium text-rose-600">{teamError}</p>{:else}{#if !isLoadingTeams && teams.length === 0}<p class="text-[11px] text-muted">No active teams in this department (optional).</p>{:else}{/if}{/if}{/if}
              </div>{/if}

            <div class="space-y-1.5">
              <label for="onboarding-role-field-11" class="text-xs font-semibold text-foreground">
                Location / Office <span class="text-xs text-muted font-normal">(optional)</span>
              </label>
              <CustomSelect id="onboarding-role-field-11" value={form.locationId} onChange={(value) => onChange({ locationId: value })} options={locations.map((l) => ({
                  value: l.id,
                  label: l.name,
                }))} placeholder={isLoadingMasterData ? "Loading locations…" : "Select a location…"} searchable={locations.length > 6} searchPlaceholder="Search locations…" emptyMessage="No locations configured yet." error={errors.locationId} />
            </div>
          </div>{/if}

        
        {#if (isEmployeeRole || isLeadershipRole)}<div class="space-y-1.5">
            <label for="onboarding-role-field-12" class="text-xs font-semibold text-foreground">
              Reporting Manager <span class="text-xs text-muted font-normal">(optional)</span>
            </label>
            <CustomSelect id="onboarding-role-field-12" value={form.reportingManagerId} onChange={(value) => onChange({ reportingManagerId: value })} options={managers.map((m) => ({
                value: m.id,
                label: `${m.displayName} (${m.employeeId})`,
              }))} placeholder="Select reporting manager…" searchable searchPlaceholder="Search managers by name or ID…" emptyMessage="No managers available." error={errors.reportingManagerId} />
          </div>{/if}

        
        {#if canAssignShift}<div class="grid gap-4 sm:grid-cols-2 pt-1 border-t border-slate-100">
            <div class="space-y-1.5">
              <label for="onboarding-role-field-13" class="text-xs font-semibold text-foreground">
                Work Shift <span class="text-xs text-muted font-normal">(optional)</span>
              </label>
              <CustomSelect id="onboarding-role-field-13" value={form.shiftId} onChange={(value) => onChange({ shiftId: value })} options={shifts.map((s) => ({
                  value: s.id,
                  label: `${s.name}${s.startTime && s.endTime ? ` (${s.startTime.slice(0, 5)} – ${s.endTime.slice(0, 5)})` : ""}`,
                }))} placeholder={isLoadingMasterData ? "Loading work shifts…" : "Standard organization shift"} searchable={shifts.length > 6} searchPlaceholder="Search work shifts…" emptyMessage="No custom shifts configured. Configure shifts in Settings > Master Data." error={errors.shiftId} />
              {#if shifts.length === 0 && !isLoadingMasterData}<p class="text-[11px] text-muted">
                  No work shifts configured yet. Shifts must be configured in Settings &gt; Master Data before assigning them to employees.
                </p>{/if}
            </div>

            <div class="space-y-1.5">
              <label for="onboarding-role-field-14" class="text-xs font-semibold text-foreground">
                Employment Type <span class="text-xs text-muted font-normal">(optional)</span>
              </label>
              <CustomSelect id="onboarding-role-field-14" value={form.employmentTypeId} onChange={(value) => onChange({ employmentTypeId: value })} options={employmentTypes.map((t) => ({
                  value: t.id,
                  label: `${t.name}${t.code ? ` (${t.code})` : ""}`,
                }))} placeholder={isLoadingMasterData ? "Loading employment types…" : "Select an employment type…"} searchable={employmentTypes.length > 6} searchPlaceholder="Search employment types…" emptyMessage="No custom types configured." error={errors.employmentTypeId} />
              {#if employmentTypes.length === 0 && !isLoadingMasterData}<p class="text-[11px] text-muted">
                  No custom employment types configured yet. You can manage them in Settings &gt; Master Data.
                </p>{/if}
            </div>
          </div>{/if}
      </div>
    </div>
