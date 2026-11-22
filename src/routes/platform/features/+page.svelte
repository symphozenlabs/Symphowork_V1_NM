<script lang="ts">
let{data}=$props();const features=$derived(data.features);const enabledCount=$derived(features.filter(f=>f.enabled).length);const disabledCount=$derived(features.length-enabledCount);

import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import FeatureFlagToggle from "$lib/components/platform/FeatureFlagToggle.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Platform Controls
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {features.length} {#if features.length === 1}{"flag"}{:else}{"flags"}{/if} configured
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Feature Management
          </h1>
          <p class="mt-1 text-sm text-muted">
            Global operational switches governing platform functionality. Flags are evaluated across cluster runtimes independently of tenant commercial entitlements.
          </p>
        </div>
      </div>

      
      <div class="grid gap-4 sm:grid-cols-3">
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-4 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">Total Flags</p>
              <p class="mt-1 text-2xl font-bold text-foreground">{features.length}</p>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SvgIcon name="Sliders" class="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-4 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">Active / Enabled</p>
              <p class="mt-1 text-2xl font-bold text-emerald-600">{enabledCount}</p>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <SvgIcon name="ToggleRight" class="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-4 flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">Disabled</p>
              <p class="mt-1 text-2xl font-bold text-slate-500">{disabledCount}</p>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <SvgIcon name="ToggleLeft" class="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      
      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle class="text-base font-semibold text-foreground">
              Configured Feature Flags
            </CardTitle>
            <p class="text-xs text-muted">
              Toggle platform features on or off in real time with immediate cluster propagation
            </p>
          </div>
        </CardHeader>
        <CardContent class="p-6">
          {#if features.length}<div class="space-y-3">
              {#each features as flag}<div class="flex flex-col gap-4 rounded-xl border border-border/70 bg-slate-50/40 p-4 transition-colors hover:border-border hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                  <div class="space-y-1.5 min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-semibold text-sm text-foreground">
                        {flag.name}
                      </span>
                      <span class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600">
                        <SvgIcon name="Key" class="h-3 w-3 text-slate-400" />
                        {flag.key}
                      </span>
                      <span class={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          flag.enabled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                        <span class={`h-1.5 w-1.5 rounded-full ${
                            flag.enabled ? "bg-emerald-500" : "bg-slate-400"
                          }`}></span>
                        {#if flag.enabled}{"Enabled"}{:else}{"Disabled"}{/if}
                      </span>
                    </div>

                    {#if flag.description}<p class="text-xs text-muted leading-relaxed">
                        {flag.description}
                      </p>{/if}

                    <div class="flex items-center gap-1.5 text-[11px] text-muted pt-1">
                      <SvgIcon name="Clock" class="h-3 w-3" />
                      <span>Updated {new Date(flag.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div class="shrink-0 flex items-center gap-3">
                    <FeatureFlagToggle flag={flag} />
                  </div>
                </div>{/each}
            </div>{:else}<div class="rounded-xl border border-dashed border-border/80 p-8 text-center">
              <SvgIcon name="Sliders" class="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p class="text-sm font-semibold text-foreground">No platform feature flags configured</p>
              <p class="mt-1 text-xs text-muted max-w-sm mx-auto">
                No active feature toggles are registered. Add flags through migration scripts or platform bootstrap routines.
              </p>
            </div>{/if}
        </CardContent>
      </Card>
    </div>
