<script lang="ts">
let{data}=$props();const result=$derived(data.result);const query=$derived(data.query);const serializedRows=$derived(data.serializedRows);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import SupportOrganizationList from "$lib/components/platform/SupportOrganizationList.svelte";

</script>
<div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Support Operations
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {#if result.total === 1}{"organization"}{:else}{"organizations"}{/if} available
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Organization Support Console
          </h1>
          <p class="mt-1 text-sm text-muted">
            Read-only operational troubleshooting view. Support mode maintains strict tenant boundary isolation and never bypasses row-level employee privacy gates.
          </p>
        </div>
      </div>

      <SupportOrganizationList initialRows={serializedRows} total={result.total} page={result.page} pageSize={result.pageSize} pageCount={result.pageCount} initialQuery={query} />
    </div>
