<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import BillingOverview from "$lib/components/billing/BillingOverview.svelte";

</script>
<div class="space-y-6">
      
      <div>
        <a href="/app/settings" class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground">
          <SvgIcon name="ArrowLeft" class="h-3.5 w-3.5" />
          Back to Organization Settings
        </a>
      </div>

      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <SvgIcon name="CreditCard" class="h-3 w-3" />
              Commercial & Subscription
            </span>
            <span class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              <SvgIcon name="ShieldCheck" class="h-3 w-3 text-emerald-600" />
              Active Plan Entitlements
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Subscription Plan & Resource Usage
          </h1>
          <p class="mt-1 text-sm text-muted">
            Inspect active plan quotas, employee seat allocations, storage utilization, and measured enterprise billing metrics.
          </p>
        </div>
      </div>

      
      <BillingOverview />
    </div>
