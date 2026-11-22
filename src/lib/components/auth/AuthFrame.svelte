<script lang="ts">
import type {Snippet} from 'svelte';import ReferenceAuthCard from './ReferenceAuthCard.svelte';
let{title,description,platform=false,children}:{title:string;description:string;platform?:boolean;children:Snippet}=$props();
</script>
<svelte:head><title>{title} | SymphoWork</title></svelte:head>
<ReferenceAuthCard {title} {description} {platform}>{@render children()}</ReferenceAuthCard>
