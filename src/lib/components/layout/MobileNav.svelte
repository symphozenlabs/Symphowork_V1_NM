<script lang="ts">
 import{page}from'$app/state';import{onDestroy}from'svelte';import Modal from'../ui/Modal.svelte';import Icon from'../ui/Icon.svelte';import{isRouteActive}from'$lib/navigation';
 let{items,label='Open navigation'}:{items:{label:string;href:string}[];label?:string}=$props();let open=$state(false);
 $effect(()=>{page.url.pathname;open=false;});
 $effect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>document.body.style.overflow=previous;});
</script>
<button type="button" aria-label={label} aria-expanded={open} class="rounded-lg p-2 text-muted lg:hidden" onclick={()=>open=true}><Icon name="Menu"/></button>
<Modal bind:open title="Navigation drawer" class="mr-auto ml-0 h-dvh max-h-dvh w-72 max-w-[85vw] rounded-none bg-[#EFF4EE] border-r border-[#D9E5D7]">
 <a href={page.url.pathname.startsWith('/platform')?'/platform':'/app'}><img src="/symphowork-logo.png" alt="SymphoWork" width="150" height="40" class="mb-6 h-10 w-auto"/></a>
 <nav aria-label="Mobile navigation" class="space-y-1">{#each items as item (item.href)}<a href={item.href} onclick={()=>open=false} aria-current={isRouteActive(page.url.pathname,item.href,items.map(i=>i.href))?'page':undefined} class={'block rounded-lg px-3 py-3 text-sm font-semibold '+(isRouteActive(page.url.pathname,item.href,items.map(i=>i.href))?'bg-white text-primary shadow-xs':'text-slate-600 hover:bg-[#E2EDE1]')}>{item.label}</a>{/each}</nav>
</Modal>

