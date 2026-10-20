<script lang="ts">
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';

  const isNotFound = $derived(page.status === 404);

  async function handleRetry() {
    await invalidateAll();
  }
</script>

<svelte:head>
  <title>{isNotFound ? 'Page not found' : 'Something went wrong'} — SymphoWork</title>
</svelte:head>

<main class="mx-auto max-w-xl py-24 px-6 text-center">
  {#if isNotFound}
    <h1 class="text-2xl font-bold text-slate-900">Page not found</h1>
    <p class="mt-2 text-sm text-slate-500">The requested workspace page does not exist yet.</p>
    <div class="mt-6">
      <a
        href="/"
        class="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        Return to overview
      </a>
    </div>
  {:else}
    <h1 class="text-2xl font-bold text-slate-900">Something went wrong</h1>
    <p class="mt-2 text-sm text-slate-500">
      {page.error?.message || "We couldn’t load this workspace view. Try again."}
    </p>
    <div class="mt-6 flex items-center justify-center gap-3">
      <Button
        type="button"
        onclick={handleRetry}
      >
        Try again
      </Button>
      <a
        href="/"
        class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
      >
        Return to overview
      </a>
    </div>
  {/if}
</main>