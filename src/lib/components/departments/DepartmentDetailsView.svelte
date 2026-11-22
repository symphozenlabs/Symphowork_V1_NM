<script lang="ts">
import type{DepartmentDetails,DepartmentManagerSummary,DepartmentTeamItem,DepartmentRosterMember,DepartmentTeamLeadSummary,DepartmentDeletionSafety}from'$lib/domain/departments/types';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import Input from "$lib/components/ui/Input.svelte";
import CustomSelect from "$lib/components/ui/CustomSelect.svelte";
import DepartmentDeleteDialog from "$lib/components/departments/DepartmentDeleteDialog.svelte";
import DepartmentTeamDialog from "$lib/components/departments/DepartmentTeamDialog.svelte";
import DepartmentTeamDeleteDialog from "$lib/components/departments/DepartmentTeamDeleteDialog.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface DepartmentDetailsViewProps {
  initialDepartment: DepartmentDetails;
  isOrganizationOwner: boolean;
  canManageTeams?: boolean;
}
let {
  initialDepartment,
  isOrganizationOwner,
  canManageTeams = isOrganizationOwner,
}:DepartmentDetailsViewProps=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let department=$state<DepartmentDetails>(untrack(()=>(initialDepartment)));
const setDepartment=(next:typeof department|((previous:typeof department)=>typeof department))=>{department=typeof next==="function"?(next as (previous:typeof department)=>typeof department)(department):next;};
let selectedDate=$state(untrack(()=>(initialDepartment.dateContext.date)));
const setSelectedDate=(next:typeof selectedDate|((previous:typeof selectedDate)=>typeof selectedDate))=>{selectedDate=typeof next==="function"?(next as (previous:typeof selectedDate)=>typeof selectedDate)(selectedDate):next;};
let isLoadingDate=$state(untrack(()=>(false)));
const setIsLoadingDate=(next:typeof isLoadingDate|((previous:typeof isLoadingDate)=>typeof isLoadingDate))=>{isLoadingDate=typeof next==="function"?(next as (previous:typeof isLoadingDate)=>typeof isLoadingDate)(isLoadingDate):next;};
let isTeamDialogOpen=$state(untrack(()=>(false)));
const setIsTeamDialogOpen=(next:typeof isTeamDialogOpen|((previous:typeof isTeamDialogOpen)=>typeof isTeamDialogOpen))=>{isTeamDialogOpen=typeof next==="function"?(next as (previous:typeof isTeamDialogOpen)=>typeof isTeamDialogOpen)(isTeamDialogOpen):next;};
let teamDialogMode=$state<"create" | "edit">(untrack(()=>("create")));
const setTeamDialogMode=(next:typeof teamDialogMode|((previous:typeof teamDialogMode)=>typeof teamDialogMode))=>{teamDialogMode=typeof next==="function"?(next as (previous:typeof teamDialogMode)=>typeof teamDialogMode)(teamDialogMode):next;};
let selectedTeam=$state<DepartmentTeamItem | null>(untrack(()=>(null)));
const setSelectedTeam=(next:typeof selectedTeam|((previous:typeof selectedTeam)=>typeof selectedTeam))=>{selectedTeam=typeof next==="function"?(next as (previous:typeof selectedTeam)=>typeof selectedTeam)(selectedTeam):next;};
let isTeamDeleteOpen=$state(untrack(()=>(false)));
const setIsTeamDeleteOpen=(next:typeof isTeamDeleteOpen|((previous:typeof isTeamDeleteOpen)=>typeof isTeamDeleteOpen))=>{isTeamDeleteOpen=typeof next==="function"?(next as (previous:typeof isTeamDeleteOpen)=>typeof isTeamDeleteOpen)(isTeamDeleteOpen):next;};
function handleOpenCreateTeam() {
    setSelectedTeam(null);
    setTeamDialogMode("create");
    setIsTeamDialogOpen(true);
  }
function handleOpenEditTeam(team: DepartmentTeamItem) {
    setSelectedTeam(team);
    setTeamDialogMode("edit");
    setIsTeamDialogOpen(true);
  }
