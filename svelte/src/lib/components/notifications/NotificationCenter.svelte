<script lang="ts">
 import {onMount} from 'svelte';import {api,mutation} from '$lib/client/api';import Button from '../ui/Button.svelte';
 type Item={id:string;title:string;message:string;actionUrl?:string|null;readAt?:string|null;createdAt:string};
 let items=$state<Item[]>([]),unread=$state(0),loading=$state(true),error=$state(''),busy=$state(false);
 async function load(){loading=true;error='';try{const b=await api<{notifications:Item[];unreadCount:number}>('/api/app/notifications');items=b.notifications;unread=b.unreadCount;}catch(e){error=(e as Error).message;}finally{loading=false;}}
 onMount(()=>{void load();});
 async function mark(id?:string){if(busy)return;busy=true;try{await mutation(id?'/api/app/notifications/'+id:'/api/app/notifications',id?'POST':'PATCH',id?undefined:{markAllRead:true});await load();}catch(e){error=(e as Error).message;}finally{busy=false;}}
</script>
<div class="space-y-4"><div class="flex items-center justify-between"><p class="text-sm text-muted">{unread} unread</p><Button size="sm" variant="secondary" disabled={busy||unread===0} onclick={()=>mark()}>Mark all read</Button></div>
{#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
{#if loading}<p class="text-sm text-muted">Loading notifications…</p>{:else if items.length===0}<p class="rounded-xl border border-dashed p-6 text-sm text-muted">You are all caught up.</p>{:else}{#each items as item (item.id)}
<div class={'rounded-xl border p-4 '+(item.readAt?'opacity-70':'bg-surface')}><div class="flex items-start justify-between gap-4"><div><p class="font-medium">{item.title}</p><p class="mt-1 text-sm text-muted">{item.message}</p><p class="mt-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p></div>{#if !item.readAt}<Button size="sm" variant="ghost" disabled={busy} onclick={()=>mark(item.id)}>Mark read</Button>{/if}</div>{#if item.actionUrl&&item.actionUrl.startsWith('/')&&!item.actionUrl.startsWith('//')}<a class="mt-2 inline-block text-sm font-semibold text-primary" href={item.actionUrl}>Open</a>{/if}</div>
{/each}{/if}</div>

