<script lang="ts">
let{data}=$props();const tenant=$derived(data.tenant);const canViewBilling=$derived(data.canViewBilling);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import MasterDataManager from "$lib/components/settings/MasterDataManager.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <SvgIcon name="Sliders" class="h-3 w-3" />
              Organization Master Configuration
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Governance & Taxonomies
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {tenant.organization.name}
          </h1>
          <p class="mt-1 text-sm text-muted">
            Configure organizational hierarchies, departments, designations, shifts, holidays, and working day calendars used across SymphoWork.
          </p>
        </div>

        
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <a href="/app/settings/workflows" class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50">
            <SvgIcon name="GitFork" class="h-3.5 w-3.5 text-primary" />
            Approval Workflows
          </a>
          {#if canViewBilling}<a href="/app/settings/billing" class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50">
              <SvgIcon name="CreditCard" class="h-3.5 w-3.5 text-primary" />
              Billing & Usage
            </a>{/if}
        </div>
      </div>

      
      <MasterDataManager />
    </div>
