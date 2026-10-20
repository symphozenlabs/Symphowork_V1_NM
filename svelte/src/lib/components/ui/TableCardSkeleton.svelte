<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import Skeleton from "$lib/components/ui/Skeleton.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";

let {rows=5,hasFilter=true}:{rows?:number;hasFilter?:boolean}=$props();
</script>
<Card class="border-border/80 bg-surface shadow-xs">
      <CardHeader class="border-b border-border/50 pb-4">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <Skeleton class="h-5 w-44" />
            <Skeleton class="h-3.5 w-72" />
          </div>
        </div>
      </CardHeader>
      <CardContent class="pt-6 space-y-4">
        {#if hasFilter}<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton class="h-9 w-full sm:w-72 rounded-lg" />
            <div class="flex items-center gap-2">
              <Skeleton class="h-8 w-20 rounded-md" />
              <Skeleton class="h-8 w-20 rounded-md" />
            </div>
          </div>{/if}
        <div class="divide-y divide-border/60 rounded-xl border border-border/70 overflow-hidden">
          <div class="flex items-center justify-between bg-slate-50/80 px-4 py-3">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-4 w-20" />
            <Skeleton class="h-4 w-16" />
          </div>
          {#each Array.from({ length: rows }) as _, i}<div class="flex items-center justify-between px-4 py-3.5">
              <div class="flex items-center gap-3">
                <Skeleton class="size-9 rounded-lg shrink-0" />
                <div class="space-y-1">
                  <Skeleton class="h-4 w-36" />
                  <Skeleton class="h-3 w-24" />
                </div>
              </div>
              <Skeleton class="h-5 w-20 rounded-full" />
              <Skeleton class="h-4 w-28 hidden sm:block" />
              <Skeleton class="h-8 w-16 rounded-md" />
            </div>{/each}
        </div>
      </CardContent>
    </Card>
