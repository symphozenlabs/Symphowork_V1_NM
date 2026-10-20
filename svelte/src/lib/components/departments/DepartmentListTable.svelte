<script lang="ts">
let requestError=$state("");
import type{DepartmentDateContext,DepartmentListItem,DepartmentManagerSummary}from'$lib/domain/departments/types';
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import DepartmentCreateDialog from "$lib/components/departments/DepartmentCreateDialog.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface DepartmentListTableProps {
  initialItems: DepartmentListItem[];
  initialDateContext: DepartmentDateContext;
  isOrganizationOwner: boolean;
}
let {
  initialItems,
  initialDateContext,
  isOrganizationOwner,
}:DepartmentListTableProps=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let items=$state<DepartmentListItem[]>(untrack(()=>(initialItems)));
const setItems=(next:typeof items|((previous:typeof items)=>typeof items))=>{items=typeof next==="function"?(next as (previous:typeof items)=>typeof items)(items):next;};
let dateContext=$state<DepartmentDateContext>(untrack(()=>(initialDateContext)));
const setDateContext=(next:typeof dateContext|((previous:typeof dateContext)=>typeof dateContext))=>{dateContext=typeof next==="function"?(next as (previous:typeof dateContext)=>typeof dateContext)(dateContext):next;};
let search=$state(untrack(()=>("")));
const setSearch=(next:typeof search|((previous:typeof search)=>typeof search))=>{search=typeof next==="function"?(next as (previous:typeof search)=>typeof search)(search):next;};
let selectedDate=$state(untrack(()=>(initialDateContext.date)));
const setSelectedDate=(next:typeof selectedDate|((previous:typeof selectedDate)=>typeof selectedDate))=>{selectedDate=typeof next==="function"?(next as (previous:typeof selectedDate)=>typeof selectedDate)(selectedDate):next;};
let isLoading=$state(untrack(()=>(false)));
const setIsLoading=(next:typeof isLoading|((previous:typeof isLoading)=>typeof isLoading))=>{isLoading=typeof next==="function"?(next as (previous:typeof isLoading)=>typeof isLoading)(isLoading):next;};
let isCreateOpen=$state(untrack(()=>(false)));
const setIsCreateOpen=(next:typeof isCreateOpen|((previous:typeof isCreateOpen)=>typeof isCreateOpen))=>{isCreateOpen=typeof next==="function"?(next as (previous:typeof isCreateOpen)=>typeof isCreateOpen)(isCreateOpen):next;};
async function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    setIsLoading(true);requestError="";
    try {
      const res = await fetch(`/api/app/departments?date=${encodeURIComponent(newDate)}`);
      const data = await res.json();
      if(!res.ok||!data.success)throw new Error(data.error?.message??"Unable to load departments.");
      if (data.success) {
        setItems(data.items);
        setDateContext(data.dateContext);
      }
    } catch(cause) {
      requestError=cause instanceof Error?cause.message:"Unable to load departments.";
    } finally {
      setIsLoading(false);
    }
  }
const filteredItems=$derived(items.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.manager?.displayName && d.manager.displayName.toLowerCase().includes(q))
    );
  }));
