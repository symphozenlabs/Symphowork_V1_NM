<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";



function title(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
let {rows}:{rows:{label:string;value:number}[]}=$props();
const max=$derived(Math.max(...rows.map(row=>row.value),1));

</script>

<div class="space-y-3">{#if rows.length}{#each rows as row}<div><div class="flex justify-between text-sm"><span>{title(row.label)}</span><strong>{row.value}</strong></div><div class="mt-1 h-2 rounded-full bg-surface"><div class="h-2 rounded-full bg-primary" style:width={`${Math.max(4, (row.value / max) * 100)}%`}></div></div></div>{/each}{:else}<p class="text-sm text-muted">No data available.</p>{/if}</div>
