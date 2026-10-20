<script lang="ts">
let{data}=$props();const configuration=$derived(data.configuration);
const settingMetadata:Record<string,{title:string;description:string;icon:string;example:string}>={
    "platform.display_name": {
      title: "Platform Display Name",
      description: "Default brand designation displayed across global notifications and workspace emails.",
      icon:"Settings",
      example: "e.g., SymphoWork Enterprise",
    },
    "platform.default_timezone": {
      title: "Default Platform Timezone",
      description: "Standard operational timezone used for audit log timestamps and scheduled job execution.",
      icon:"Clock",
      example: "e.g., America/New_York or UTC",
    },
    "platform.default_currency": {
      title: "Commercial Currency Code",
      description: "Standard three-letter ISO currency code applied across plan billing schedules.",
      icon:"DollarSign",
      example: "e.g., USD, EUR, or GBP",
    },
    "platform.support_contact": {
      title: "Platform Support Email",
      description: "Official escalation contact address displayed on tenant invitation and error screens.",
      icon:"Mail",
      example: "e.g., support@symphowork.internal",
    },
  };

import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import ConfigurationEditor from "$lib/components/platform/ConfigurationEditor.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Operational Defaults
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {configuration.length} typed settings
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Configuration
          </h1>
          <p class="mt-1 text-sm text-muted">
            Safe operational defaults and system settings. Infrastructure secrets and credentials remain strictly isolated outside the application.
          </p>
        </div>
      </div>

      
      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SvgIcon name="SlidersHorizontal" class="h-4 w-4" />
            </div>
            <div>
              <CardTitle class="text-base font-semibold text-foreground">
                Runtime System Properties
              </CardTitle>
              <p class="text-xs text-muted">
                Allowlisted system settings validated strictly against runtime Zod schemas
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent class="divide-y divide-border/60 p-6">
          {#each configuration as setting}{@const meta = settingMetadata[setting.key] ?? {
              title: setting.key,
              description: "Allowlisted platform configuration property.",
              icon: "Settings",
              example: "",
            }}{@const Icon = meta.icon}<div class="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-12 lg:items-center">
                <div class="space-y-1 lg:col-span-5">
                  <div class="flex items-center gap-2">
                    <SvgIcon name={Icon} class="h-4 w-4 text-primary" />
                    <p class="font-semibold text-sm text-foreground">{meta.title}</p>
                  </div>
                  <p class="text-xs text-muted leading-relaxed">{meta.description}</p>
                  <p class="font-mono text-[11px] text-slate-400">
                    Key: {setting.key} {#if meta.example}{`· ${meta.example}`}{:else}{""}{/if}
                  </p>
                </div>

                <div class="lg:col-span-7">
                  <ConfigurationEditor setting={setting} />
                </div>
              </div>{/each}
        </CardContent>
      </Card>

      
      <Card class="border-border/80 bg-surface shadow-xs">
        <CardContent class="p-4">
          <div class="flex items-start gap-3">
            <SvgIcon name="Lock" class="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div class="text-xs text-muted leading-relaxed">
              <strong class="text-foreground">Secret Isolation:</strong> Database credentials, cryptographic signing keys, object storage tokens, and third-party API secrets are never stored in the database or exposed via this interface. They are managed strictly via environment configuration.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
