<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import RecruiterIntelligenceSearch from "$lib/components/ats/RecruiterIntelligenceSearch.svelte";

</script>
<div class="space-y-6">
      
      <div>
        <a href="/app/recruitment" class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground">
          <SvgIcon name="ArrowLeft" class="h-3.5 w-3.5" />
          Back to Recruitment Operations
        </a>
      </div>

      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <SvgIcon name="Sparkles" class="h-3 w-3" />
              Recruiter Intelligence
            </span>
            <span class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              <SvgIcon name="ShieldCheck" class="h-3 w-3 text-emerald-600" />
              Evidence-Based Ranking
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Candidate Intelligence Search
          </h1>
          <p class="mt-1 text-sm text-muted">
            Interpret recruiter intent, apply transparent semantic filters, and inspect verifiable resume evidence behind every matched result.
          </p>
        </div>
      </div>

      
      <RecruiterIntelligenceSearch />
    </div>
