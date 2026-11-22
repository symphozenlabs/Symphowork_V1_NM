<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import OrganizationCreateDialog from "$lib/components/platform/OrganizationCreateDialog.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import OrganizationListTable from "$lib/components/platform/OrganizationListTable.svelte";
import type { PageProps } from './$types';
let { data }: PageProps = $props();
const result = $derived(data.result);
const plansData = $derived(data.plans);
const autoOpen = $derived(data.autoOpen);
const serializedRows = $derived(data.serializedRows);
</script>
<div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Tenant Management
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {#if result.total === 1}{"organization"}{:else}{"organizations"}{/if}
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Organizations & Multi-Tenant Registry
          </h1>
          <p class="mt-1 text-sm text-muted">
            Manage tenant lifecycles, monitor onboarding stages, and inspect tenant health without entering tenant membership context.
          </p>
        </div>
        <div class="shrink-0">
          <OrganizationCreateDialog defaultOpen={autoOpen} initialPlans={plansData} />
        </div>
      </div>

      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="border-b border-border/50 pb-4">
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-base font-semibold text-foreground">
                Registered Organizations
              </CardTitle>
              <p class="text-xs text-muted">
                Filter by status, search by name or subdomain slug, and review provisioning states
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="pt-6">
          <OrganizationListTable initialRows={serializedRows} />
        </CardContent>
      </Card>
    </div>
