<script lang="ts">
let{data}=$props();const result=$derived(data.result);const query=$derived(data.query);const serializedRows=$derived(data.serializedRows);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import PlatformAuditList from "$lib/components/platform/PlatformAuditList.svelte";

</script>
<div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Immutable Governance
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {#if result.total === 1}{"audit event"}{:else}{"audit events"}{/if}
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Audit Trail
          </h1>
          <p class="mt-1 text-sm text-muted">
            Tamper-evident governance ledger logging administrative changes, security actions, and tenant lifecycle events with sanitized metadata.
          </p>
        </div>
      </div>

      <PlatformAuditList initialRows={serializedRows} total={result.total} page={result.page} pageSize={result.pageSize} pageCount={result.pageCount} initialQuery={query} />
    </div>
