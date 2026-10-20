<script lang="ts">
  import NavigationStatus from '../lib/NavigationStatus.svelte';
  import '../app.css';
  import Toasts from '$lib/components/ui/Toasts.svelte';

  let { children } = $props();
</script>

<NavigationStatus />
{@render children()}
<Toasts />
