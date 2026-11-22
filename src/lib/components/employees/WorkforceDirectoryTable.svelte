<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import LinkButton from "$lib/components/ui/LinkButton.svelte";
import EmployeeInvitationActions from "$lib/components/employees/EmployeeInvitationActions.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {onDestroy,untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll,replaceState} from "$app/navigation";
import {notify} from "$lib/client/toast";
export interface DirectoryEmployee {
  id: string;
  organizationId: string;
  userId: string | null;
  employeeId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName: string;
  personalEmail?: string | null;
  workEmail?: string | null;
  phone?: string | null;
  joiningDate?: string | null;
  status: string;
  roleKey?: string | null;
  roleTitle?: string | null;
}
interface WorkforceDirectoryTableProps {
  initialEmployees: DirectoryEmployee[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  canInvite: boolean;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  isPlatformOwner?: boolean;
}
const statusMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  onboarding: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  invited: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
  terminated: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
};
const roleBadgeStyles: Record<string, string> = {
  ORGANIZATION_OWNER: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
  HR_ADMIN: "bg-blue-50 text-blue-800 border-blue-200/90",
  HR_EXECUTIVE: "bg-cyan-50 text-cyan-800 border-cyan-200/90",
  FINANCE_ADMIN: "bg-amber-50 text-amber-800 border-amber-200/90",
  MANAGER: "bg-indigo-50 text-indigo-800 border-indigo-200/90",
  TEAM_LEAD: "bg-teal-50 text-teal-800 border-teal-200/90",
  PROJECT_MANAGER: "bg-violet-50 text-violet-800 border-violet-200/90",
  RECRUITER: "bg-rose-50 text-rose-800 border-rose-200/90",
  EMPLOYEE: "bg-slate-100 text-slate-700 border-slate-200/90",
};
let {
  initialEmployees,
  initialTotal,
  initialPage,
  initialPageSize,
  canInvite,
  currentUserId,
  currentUserRole,
  isPlatformOwner,
}:WorkforceDirectoryTableProps=$props();
const pathname=$derived(routePage.url.pathname);
const searchParams=$derived(routePage.url.searchParams);
const initialSearchParam=$derived(searchParams.get("search") || "");
let searchInput=$state(untrack(()=>(initialSearchParam)));
const setSearchInput=(next:typeof searchInput|((previous:typeof searchInput)=>typeof searchInput))=>{searchInput=typeof next==="function"?(next as (previous:typeof searchInput)=>typeof searchInput)(searchInput):next;};
let activeSearch=$state(untrack(()=>(initialSearchParam)));
const setActiveSearch=(next:typeof activeSearch|((previous:typeof activeSearch)=>typeof activeSearch))=>{activeSearch=typeof next==="function"?(next as (previous:typeof activeSearch)=>typeof activeSearch)(activeSearch):next;};
let currentPage=$state(untrack(()=>(initialPage)));
const setCurrentPage=(next:typeof currentPage|((previous:typeof currentPage)=>typeof currentPage))=>{currentPage=typeof next==="function"?(next as (previous:typeof currentPage)=>typeof currentPage)(currentPage):next;};
let pageSize=$state(untrack(()=>(initialPageSize)));
const setPageSize=(next:typeof pageSize|((previous:typeof pageSize)=>typeof pageSize))=>{pageSize=typeof next==="function"?(next as (previous:typeof pageSize)=>typeof pageSize)(pageSize):next;};
let employees=$state<DirectoryEmployee[]>(untrack(()=>(initialEmployees)));
const setEmployees=(next:typeof employees|((previous:typeof employees)=>typeof employees))=>{employees=typeof next==="function"?(next as (previous:typeof employees)=>typeof employees)(employees):next;};
let totalCount=$state<number>(untrack(()=>(initialTotal)));
const setTotalCount=(next:typeof totalCount|((previous:typeof totalCount)=>typeof totalCount))=>{totalCount=typeof next==="function"?(next as (previous:typeof totalCount)=>typeof totalCount)(totalCount):next;};
let isLoading=$state(untrack(()=>(false)));
const setIsLoading=(next:typeof isLoading|((previous:typeof isLoading)=>typeof isLoading))=>{isLoading=typeof next==="function"?(next as (previous:typeof isLoading)=>typeof isLoading)(isLoading):next;};
$effect(()=>{initialEmployees;initialTotal;initialPage;initialPageSize;return untrack(() => {
    setEmployees(initialEmployees);
    setTotalCount(initialTotal);
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  });});
$effect(()=>{searchInput;activeSearch;return untrack(() => {
    const handler = setTimeout(() => {
      if (searchInput !== activeSearch) {
        setActiveSearch(searchInput);
        setCurrentPage(1); // Reset to page 1 on new query
      }
    }, 300);

    return () => clearTimeout(handler);
  });});
