<script lang="ts">
 import icons from './icon-nodes.json';
 import type { SVGAttributes } from 'svelte/elements';
 let { name, class: className = 'size-4', label, ...rest }: SVGAttributes<SVGSVGElement> & { name: string; label?: string } = $props();
 const nodes = $derived((icons as unknown as Record<string, [string, Record<string,string>][] >)[name] ?? []);
</script>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={className} aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} {...rest}>
 {#if label}<title>{label}</title>{/if}
 {#each nodes as [tag, attributes]}<svelte:element this={tag} {...Object.fromEntries(Object.entries(attributes).filter(([key]) => key !== 'key'))} />{/each}
</svg>

