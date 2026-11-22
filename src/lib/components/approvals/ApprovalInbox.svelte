<script lang="ts">
import {onMount} from 'svelte';import {api,mutation} from '$lib/client/api';import {notify} from '$lib/client/toast';import Button from '../ui/Button.svelte';import Modal from '../ui/Modal.svelte';
type Task={id:string;status:string;entityType:string;stepName:string;dueAt?:string|null};
let tasks=$state<Task[]>([]),details=$state<Record<string,string>>({}),loading=$state(true),message=$state(''),error=$state(''),busy=$state<string|null>(null),rejecting=$state<Task|null>(null),rejectOpen=$state(false),reason=$state('');
async function load(){loading=true;error='';try{tasks=(await api<{tasks:Task[]}>('/api/app/approvals')).tasks;}catch(e){error=(e as Error).message;}finally{loading=false;}}
onMount(()=>{void load();});
async function showDetails(id:string){try{const b=await api<{detail:unknown}>('/api/app/approvals/'+id);details[id]=JSON.stringify(b.detail,null,2);}catch(e){error=(e as Error).message;notify(error,'error');}}
async function act(task:Task,action:'approve'|'reject',comment?:string){if(busy||action==='reject'&&!comment?.trim())return;busy=task.id;error='';
try{await mutation('/api/app/approvals/'+task.id,'POST',{action,comment:comment?.trim()});message='Approval '+(action==='approve'?'approved':'rejected')+' successfully.';notify(message,'success');await load();return true;}catch(e){error=(e as Error).message;notify(error,'error');return false;}finally{busy=null;}}
</script>
<div class="space-y-3">{#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}
{#if loading}<p class="text-sm text-muted">Loading approval tasks…</p>{:else if !tasks.length}<p class="rounded-xl border border-dashed p-6 text-sm text-muted">No approval tasks assigned to you.</p>{:else}{#each tasks as task (task.id)}
<div class="rounded-xl border p-4 bg-surface shadow-sm"><div class="flex flex-wrap items-center justify-between gap-3"><div><p class="font-medium capitalize text-primary">{task.entityType.replaceAll('_',' ')}</p><p class="text-sm text-muted">{task.stepName} · <span class="capitalize">{task.status.replaceAll('_',' ')}</span>{task.dueAt?' · due '+task.dueAt:''}</p></div>
{#if task.status==='pending'}<div class="flex gap-2"><Button size="sm" variant="secondary" onclick={()=>showDetails(task.id)}>Details</Button><Button size="sm" disabled={busy!==null} onclick={()=>act(task,'approve')}>{busy===task.id?'Approving…':'Approve'}</Button><Button size="sm" variant="secondary" disabled={busy!==null} onclick={()=>{rejecting=task;reason='';rejectOpen=true;}}>{busy===task.id?'Rejecting…':'Reject'}</Button></div>{/if}</div>
{#if details[task.id]}<pre class="mt-3 max-h-48 overflow-auto rounded-lg bg-[#F7F8FB] border p-3 text-xs text-muted">{details[task.id]}</pre>{/if}</div>
{/each}{/if}{#if message}<p role="status" class="text-sm text-success">{message}</p>{/if}</div>
<Modal bind:open={rejectOpen} title="Reject Approval Request"><p class="mb-4 text-sm text-muted">Provide a reason for rejecting this {rejecting?.entityType.replaceAll('_',' ')??'task'}. This comment will be logged in the audit trail.</p><form onsubmit={async e=>{e.preventDefault();if(rejecting && await act(rejecting,'reject',reason)){rejectOpen=false;reason='';rejecting=null;}}} class="grid gap-4"><label class="grid gap-2 text-sm">Reason for rejection<textarea required bind:value={reason} class="min-h-24 rounded-lg border p-3" placeholder="Enter required rejection justification..."></textarea></label><Button variant="destructive" type="submit" disabled={busy!==null||!reason.trim()}>Confirm Rejection</Button></form></Modal>

