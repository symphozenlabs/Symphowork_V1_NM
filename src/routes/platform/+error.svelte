<script lang="ts">
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardTitle from '$lib/components/ui/CardTitle.svelte';
  import CardDescription from '$lib/components/ui/CardDescription.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import SvgIcon from '$lib/components/ui/Icon.svelte';

  function handleReload() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  async function handleRetry() {
    await invalidateAll();
  }
</script>

<svelte:head>
  <title>Error {page.status} — Platform Console — SymphoWork</title>
</svelte:head>

<div class="flex min-h-[400px] items-center justify-center p-6">
  <div class="max-w-md w-full">
    <Card class="border-danger-border bg-surface shadow-md">
      <CardHeader class="text-center pb-2">
        <div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-danger-bg text-destructive">
          <SvgIcon name="AlertCircle" class="size-6" />
        </div>
        <CardTitle class="text-lg font-bold text-foreground">
          Failed to Load Platform View
        </CardTitle>
        <CardDescription class="text-xs text-muted">
          An error occurred while loading this platform management view.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4 pt-2 text-center">
        <p class="text-xs text-muted line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-border">
          {page.error?.message || "An unexpected system error occurred."}
        </p>
        <div class="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={handleReload}
          >
            Reload page
          </Button>
          <Button
            type="button"
            size="sm"
            onclick={handleRetry}
            class="gap-1.5"
          >
            <SvgIcon name="RefreshCw" class="size-3.5" />
            <span>Try again</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
