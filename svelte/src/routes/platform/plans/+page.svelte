<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import PlanManagement from "$lib/components/platform/PlanManagement.svelte";
import type { PageProps } from './$types';
let { data }: PageProps = $props();
const initialPlans = $derived(data.initialPlans);
const initialFeatures = $derived(data.initialFeatures);
const canEditPlan = $derived(data.canEditPlan);
const canEditFeatures = $derived(data.canEditFeatures);
</script>
<div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Commercial Engine
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {initialPlans.length} active tiers
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Plans & Modular Entitlements
          </h1>
          <p class="mt-1 text-sm text-muted">
            Platform-owned pricing structures, user capacities, storage quotas, and feature flags. Values represent operational tier boundaries.
          </p>
        </div>
      </div>

      <PlanManagement initialPlans={initialPlans} initialFeatures={initialFeatures} canEditPlan={canEditPlan} canEditFeatures={canEditFeatures} />
    </div>
