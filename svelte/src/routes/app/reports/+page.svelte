<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import ReportDashboard from "$lib/components/reports/ReportDashboard.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <SvgIcon name="BarChart3" class="h-3 w-3" />
              Business Intelligence & Analytics
            </span>
            <span class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              <SvgIcon name="ShieldCheck" class="h-3 w-3 text-emerald-600" />
              Role-Governed Telemetry
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Executive Operational Reporting
          </h1>
          <p class="mt-1 text-sm text-muted">
            Aggregated headcount distributions, attendance patterns, leave burn rates, expense totals, recruitment pipeline health, and payroll costs.
          </p>
        </div>
      </div>

      
      <ReportDashboard />
    </div>
