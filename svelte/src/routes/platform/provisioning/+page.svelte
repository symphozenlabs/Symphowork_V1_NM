<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import ProvisioningManager from "$lib/components/platform/ProvisioningManager.svelte";
import type { PageProps } from './$types';
let { data }: PageProps = $props();
const rows = $derived(data.rows);
const serializedRows = $derived(data.rows);
</script>
<div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Orchestration Engine
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {rows.length} {#if rows.length === 1}{"pipeline job"}{:else}{"pipeline jobs"}{/if}
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tenant Provisioning Pipeline
          </h1>
          <p class="mt-1 text-sm text-muted">
            End-to-end multi-step orchestration pipeline: workspace isolation, database roles, plan subscriptions, and owner credential dispatch.
          </p>
        </div>
      </div>

      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="border-b border-border/50 pb-4">
          <CardTitle class="text-base font-semibold text-foreground">
            Pipeline Orchestration Registry
          </CardTitle>
          <p class="text-xs text-muted">
            Inspect real-time stage progress, retry failed pipeline jobs, or re-dispatch owner invitations
          </p>
        </CardHeader>
        <CardContent class="pt-6">
          <ProvisioningManager initialRows={serializedRows} />
        </CardContent>
      </Card>
    </div>
