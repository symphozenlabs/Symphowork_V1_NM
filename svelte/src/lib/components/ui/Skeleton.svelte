<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


import type {HTMLAttributes} from 'svelte/elements';let {class:className='',...props}:HTMLAttributes<HTMLDivElement>=$props();
</script>
<div class={["animate-pulse motion-reduce:animate-none rounded-lg bg-slate-200/70", className]} aria-hidden="true" {...props}></div>
