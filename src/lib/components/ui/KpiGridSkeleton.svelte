<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import Skeleton from "$lib/components/ui/Skeleton.svelte";

let {count=4}:{count?:number}=$props();
</script>
<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {#each Array.from({ length: count }) as _, i}<Card class="border-border/80 bg-surface shadow-xs">
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <Skeleton class="h-4 w-28" />
              <Skeleton class="size-9 rounded-lg" />
            </div>
            <div class="mt-3 flex items-baseline justify-between">
              <Skeleton class="h-8 w-16" />
              <Skeleton class="h-5 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>{/each}
    </div>
