<script lang="ts">
  import { navigating } from '$app/state';

  const isNavigating = $derived(navigating.to !== null);
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 z-50" aria-live="polite" aria-atomic="true">
  <div
    class="h-0.5 origin-left bg-emerald-800 transition-transform duration-200"
    class:scale-x-0={!isNavigating}
    class:scale-x-100={isNavigating}
    aria-hidden="true"
  ></div>
  <span class="sr-only">{isNavigating ? 'Loading page' : ''}</span>
</div>