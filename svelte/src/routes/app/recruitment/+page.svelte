<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import AtsDashboard from "$lib/components/ats/AtsDashboard.svelte";
import AtsInterviewPanel from "$lib/components/ats/AtsInterviewPanel.svelte";

</script>
<div class="space-y-8">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Talent Acquisition & ATS
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Requisitions & Pipeline
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Recruitment & Talent Operations
          </h1>
          <p class="mt-1 text-sm text-muted">
            Manage job requisitions, candidate pipelines, interview workflows, and talent pools with deterministic candidate evaluation.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a href="/app/recruitment/intelligence" class="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10">
            <SvgIcon name="Sparkles" class="h-4 w-4" />
            Candidate Intelligence Search
          </a>
        </div>
      </div>

      
      <AtsDashboard />

      
      <div class="pt-2">
        <AtsInterviewPanel />
      </div>
    </div>