function handleOpenDeleteTeam(team: DepartmentTeamItem) {
    setSelectedTeam(team);
    setIsTeamDeleteOpen(true);
  }
let isEditing=$state(untrack(()=>(false)));
const setIsEditing=(next:typeof isEditing|((previous:typeof isEditing)=>typeof isEditing))=>{isEditing=typeof next==="function"?(next as (previous:typeof isEditing)=>typeof isEditing)(isEditing):next;};
let editName=$state(untrack(()=>(initialDepartment.name)));
const setEditName=(next:typeof editName|((previous:typeof editName)=>typeof editName))=>{editName=typeof next==="function"?(next as (previous:typeof editName)=>typeof editName)(editName):next;};
let editCode=$state(untrack(()=>(initialDepartment.code)));
const setEditCode=(next:typeof editCode|((previous:typeof editCode)=>typeof editCode))=>{editCode=typeof next==="function"?(next as (previous:typeof editCode)=>typeof editCode)(editCode):next;};
let editDescription=$state(untrack(()=>(initialDepartment.description || "")));
const setEditDescription=(next:typeof editDescription|((previous:typeof editDescription)=>typeof editDescription))=>{editDescription=typeof next==="function"?(next as (previous:typeof editDescription)=>typeof editDescription)(editDescription):next;};
let editHeadId=$state(untrack(()=>(initialDepartment.headEmployeeId || "")));
const setEditHeadId=(next:typeof editHeadId|((previous:typeof editHeadId)=>typeof editHeadId))=>{editHeadId=typeof next==="function"?(next as (previous:typeof editHeadId)=>typeof editHeadId)(editHeadId):next;};
let editStatus=$state<"active" | "inactive">(untrack(()=>(initialDepartment.status)));
const setEditStatus=(next:typeof editStatus|((previous:typeof editStatus)=>typeof editStatus))=>{editStatus=typeof next==="function"?(next as (previous:typeof editStatus)=>typeof editStatus)(editStatus):next;};
let eligibleManagers=$state<DepartmentManagerSummary[]>(untrack(()=>([])));
const setEligibleManagers=(next:typeof eligibleManagers|((previous:typeof eligibleManagers)=>typeof eligibleManagers))=>{eligibleManagers=typeof next==="function"?(next as (previous:typeof eligibleManagers)=>typeof eligibleManagers)(eligibleManagers):next;};
let isLoadingManagers=$state(untrack(()=>(false)));
const setIsLoadingManagers=(next:typeof isLoadingManagers|((previous:typeof isLoadingManagers)=>typeof isLoadingManagers))=>{isLoadingManagers=typeof next==="function"?(next as (previous:typeof isLoadingManagers)=>typeof isLoadingManagers)(isLoadingManagers):next;};
let isSaving=$state(untrack(()=>(false)));
const setIsSaving=(next:typeof isSaving|((previous:typeof isSaving)=>typeof isSaving))=>{isSaving=typeof next==="function"?(next as (previous:typeof isSaving)=>typeof isSaving)(isSaving):next;};
let editError=$state<string | null>(untrack(()=>(null)));
const setEditError=(next:typeof editError|((previous:typeof editError)=>typeof editError))=>{editError=typeof next==="function"?(next as (previous:typeof editError)=>typeof editError)(editError):next;};
let editSuccess=$state(untrack(()=>(false)));
const setEditSuccess=(next:typeof editSuccess|((previous:typeof editSuccess)=>typeof editSuccess))=>{editSuccess=typeof next==="function"?(next as (previous:typeof editSuccess)=>typeof editSuccess)(editSuccess):next;};
let isDeleteOpen=$state(untrack(()=>(false)));
const setIsDeleteOpen=(next:typeof isDeleteOpen|((previous:typeof isDeleteOpen)=>typeof isDeleteOpen))=>{isDeleteOpen=typeof next==="function"?(next as (previous:typeof isDeleteOpen)=>typeof isDeleteOpen)(isDeleteOpen):next;};
async function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    setIsLoadingDate(true);
    try {
      const res = await fetch(
        `/api/app/departments/${department.id}?date=${encodeURIComponent(newDate)}`
      );
      const data = await res.json();
      if (data.success && data.department) {
        setDepartment(data.department);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingDate(false);
    }
  }
