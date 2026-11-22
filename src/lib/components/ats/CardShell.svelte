<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import type { Snippet } from 'svelte';
let { title, children }: { title: string; children: Snippet } = $props();
</script>
<section class="rounded-xl border p-5"><h2 class="mb-3 font-semibold">{title}</h2>{@render children?.()}</section>
