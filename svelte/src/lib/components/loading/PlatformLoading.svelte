<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Skeleton from "$lib/components/ui/Skeleton.svelte";
import KpiGridSkeleton from "$lib/components/ui/KpiGridSkeleton.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";

</script>
<div class="space-y-8 animate-fade-in" aria-busy="true" aria-label="Loading platform overview">
      
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Skeleton class="h-5 w-28 rounded-full" />
            <Skeleton class="h-4 w-32" />
          </div>
          <Skeleton class="h-9 w-64 sm:w-80" />
          <Skeleton class="h-4 w-96 max-w-full" />
        </div>
        <div class="flex items-center gap-3">
          <Skeleton class="h-8 w-36 rounded-lg" />
          <Skeleton class="h-8 w-36 rounded-lg" />
        </div>
      </div>

      
      <KpiGridSkeleton count={4} />

      
      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="flex flex-row items-center justify-between pb-2 border-b border-border/40">
          <div class="space-y-1">
            <Skeleton class="h-5 w-64" />
            <Skeleton class="h-3.5 w-80" />
          </div>
          <Skeleton class="h-7 w-32 rounded-md" />
        </CardHeader>
        <CardContent class="pt-4">
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {#each Array.from({ length: 4 }) as _, i}<div class="space-y-2">
                <Skeleton class="h-3.5 w-28" />
                <Skeleton class="h-7 w-20" />
                <Skeleton class="h-3 w-36" />
              </div>{/each}
          </div>
        </CardContent>
      </Card>

      
      <div class="grid gap-6 xl:grid-cols-3">
        {#each Array.from({ length: 3 }) as _, colIdx}<Card class="flex flex-col border-border/80 bg-surface shadow-xs">
            <CardHeader class="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <div class="space-y-1">
                <Skeleton class="h-5 w-40" />
                <Skeleton class="h-3.5 w-48" />
              </div>
              <Skeleton class="h-4 w-16" />
            </CardHeader>
            <CardContent class="flex-1 pt-4 space-y-3">
              {#each Array.from({ length: 4 }) as _, rowIdx}<div class="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <div class="flex items-center gap-3">
                    <Skeleton class="size-9 rounded-lg shrink-0" />
                    <div class="space-y-1.5">
                      <Skeleton class="h-4 w-32" />
                      <Skeleton class="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton class="h-5 w-16 rounded-full" />
                </div>{/each}
            </CardContent>
          </Card>{/each}
      </div>
    </div>
