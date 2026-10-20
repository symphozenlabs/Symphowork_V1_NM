<script lang="ts">
 import type { Snippet } from 'svelte';
 let { class: className = '', children }: { class?: string; children?: Snippet } = $props();
</script>
<div class={'rounded-2xl border border-border bg-surface text-foreground shadow-[0_4px_24px_rgba(11,25,48,0.03)] transition-all '+className}>{@render children?.()}</div>

