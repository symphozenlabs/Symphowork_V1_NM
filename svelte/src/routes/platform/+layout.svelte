<script lang="ts">
 import PlatformShell from'$lib/components/platform/PlatformShell.svelte';let{data,children}=$props();
</script>
{#if data.context}<PlatformShell context={data.context}>{@render children()}</PlatformShell>{:else}{@render children()}{/if}