</script>
<div class="space-y-6">
{#if requestError}<p role="alert" class="rounded-xl border border-danger-border bg-danger-bg p-3 text-sm text-danger">{requestError}</p>{/if}
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Departments & Functional Pods
          </h1>
          <p class="mt-0.5 text-xs text-muted sm:text-sm">
            Workspace organizational hierarchy, manager assignments, and daily workforce presence.
          </p>
        </div>

        {#if isOrganizationOwner}<Button onclick={() => setIsCreateOpen(true)} class="shrink-0">
            <SvgIcon name="Plus" class="size-4 mr-1.5" />
            Create Department
          </Button>{/if}
      </div>

      
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div class="relative w-full sm:max-w-xs">
          <SvgIcon name="Search" class="absolute left-3 top-2.5 size-4 text-slate-400" />
          <Input value={search} oninput={(e) => setSearch(e.currentTarget.value)} placeholder="Search departments or managers…" class="pl-9 text-xs" />
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <SvgIcon name="Calendar" class="size-4 text-primary shrink-0" />
            <label for="dept-date-picker" class="text-xs font-medium text-slate-600">
              Attendance date:
            </label>
            <input id="dept-date-picker" type="date" value={selectedDate} onchange={(e) => void handleDateChange(e.currentTarget.value)} class="bg-transparent text-xs font-semibold text-foreground focus:outline-none" />
          </div>

          {#if dateContext.isHoliday}<span class="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
              <SvgIcon name="Sparkles" class="size-3" />
              Holiday: {dateContext.holidayName || "Public Holiday"}
            </span>{/if}

          {#if !dateContext.isWorkingDay && !dateContext.isHoliday}<span class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Weekly Rest Day (Non-working)
            </span>{/if}
        </div>
      </div>

      
      <Card>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200/90 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th class="py-3 px-4">Code</th>
                  <th class="py-3 px-4">Department Name</th>
                  <th class="py-3 px-4">Department Manager</th>
                  <th class="py-3 px-4 text-center">Total Workforce</th>
                  <th class="py-3 px-4 text-center">
                    Present
                    <span class="block text-[10px] font-normal normal-case text-muted">
                      {dateContext.date}
                    </span>
                  </th>
                  <th class="py-3 px-4 text-center">
                    Absent
                    <span class="block text-[10px] font-normal normal-case text-muted">
                      {dateContext.date}
                    </span>
                  </th>
                  <th class="py-3 px-4 text-center">
                    On Leave
                    <span class="block text-[10px] font-normal normal-case text-muted">
                      {dateContext.date}
                    </span>
                  </th>
                  <th class="py-3 px-4 text-center">
                    Pending
                    <span class="block text-[10px] font-normal normal-case text-muted">
                      {dateContext.date}
                    </span>
                  </th>
                  <th class="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                {#if isLoading}<tr>
                    <td colspan={9} class="py-12 text-center text-xs text-muted">
                      Loading department attendance data…
                    </td>
                  </tr>{:else}{#if filteredItems.length === 0}<tr>
                    <td colspan={9} class="py-12 text-center text-xs text-muted space-y-2">
                      <SvgIcon name="Building2" class="mx-auto size-8 text-slate-300" />
                      <p class="font-semibold text-slate-700">No departments found.</p>
                      <p class="text-slate-500">
                        {#if search}{"Try adjusting your search criteria."}{:else}{#if isOrganizationOwner}{"Get started by creating your first company department."}{:else}{"No departments have been configured by your Organization Owner yet."}{/if}{/if}
                      </p>
                    </td>
                  </tr>{:else}{#each filteredItems as dept}<tr class="hover:bg-slate-50/80 transition-colors duration-100 group">
                      
                      <td class="py-3.5 px-4">
                        <span class="inline-flex items-center font-mono font-bold text-xs px-2.5 py-0.5 rounded-md border border-[#CDE0CC] bg-[#E2EDE1] text-primary">
                          {dept.code}
                        </span>
                      </td>

                      
                      <td class="py-3.5 px-4 font-semibold text-foreground">
                        <a href={`/app/departments/${dept.id}`} class="hover:text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs">
                          {dept.name}
                        </a>
                        {#if dept.status === "inactive"}<span class="ml-2 inline-flex items-center text-[10px] font-bold uppercase rounded-sm bg-slate-100 px-1.5 py-0.5 text-slate-500">
                            Inactive
                          </span>{/if}
                        {#if dept.description}<p class="text-[11px] font-normal text-muted truncate max-w-xs mt-0.5">
                            {dept.description}
                          </p>{/if}
                      </td>

                      
                      <td class="py-3.5 px-4 text-slate-700">
                        {#if dept.manager}<div class="flex items-center gap-2">
                            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {dept.manager.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div class="truncate max-w-[180px]">
                              <p class="font-medium text-foreground text-xs leading-none">
                                {dept.manager.displayName}
                              </p>
                              <p class="text-[10px] text-muted font-normal mt-0.5">
                                {dept.manager.employeeId} · {dept.manager.roleTitle || "Manager"}
                              </p>
                            </div>
                          </div>{:else}<span class="text-slate-400 font-normal italic">Unassigned</span>{/if}
                      </td>

                      
                      <td class="py-3.5 px-4 text-center font-bold text-slate-800 text-sm">
                        {dept.totalEmployees}
                      </td>

                      
                      <td class="py-3.5 px-4 text-center">
                        <span class="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                          <SvgIcon name="CheckCircle2" class="size-3" />
                          {dept.presentCount}
                        </span>
                      </td>

                      
                      <td class="py-3.5 px-4 text-center">
                        <span class={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                            dept.absentCount > 0
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}>
                          {#if dept.absentCount > 0}<SvgIcon name="XCircle" class="size-3" />{:else}<SvgIcon name="CheckCircle2" class="size-3" />{/if}
                          {dept.absentCount}
                        </span>
                      </td>

                      
                      <td class="py-3.5 px-4 text-center">
                        <span class={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                            dept.onLeaveCount > 0
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}>
                          {dept.onLeaveCount}
                        </span>
                      </td>

                      
                      <td class="py-3.5 px-4 text-center">
                        <span class={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                            dept.pendingCount > 0
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}>
                          {dept.pendingCount}
                        </span>
                      </td>

                      
                      <td class="py-3.5 px-4 text-right">
                        <a href={`/app/departments/${dept.id}`} class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors p-1 rounded-md" aria-label={`View details for ${dept.name}`}>
                          <span>View</span>
                          <SvgIcon name="ChevronRight" class="size-3.5" />
                        </a>
                      </td>
                    </tr>{/each}{/if}{/if}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      
      <DepartmentCreateDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={() => {
          void handleDateChange(selectedDate);

        }} />
    </div>
