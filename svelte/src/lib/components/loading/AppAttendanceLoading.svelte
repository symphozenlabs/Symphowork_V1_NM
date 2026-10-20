<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import BrandedLoader from "$lib/components/ui/BrandedLoader.svelte";
import Skeleton from "$lib/components/ui/Skeleton.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";

</script>
<div class="space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading attendance status">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <BrandedLoader inline message="Loading attendance status..." />
          </div>
          <Skeleton class="h-8 w-64 sm:w-80" />
          <Skeleton class="h-4 w-96 max-w-full" />
        </div>
      </div>

      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="border-b border-border/50 pb-4">
          <div class="flex items-center gap-2.5">
            <Skeleton class="size-9 rounded-xl" />
            <div class="space-y-1">
              <Skeleton class="h-4 w-56" />
              <Skeleton class="h-3 w-72" />
            </div>
          </div>
        </CardHeader>
        <CardContent class="pt-6 space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <Skeleton class="h-10 w-36 rounded-lg" />
            <Skeleton class="h-10 w-36 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/80 bg-surface shadow-xs">
        <CardHeader class="border-b border-border/50 pb-4">
          <Skeleton class="h-5 w-48" />
        </CardHeader>
        <CardContent class="pt-6 space-y-3">
          {#each Array.from({ length: 3 }) as _, i}<div class="flex items-center justify-between p-3 border border-border/60 rounded-xl">
              <Skeleton class="h-4 w-40" />
              <Skeleton class="h-5 w-20 rounded-full" />
            </div>{/each}
        </CardContent>
      </Card>
    </div>
