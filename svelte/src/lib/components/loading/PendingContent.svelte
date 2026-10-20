<script lang="ts">
import type {Component,Snippet} from 'svelte';
import BrandedLoader from '../ui/BrandedLoader.svelte';
import {loaders,loadingRoute} from './loader-map';
let {path,children}:{path:string|null;children:Snippet}=$props();
let View=$state<Component|null>(null);
$effect(()=>{
 const route=path?loadingRoute(path):undefined;View=null;if(!route)return;
 let current=true;
 void loaders[route]().then(module=>{if(current)View=module.default;}).catch(()=>{/* Keep local loading feedback; SvelteKit owns navigation failures. */});
 return()=>{current=false;};
});
</script>
<div aria-busy={Boolean(path)}>
 {#if path}<div aria-label="Loading page content">{#if View}<View/>{:else}<BrandedLoader inline message="Loading page..."/>{/if}</div>{/if}
 <div hidden={Boolean(path)} inert={Boolean(path)}>{@render children()}</div>
</div>
