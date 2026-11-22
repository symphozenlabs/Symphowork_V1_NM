<script lang="ts">
let {data}=$props();
const rows=$derived(data.employees);
const tenant=$derived({organization:data.context.organization!});
import SvgIcon from "$lib/components/ui/Icon.svelte";
import CompanyDirectoryView from "$lib/components/employees/CompanyDirectoryView.svelte";
const activeStatuses = ["active", "probation", "confirmed"];
</script>
<div class="space-y-6"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div class="flex items-center gap-2"><span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"><SvgIcon name="Users" class="h-3 w-3" />Company Directory
            </span><span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">{rows.length}{#if rows.length === 1}{"colleague"}{:else}{"colleagues"}{/if}</span></div><h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Coworkers & Organization Directory
          </h1><p class="mt-1 text-sm text-muted">Find colleagues, departments, designations, and corporate email addresses across {tenant.organization.name}.
          </p></div></div><CompanyDirectoryView initialEmployees={rows} /></div>
