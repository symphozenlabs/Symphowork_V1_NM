<script lang="ts">
let{data}=$props();const result=$derived(data.result);const user=$derived(data.user);const tenant=$derived(data.tenant);const canCreate=$derived(data.canCreate);const canInvite=$derived(data.canInvite);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import LinkButton from "$lib/components/ui/LinkButton.svelte";
import WorkforceDirectoryTable from "$lib/components/employees/WorkforceDirectoryTable.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              People Operations
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {result.total} {#if result.total === 1}{"record"}{:else}{"records"}{/if}
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Workforce Directory
          </h1>
          <p class="mt-1 text-sm text-muted">
            Manage organization employee profiles, role authorizations, onboarding lifecycles, and invitation statuses.
          </p>
        </div>

        {#if canCreate}<div class="shrink-0">
            <LinkButton size="sm" class="gap-1.5" href="/app/employees/new">
                <SvgIcon name="UserPlus" class="h-4 w-4" />
                <span>Onboard Employee</span>
              </LinkButton>
          </div>{/if}
      </div>

      
      <WorkforceDirectoryTable initialEmployees={result.rows} initialTotal={result.total} initialPage={result.page} initialPageSize={result.pageSize} canInvite={canInvite} currentUserId={user.id} currentUserRole={tenant.role?.key} isPlatformOwner={Boolean(user.platformRole && user.platformRole !== "NONE")} />
    </div>
