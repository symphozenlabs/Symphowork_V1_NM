<script lang="ts">
 import AppShell from '$lib/components/layout/AppShell.svelte';
 let { data, children } = $props();
</script>
<AppShell context={data.context}>{@render children()}</AppShell>