function handleStartEdit() {
    setEditName(department.name);
    setEditCode(department.code);
    setEditDescription(department.description || "");
    setEditHeadId(department.headEmployeeId || "");
    setEditStatus(department.status);
    setEditError(null);
    setEditSuccess(false);
    setIsEditing(true);

    setIsLoadingManagers(true);
    fetch(`/api/app/departments/eligible-managers?departmentId=${encodeURIComponent(department.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.managers)) {
          setEligibleManagers(d.managers);
        }
      })
      .finally(() => setIsLoadingManagers(false));
  }
async function handleSaveEdit(e: SubmitEvent) {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(false);

    const cleanName = editName.trim();
    const cleanCode = editCode.trim().toUpperCase();

    if (!cleanName) {
      setEditError("Department name is required.");
      return;
    }
    if (!cleanCode) {
      setEditError("Department code is required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/app/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          code: cleanCode,
          description: editDescription.trim() || undefined,
          headEmployeeId: editHeadId || null,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save department changes.");
      }

      setEditSuccess(true);
      setIsEditing(false);
      // Reload details with date
      await handleDateChange(selectedDate);

    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update department.");
    } finally {
      setIsSaving(false);
    }
  }
const dateContext=$derived(department.dateContext);
</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <a href="/app/departments" class="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" aria-label="Back to departments list">
            <SvgIcon name="ArrowLeft" class="size-4" />
          </a>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {department.name}
              </h1>
              <span class="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md border border-[#CDE0CC] bg-[#E2EDE1] text-primary">
                {department.code}
              </span>
              <span class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  department.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                <span class={`size-1.5 rounded-full ${
                    department.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                  }`}></span>
                {department.status}
              </span>
            </div>
            {#if department.description}<p class="mt-1 text-xs text-muted max-w-2xl">{department.description}</p>{/if}
          </div>
        </div>

        {#if isOrganizationOwner && !isEditing}<Button onclick={handleStartEdit} variant="outline" class="shrink-0">
            <SvgIcon name="Edit3" class="size-4 mr-1.5 text-primary" />
            Edit Department
          </Button>{/if}
      </div>

      {#if editSuccess}<div role="status" class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium animate-in fade-in">
          <SvgIcon name="CheckCircle2" class="size-4 text-emerald-600 shrink-0" />
          <span>Department details successfully updated.</span>
        </div>{/if}

      
      {#if isEditing}<Card class="border-primary/40 bg-white shadow-md">
          <CardHeader class="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <CardTitle class="text-sm font-bold flex items-center gap-2">
              <SvgIcon name="Edit3" class="size-4 text-primary" />
              Edit Department Information (Owner Controls)
            </CardTitle>
            <button type="button" onclick={() => setIsEditing(false)} class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <SvgIcon name="X" class="size-4" />
            </button>
          </CardHeader>
          <CardContent class="pt-4">
            {#if editError}<div role="alert" class="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <SvgIcon name="AlertTriangle" class="size-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>{/if}

            <form onsubmit={handleSaveEdit} class="space-y-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-foreground" for="edit-name">
                    Department Name <span class="text-rose-500">*</span>
                  </label>
                  <Input id="edit-name" value={editName} oninput={(e) => setEditName(e.currentTarget.value)} required />
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-foreground" for="edit-code">
                    Department Code <span class="text-rose-500">*</span>
                  </label>
                  <Input id="edit-code" value={editCode} oninput={(e) => setEditCode(e.currentTarget.value.toUpperCase())} required />
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <label for="departmentdetailsview-field-1" class="text-xs font-semibold text-foreground">
                    Assigned Manager
                  </label>
                  <CustomSelect id="departmentdetailsview-field-1" value={editHeadId} onChange={(val) => setEditHeadId(val)} options={(() => {
                      const opts = [
                        { value: "", label: "None (Unassigned)" },
                        ...eligibleManagers.map((m) => ({
                          value: m.id,
                          label: `${m.displayName} (${m.roleTitle || "Manager"}) - ${m.employeeId}`,
                        })),
                      ];
                      if (department.manager && !opts.some((o) => o.value === department.manager?.id)) {
                        opts.push({
                          value: department.manager.id,
                          label: `${department.manager.displayName} (${department.manager.roleTitle || "Manager"}) - ${department.manager.employeeId}`,
                        });
                      }
                      return opts;
                    })()} placeholder={isLoadingManagers ? "Loading managers…" : "Select a department manager…"} searchable={eligibleManagers.length > 5} searchPlaceholder="Search active managers…" emptyMessage="No eligible managers found." />
                </div>

                <div class="space-y-1.5">
                  <label for="departmentdetailsview-field-2" class="text-xs font-semibold text-foreground">Status</label>
                  <CustomSelect id="departmentdetailsview-field-2" value={editStatus} onChange={(val) => setEditStatus(val as "active" | "inactive")} options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]} />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-foreground" for="edit-desc">
                  Description
                </label>
                <textarea id="edit-desc" value={editDescription} onchange={(e) => setEditDescription(e.currentTarget.value)} rows={2} class="w-full rounded-lg border border-input bg-surface px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"></textarea>
              </div>

              <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onclick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  <SvgIcon name="Save" class="size-4 mr-1.5" />
                  {#if isSaving}{"Saving…"}{:else}{"Save Changes"}{/if}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>{/if}

      
      <div class="grid gap-4 sm:grid-cols-2">
        
        <Card>
          <CardContent class="p-4 flex items-center gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SvgIcon name="User" class="size-5" />
            </div>
            <div class="truncate">
              <p class="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Department Manager
              </p>
              <p class="text-sm font-bold text-foreground truncate">
                {department.manager?.displayName || "Unassigned"}
              </p>
              <p class="text-[11px] text-muted truncate">
                {department.manager?.workEmail || (department.manager ? department.manager.employeeId : "No head assigned")}
              </p>
            </div>
          </CardContent>
        </Card>

        
        <Card>
          <CardContent class="p-4 flex items-center gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <SvgIcon name="Users" class="size-5" />
            </div>
            <div>
              <p class="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Total Workforce
              </p>
              <p class="text-2xl font-bold text-foreground">
                {department.totalEmployees}
              </p>
              <p class="text-[11px] text-muted">{department.teams.length} sub-teams / squads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Attendance Summary ({dateContext.date})
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          
          <Card class="border-emerald-200/90 bg-emerald-50/40">
            <CardContent class="p-4 flex items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <SvgIcon name="CheckCircle2" class="size-5" />
              </div>
              <div>
                <p class="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                  Present
                </p>
                <p class="text-2xl font-bold text-emerald-700">
                  {department.presentCount}
                </p>
                <p class="text-[11px] text-emerald-600">On shift or checked in</p>
              </div>
            </CardContent>
          </Card>

          
          <Card class={`border-rose-200/90 ${department.absentCount > 0 ? "bg-rose-50/40" : "bg-white"}`}>
            <CardContent class="p-4 flex items-center gap-3">
              <div class={`flex size-10 shrink-0 items-center justify-center rounded-xl ${department.absentCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                <SvgIcon name="XCircle" class="size-5" />
              </div>
              <div>
                <p class="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                  Absent
                </p>
                <p class={`text-2xl font-bold ${department.absentCount > 0 ? "text-rose-700" : "text-slate-600"}`}>
                  {department.absentCount}
                </p>
                <p class="text-[11px] text-rose-600">Unpunched past workday</p>
              </div>
            </CardContent>
          </Card>

          
          <Card class="border-blue-200/90 bg-blue-50/40">
            <CardContent class="p-4 flex items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <SvgIcon name="CalendarCheck2" class="size-5" />
              </div>
              <div>
                <p class="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">
                  On Leave
                </p>
                <p class="text-2xl font-bold text-blue-700">
                  {department.onLeaveCount}
                </p>
                <p class="text-[11px] text-blue-600">Approved leave request</p>
              </div>
            </CardContent>
          </Card>

          
          <Card class="border-amber-200/90 bg-amber-50/40">
            <CardContent class="p-4 flex items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <SvgIcon name="Clock" class="size-5" />
              </div>
              <div>
                <p class="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  Pending Arrival
                </p>
                <p class="text-2xl font-bold text-amber-700">
                  {department.pendingCount}
                </p>
                <p class="text-[11px] text-amber-600">Current day awaiting punch</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      
      <div class="flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div class="flex items-center gap-2">
          <SvgIcon name="Calendar" class="size-4 text-primary" />
          <span class="text-xs font-semibold text-foreground">
            Attendance inspection date:
          </span>
          <input type="date" value={selectedDate} onchange={(e) => void handleDateChange(e.currentTarget.value)} class="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div class="flex items-center gap-2 text-xs">
          {#if dateContext.isHoliday}<span class="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
              Company Holiday: {dateContext.holidayName}
            </span>{/if}
          {#if !dateContext.isWorkingDay && !dateContext.isHoliday}<span class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              Weekly Rest Day
            </span>{/if}
          {#if dateContext.isToday}<span class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              Today (Live)
            </span>{/if}
        </div>
      </div>

      
      <Card>
        <CardHeader class="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle class="text-sm font-bold flex items-center gap-2">
            <SvgIcon name="Users" class="size-4 text-primary" />
            Department Workforce Roster ({department.roster.length} members)
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th class="py-3 px-4">Employee ID</th>
                  <th class="py-3 px-4">Name</th>
                  <th class="py-3 px-4">Role / Title</th>
                  <th class="py-3 px-4">Work Email</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-center">Date Attendance ({dateContext.date})</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                {#if isLoadingDate}<tr>
                    <td colspan={6} class="py-8 text-center text-xs text-muted">
                      Refreshing roster attendance…
                    </td>
                  </tr>{:else}{#if department.roster.length === 0}<tr>
                    <td colspan={6} class="py-8 text-center text-xs text-muted">
                      No employees are currently assigned to this department.
                    </td>
                  </tr>{:else}{#each department.roster as member}<tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="py-3 px-4 font-mono font-bold text-xs text-slate-700">
                        {member.employeeId}
                      </td>
                      <td class="py-3 px-4 font-semibold text-foreground">
                        <a href={`/app/employees/${member.id}`} class="hover:text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs">
                          {member.displayName}
                        </a>
                      </td>
                      <td class="py-3 px-4 text-slate-600">
                        {member.roleTitle || member.roleKey || "Employee"}
                      </td>
                      <td class="py-3 px-4 text-slate-500">
                        {member.workEmail || "—"}
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            member.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                          {member.status}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        {#if member.punchStatus === "present" ||
                        member.punchStatus === "late" ||
                        member.punchStatus === "missing_punch"}<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <SvgIcon name="CheckCircle2" class="size-3" />
                            {#if member.punchStatus === "late"}{"Present (Late)"}{:else}{#if member.punchStatus === "missing_punch"}{"On Shift"}{:else}{"Present"}{/if}{/if}
                          </span>{:else}{#if member.punchStatus === "on_leave"}<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-blue-200 bg-blue-50 text-blue-700">
                            Approved Leave
                          </span>{:else}{#if member.punchStatus === "pending_arrival"}<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200 bg-amber-50 text-amber-700">
                            <SvgIcon name="Clock" class="size-3" />
                            Pending Arrival
                          </span>{:else}{#if member.punchStatus === "holiday"}<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-purple-200 bg-purple-50 text-purple-700">
                            Holiday
                          </span>{:else}{#if member.punchStatus === "weekend"}<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-100 text-slate-600">
                            Weekly Off
                          </span>{:else}{#if member.punchStatus === "not_joined"}<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-100 text-slate-500">
                            Not Yet Joined
                          </span>{:else}<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-rose-200 bg-rose-50 text-rose-700">
                            <SvgIcon name="XCircle" class="size-3" />
                            Absent
                          </span>{/if}{/if}{/if}{/if}{/if}{/if}
                      </td>
                    </tr>{/each}{/if}{/if}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader class="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle class="text-sm font-bold flex items-center gap-2">
            <SvgIcon name="Layers" class="size-4 text-primary" />
            Sub-Teams & Pods ({department.teams.length})
          </CardTitle>
          {#if canManageTeams}<Button size="sm" onclick={handleOpenCreateTeam} class="shrink-0 text-xs">
              <SvgIcon name="Plus" class="size-3.5 mr-1" />
              Create Team
            </Button>{/if}
        </CardHeader>
        <CardContent class="p-4">
          {#if department.teams.length === 0}<div class="py-8 text-center space-y-2">
              <SvgIcon name="Layers" class="mx-auto size-7 text-slate-300" />
              <p class="text-xs font-semibold text-slate-700">No teams or squads configured yet.</p>
              <p class="text-[11px] text-muted max-w-sm mx-auto">
                {#if canManageTeams}{"Organize this department into focused pods, squads, or functional teams."}{:else}{"No sub-teams have been created within this department yet."}{/if}
              </p>
              {#if canManageTeams}<Button size="sm" variant="outline" onclick={handleOpenCreateTeam} class="text-xs mt-2">
                  <SvgIcon name="Plus" class="size-3.5 mr-1" />
                  Create First Team
                </Button>{/if}
            </div>{:else}<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {#each department.teams as team}<div class="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-xs text-foreground truncate max-w-[170px]">{team.name}</span>
                      <div class="flex items-center gap-1.5 shrink-0">
                        <span class="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-xs">
                          {team.code}
                        </span>
                        <span class={`inline-flex items-center text-[10px] font-bold uppercase rounded-sm px-1.5 py-0.2 ${
                            team.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                          {team.status}
                        </span>
                      </div>
                    </div>
                    {#if team.description}<p class="text-[11px] text-muted line-clamp-2">{team.description}</p>{/if}
                    <p class="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      Lead:{" "}
                      <span class="font-medium text-foreground">
                        {team.teamLeadName || "Unassigned"}
                      </span>
                    </p>
                  </div>

                  {#if canManageTeams}<div class="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 mt-2">
                      <Button type="button" variant="ghost" size="sm" onclick={() => handleOpenEditTeam(team)} class="h-7 px-2 text-[11px] text-slate-600 hover:text-primary" aria-label={`Edit ${team.name}`}>
                        <SvgIcon name="Edit3" class="size-3 mr-1" />
                        Edit
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onclick={() => handleOpenDeleteTeam(team)} class="h-7 px-2 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50" aria-label={`Deactivate ${team.name}`}>
                        <SvgIcon name="Trash2" class="size-3 mr-1" />
                        Deactivate
                      </Button>
                    </div>{/if}
                </div>{/each}
            </div>{/if}
        </CardContent>
      </Card>

      
      {#if isOrganizationOwner}<div class="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-6 shadow-2xs space-y-4">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <h2 class="text-sm font-bold text-rose-950 flex items-center gap-2">
                <SvgIcon name="Trash2" class="size-4 text-rose-600" />
                Danger Zone
              </h2>
              <p class="text-xs text-rose-800 leading-relaxed max-w-xl">
                Deleting a department removes it from organizational reporting and approval escalations. Employees will never be deleted, but all workforce assignments and active requisitions must be cleared before permanent deletion is permitted.
              </p>
            </div>
            <Button type="button" variant="destructive" onclick={() => setIsDeleteOpen(true)} class="shrink-0">
              <SvgIcon name="Trash2" class="size-4 mr-1.5" />
              Delete Department
            </Button>
          </div>
        </div>{/if}

      
      <DepartmentDeleteDialog open={isDeleteOpen} departmentId={department.id} departmentName={department.name} departmentCode={department.code} onClose={() => setIsDeleteOpen(false)} onDeleted={() => {
          router.push("/app/departments");

        }} />

      
      <DepartmentTeamDialog open={isTeamDialogOpen} mode={teamDialogMode} departmentId={department.id} departmentName={department.name} initialTeam={selectedTeam} roster={department.roster} onClose={() => setIsTeamDialogOpen(false)} onSaved={async () => {
          await handleDateChange(selectedDate);

        }} />

      <DepartmentTeamDeleteDialog open={isTeamDeleteOpen} departmentId={department.id} team={selectedTeam} onClose={() => setIsTeamDeleteOpen(false)} onDeleted={async () => {
          await handleDateChange(selectedDate);

        }} />
    </div>
