<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Skeleton from "$lib/components/ui/Skeleton.svelte";

let {hasBadge=true,hasAction=false}:{hasBadge?:boolean;hasAction?:boolean}=$props();
</script>
<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div class="space-y-2">
        {#if hasBadge}<div class="flex items-center gap-2">
            <Skeleton class="h-5 w-24 rounded-full" />
            <Skeleton class="h-5 w-28 rounded-md" />
          </div>{/if}
        <Skeleton class="h-8 w-64 sm:w-80" />
        <Skeleton class="h-4 w-72 sm:w-96 max-w-full" />
      </div>
      {#if hasAction}<div class="flex items-center gap-3">
          <Skeleton class="h-9 w-32 rounded-lg" />
        </div>{/if}
    </div>