let directoryError=$state("");
let requestGeneration=0;
let directoryRequest:AbortController|undefined;
onDestroy(()=>{requestGeneration++;directoryRequest?.abort();});
const fetchDirectory=$derived.by(()=>{pathname;return async (query: string, page: number, size: number) => {
      const generation=++requestGeneration;
      directoryRequest?.abort();
      directoryRequest=new AbortController();
      directoryError="";
      setEmployees([]);
      setTotalCount(0);
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("search", query.trim());
        params.set("page", String(page));
        params.set("pageSize", String(size));

        // Update browser URL query string shallowly without triggering redundant Server Component flights
        const queryStr = params.toString();
        const newUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
        if (typeof window !== "undefined") {
          replaceState(newUrl, {});
        }

        const res = await fetch(`/api/app/employees?${params.toString()}`, {signal:directoryRequest.signal,cache:"no-store"});
        if (!res.ok) throw new Error("Failed to fetch employees");
        const json = await res.json();

        if (generation!==requestGeneration) return;
        if (json.success!==true || !Array.isArray(json.rows)) throw new Error("Invalid directory response");
        if (json.success) {
          setEmployees(json.rows || []);
          setTotalCount(json.total ?? json.rows?.length ?? 0);
        }
      } catch (err) {
        if (generation===requestGeneration) directoryError="Unable to load employees. Please retry.";
      } finally {
        if (generation===requestGeneration) setIsLoading(false);
      }
    };});
let mounted = false;
$effect(()=>{activeSearch;currentPage;pageSize;fetchDirectory;return untrack(() => {
    if (!mounted) {
      mounted = true;
      return;
    }
    void fetchDirectory(activeSearch, currentPage, pageSize);
  });});
const totalPages=$derived(Math.max(1, Math.ceil(totalCount / pageSize)));
const startRange=$derived(totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1);
const endRange=$derived(Math.min(currentPage * pageSize, totalCount));
const handleResetSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setCurrentPage(1);
  };
