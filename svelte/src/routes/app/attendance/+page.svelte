<script lang="ts">
let{data}=$props();const canViewOthers=$derived(data.canViewOthers);const tenant=$derived(data.tenant);const initialEmployeeId=$derived(data.initialEmployeeId);const initialDate=$derived(data.initialDate);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import AttendanceViewContainer from "$lib/components/attendance/AttendanceViewContainer.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Time & Attendance
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Live Workforce Tracking
            </span>
            {#if canViewOthers}<span class="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 font-semibold">
                HR Access
              </span>{/if}
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Attendance & Time Clock
          </h1>
          <p class="mt-1 text-sm text-muted">
            Log shift punches, track worked hours, and submit attendance regularization requests synchronized with your organizational working calendar.
          </p>
        </div>
      </div>

      
        <AttendanceViewContainer canViewOthers={canViewOthers} userRoleKey={tenant.role?.key} initialEmployeeId={initialEmployeeId} initialDate={initialDate} />
      
    </div>
