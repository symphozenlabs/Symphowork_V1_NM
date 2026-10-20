<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import BrandedLoader from "$lib/components/ui/BrandedLoader.svelte";
import Skeleton from "$lib/components/ui/Skeleton.svelte";
import KpiGridSkeleton from "$lib/components/ui/KpiGridSkeleton.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";

</script>
<div class="space-y-8 animate-fade-in" aria-busy="true" aria-label="Loading workspace overview">
      
      <div class="flex items-center justify-between pb-1">
        <BrandedLoader inline message="Loading your workspace..." />
      </div>

      
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div class="space-y-2">
          <Skeleton class="h-5 w-32 rounded-full" />
          <Skeleton class="h-9 w-64 sm:w-80" />
          <Skeleton class="h-4 w-80 sm:w-96 max-w-full" />
        </div>
        <div class="flex items-center gap-2">
          <Skeleton class="h-9 w-28 rounded-lg" />
          <Skeleton class="h-9 w-28 rounded-lg" />
        </div>
      </div>

      
      <KpiGridSkeleton count={4} />

      
      <div class="grid gap-6 lg:grid-cols-2">
        <Card class="border-border/80 bg-surface shadow-xs">
          <CardHeader class="flex flex-row items-center justify-between pb-3 border-b border-border/40">
            <div class="space-y-1">
              <Skeleton class="h-5 w-40" />
              <Skeleton class="h-3.5 w-60" />
            </div>
            <Skeleton class="h-4 w-16" />
          </CardHeader>
          <CardContent class="pt-4 space-y-3">
            {#each Array.from({ length: 4 }) as _, i}<div class="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <div class="flex items-center gap-3">
                  <Skeleton class="size-9 rounded-lg shrink-0" />
                  <div class="space-y-1.5">
                    <Skeleton class="h-4 w-36" />
                    <Skeleton class="h-3 w-24" />
                  </div>
                </div>
                <Skeleton class="h-5 w-16 rounded-full" />
              </div>{/each}
          </CardContent>
        </Card>

        <Card class="border-border/80 bg-surface shadow-xs">
          <CardHeader class="flex flex-row items-center justify-between pb-3 border-b border-border/40">
            <div class="space-y-1">
              <Skeleton class="h-5 w-40" />
              <Skeleton class="h-3.5 w-60" />
            </div>
            <Skeleton class="h-4 w-16" />
          </CardHeader>
          <CardContent class="pt-4 space-y-3">
            {#each Array.from({ length: 4 }) as _, i}<div class="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <div class="flex items-center gap-3">
                  <Skeleton class="size-9 rounded-lg shrink-0" />
                  <div class="space-y-1.5">
                    <Skeleton class="h-4 w-36" />
                    <Skeleton class="h-3 w-24" />
                  </div>
                </div>
                <Skeleton class="h-5 w-16 rounded-full" />
              </div>{/each}
          </CardContent>
        </Card>
      </div>
    </div>
