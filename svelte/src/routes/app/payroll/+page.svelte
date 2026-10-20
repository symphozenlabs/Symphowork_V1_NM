<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import LinkButton from "$lib/components/ui/LinkButton.svelte";
import PayrollDashboard from "$lib/components/payroll/PayrollDashboard.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Compensation & Payroll
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Statutory Calculation Engine
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Payroll Operations & Runs
          </h1>
          <p class="mt-1 text-sm text-muted">
            Manage effective-dated salary structures, attendance-integrated gross-to-net calculations, statutory deductions, and approval sign-offs.
          </p>
        </div>

        <div class="shrink-0">
          <LinkButton variant="secondary" size="sm" class="gap-1.5" href="/app/payroll/payslips">
              <SvgIcon name="FileText" class="h-4 w-4" />
              <span>My Payslips</span>
            </LinkButton>
        </div>
      </div>

      
      <PayrollDashboard />
    </div>
