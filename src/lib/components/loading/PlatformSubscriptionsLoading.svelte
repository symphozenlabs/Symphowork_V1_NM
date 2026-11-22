<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Skeleton from "$lib/components/ui/Skeleton.svelte";
import TableCardSkeleton from "$lib/components/ui/TableCardSkeleton.svelte";

</script>
<div class="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading subscriptions">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Skeleton class="h-5 w-28 rounded-full" />
            <Skeleton class="h-5 w-24 rounded-md" />
          </div>
          <Skeleton class="h-8 w-64 sm:w-80" />
          <Skeleton class="h-4 w-96 max-w-full" />
        </div>
      </div>

      <TableCardSkeleton rows={6} hasFilter={true} />
    </div>
