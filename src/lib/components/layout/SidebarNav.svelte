<script lang="ts">
 import{page}from'$app/state';import{isRouteActive}from'$lib/navigation';import Icon from'../ui/Icon.svelte';import{ICON_MAP,type NavGroupDef}from'./navigation';
 let{groups,chatUnreadCount=0}:{groups:NavGroupDef[];chatUnreadCount?:number}=$props();
 const hrefs=$derived(groups.flatMap(group=>group.items.map(item=>item.href)));
</script>
<nav class="space-y-6" aria-label="Primary navigation">{#each groups as group}{#if group.items.length}<div>{#if group.title}<h2 class="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{group.title}</h2>{/if}<div class="space-y-1">{#each group.items as item (item.href)}
{@const active=isRouteActive(page.url.pathname,item.href,hrefs)}
<a href={item.href} aria-current={active?'page':undefined} class={'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors '+(active?'bg-white text-primary shadow-xs border border-[#D9E5D7]':'text-slate-600 hover:bg-[#E2EDE1] hover:text-primary')}><Icon name={ICON_MAP[item.iconKey]??'LayoutDashboard'} class={'size-4 shrink-0 '+(active?'text-primary':'text-slate-500 group-hover:text-primary')}/><span class="truncate">{item.label}</span><span class="ml-auto flex items-center gap-2">{#if item.href==='/app/chat'&&chatUnreadCount>0}<span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">{chatUnreadCount>99?'99+':chatUnreadCount}</span>{/if}{#if active}<span class="h-3.5 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true"></span>{/if}</span></a>{/each}</div></div>{/if}{/each}</nav>