</script>
<div class="space-y-4">
      
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative flex-1 max-w-md">
          <SvgIcon name="Search" class="absolute left-3.5 top-2.5 size-4 text-muted pointer-events-none" />
          <input type="text" value={searchInput} oninput={(e) => setSearchInput(e.currentTarget.value)} placeholder="Search people by name, email, employee ID, or role…" aria-label="Search directory by name, email, employee ID, or role" class={cn(
              "h-10 w-full rounded-xl border border-border bg-white pl-9.5 pr-8 text-xs text-foreground placeholder:text-muted shadow-2xs transition-all",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              isLoading && "pr-9"
            )} />
          {#if searchInput}<button type="button" onclick={handleResetSearch} aria-label="Clear search" class="absolute right-3 top-2.5 rounded-sm p-0.5 text-muted hover:text-foreground transition-colors">
              <SvgIcon name="X" class="size-4" />
            </button>{/if}
          {#if isLoading}<SvgIcon name="Loader2" class="absolute right-3 top-3 size-4 animate-spin text-primary pointer-events-none" />{/if}
        </div>

        
        <div class="flex items-center gap-2 self-end sm:self-auto text-xs text-muted">
          <span>Show:</span>
          <select value={pageSize} onchange={(e) => {
              const newSize = Number(e.currentTarget.value);
              setPageSize(newSize);
              setCurrentPage(1);
            }} aria-label="Records per page" class="h-9 rounded-lg border border-border bg-white px-2.5 text-xs font-medium text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      
      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="border-b border-border/50 pb-4">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle class="text-base font-semibold text-foreground">
                Workforce Directory Roster
              </CardTitle>
              <p class="text-xs text-muted">
                Authoritative organization member roster, role authorizations, and onboarding states
              </p>
            </div>
            <span class="text-xs text-muted font-medium">
              {#if totalCount === 0}{"No people"}{:else}{`Showing ${startRange}–${endRange} of ${totalCount} ${totalCount === 1 ? "person" : "people"}`}{/if}
            </span>
          </div>
        </CardHeader>

        <CardContent class="pt-4">
          {#if directoryError}<div role="alert" class="p-4 text-rose-700">{directoryError}<Button onclick={()=>fetchDirectory(activeSearch,currentPage,pageSize)}>Retry</Button></div>
          {:else if isLoading}<p role="status">Loading employees�</p>
          {:else if totalCount === 0}<div class="rounded-xl border border-dashed border-border/80 p-8 text-center">
              <SvgIcon name="Users" class="h-8 w-8 text-slate-400 mx-auto mb-2" />
              {#if activeSearch}
                  <p class="text-sm font-semibold text-foreground">No matching people found</p>
                  <p class="mt-1 text-xs text-muted max-w-sm mx-auto">
                    We couldn&apos;t find anyone matching &ldquo;{activeSearch}&rdquo;. Try another name, email, employee ID, or role.
                  </p>
                  <div class="mt-4">
                    <Button type="button" variant="outline" size="sm" onclick={handleResetSearch}>
                      Clear search
                    </Button>
                  </div>
                {:else}
                  <p class="text-sm font-semibold text-foreground">No employee records yet</p>
                  <p class="mt-1 text-xs text-muted max-w-sm mx-auto">
                    Begin by creating your organization’s first employee profile. Onboarding and invitation access can follow.
                  </p>
                  <div class="mt-4">
                    <LinkButton size="sm" href="/app/employees/new">Create first employee</LinkButton>
                  </div>
                {/if}
            </div>{:else}<div class="overflow-x-auto rounded-xl border border-border/70">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50/70 border-b border-border/70 text-xs font-semibold text-muted uppercase tracking-wider">
                  <tr>
                    <th class="px-4 py-3">Employee</th>
                    <th class="px-4 py-3">Employee ID</th>
                    <th class="px-4 py-3">Role</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Joining Date</th>
                    <th class="px-4 py-3">Account Invitation</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border/50">
                  {#each employees as employee}{@const theme = statusMap[employee.status] || statusMap.active}{@const email = employee.workEmail ?? employee.personalEmail}{@const badgeClass = employee.roleKey
                      ? roleBadgeStyles[employee.roleKey] || "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-slate-50 text-slate-500 border-slate-200"}{@const isSelf = Boolean(
                      currentUserId &&
                      employee.userId === currentUserId &&
                      currentUserRole !== "ORGANIZATION_OWNER"
                    )}<tr class={cn(
                          "transition-colors",
                          isSelf ? "bg-slate-50/40 cursor-default" : "hover:bg-slate-50/70"
                        )} title={isSelf ? "This is your own profile." : undefined}>
                        
                        <td class="px-4 py-3.5">
                          <div class="flex items-center gap-3">
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                              {employee.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div class="min-w-0">
                              {#if isSelf}<span class="block font-semibold text-foreground text-sm cursor-default" title="This is your own profile." aria-label={`${employee.displayName} (This is your own profile)`}>
                                  {employee.displayName}
                                  <span class="ml-2 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                    You
                                  </span>
                                </span>{:else}<a href={`/app/employees/${employee.id}`} class="block font-semibold text-foreground text-sm hover:text-primary transition-colors">
                                  {employee.displayName}
                                </a>{/if}
                              {#if email}<span class="text-xs text-muted font-mono truncate block max-w-xs">
                                  {email}
                                </span>{/if}
                            </div>
                          </div>
                        </td>

                        
                        <td class="px-4 py-3.5 text-xs font-mono text-slate-600">
                          {employee.employeeId}
                        </td>

                        
                        <td class="px-4 py-3.5">
                          <span class={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border shadow-2xs",
                              badgeClass
                            )}>
                            {employee.roleTitle || "Unassigned"}
                          </span>
                        </td>

                        
                        <td class="px-4 py-3.5">
                          <span class={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                              theme.bg,
                              theme.text,
                              theme.border
                            )}>
                            <span class={cn("h-1.5 w-1.5 rounded-full", theme.dot)}></span>
                            {employee.status.toUpperCase()}
                          </span>
                        </td>

                        
                        <td class="px-4 py-3.5 text-xs text-muted">
                          {employee.joiningDate ?? "—"}
                        </td>

                        
                        <td class="px-4 py-3.5">
                          {#if canInvite}{#if employee.roleKey === "ORGANIZATION_OWNER" &&
                            currentUserRole !== "ORGANIZATION_OWNER" &&
                            !isPlatformOwner}<span class="text-xs text-muted font-medium">Protected</span>{:else}<EmployeeInvitationActions employeeId={employee.id} email={employee.personalEmail ?? employee.workEmail} status={employee.status} />{/if}{:else}<span class="text-xs text-muted">Restricted</span>{/if}
                        </td>
                      </tr>{/each}
                </tbody>
              </table>
            </div>{/if}

          
          {#if totalCount > 0}<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-4">
              <span class="text-xs text-muted">
                Showing <strong class="font-semibold text-foreground">{startRange}</strong> to{" "}
                <strong class="font-semibold text-foreground">{endRange}</strong> of{" "}
                <strong class="font-semibold text-foreground">{totalCount}</strong> people
              </span>

              <nav aria-label="Workforce pagination" class="flex items-center gap-1">
                <Button type="button" variant="outline" size="sm" onclick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage <= 1 || isLoading} aria-label="Previous page" class="h-8 w-8 p-0">
                  <SvgIcon name="ChevronLeft" class="size-4" />
                </Button>

                
                {#each Array.from({ length: totalPages }) as _, idx}{@const pageNum = idx + 1}{#if totalPages > 7 &&
                    pageNum !== 1 &&
                    pageNum !== totalPages &&
                    Math.abs(pageNum - currentPage) > 1}{#if pageNum === 2 || pageNum === totalPages - 1}<span class="px-1 text-xs text-muted">
                          …
                        </span>{:else}{/if}{:else}{@const isActive = pageNum === currentPage}<Button type="button" variant={isActive ? "primary" : "outline"} size="sm" onclick={() => setCurrentPage(pageNum)} disabled={isLoading} aria-current={isActive ? "page" : undefined} class={cn(
                        "h-8 min-w-[32px] px-2 text-xs",
                        isActive && "font-bold shadow-xs"
                      )}>
                      {pageNum}
                    </Button>{/if}{/each}

                <Button type="button" variant="outline" size="sm" onclick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages || isLoading} aria-label="Next page" class="h-8 w-8 p-0">
                  <SvgIcon name="ChevronRight" class="size-4" />
                </Button>
              </nav>
            </div>{/if}
        </CardContent>
      </Card>
    </div>
