<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import Skeleton from "$lib/components/ui/Skeleton.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";

let {count=3}:{count?:number}=$props();
</script>
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each Array.from({ length: count }) as _, i}<Card class="border-border/80 bg-surface shadow-xs">
          <CardHeader class="space-y-2 pb-3">
            <div class="flex items-center justify-between">
              <Skeleton class="h-5 w-32" />
              <Skeleton class="h-5 w-16 rounded-full" />
            </div>
            <Skeleton class="h-3.5 w-48" />
          </CardHeader>
          <CardContent class="space-y-3 pt-2">
            <Skeleton class="h-7 w-24" />
            <div class="space-y-2 pt-2 border-t border-border/50">
              <Skeleton class="h-3.5 w-full" />
              <Skeleton class="h-3.5 w-4/5" />
              <Skeleton class="h-3.5 w-2/3" />
            </div>
          </CardContent>
        </Card>{/each}
    </div>
