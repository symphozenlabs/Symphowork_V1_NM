<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";


type Claim = { id: string; claimNumber: string; title: string; totalAmount: number; status: string; reimbursementStatus: string; description?: string | null };
type Item = { id: string; description: string; amount: number; expenseDate: string };
type Receipt = { id: string; itemId: string; fileName: string; scanStatus: string; verificationStatus: string };
type History = { id: string; action: string; comment?: string | null; createdAt: string };

import {validateDocumentFile} from '$lib/client/document-file';
import {can} from '$lib/auth/policy';
import {page} from '$app/state';
import {untrack} from 'svelte';import {api,mutation} from '$lib/client/api';import {notify} from '$lib/client/toast';
let {claimId}:{claimId:string}=$props();
let claim=$state<Claim|null>(null),items=$state<Item[]>([]),receipts=$state<Receipt[]>([]),history=$state<History[]>([]);
let message=$state('Loading claim…'),busy=$state(false),showCancelConfirm=$state(false),failure=$state(false);
let files=$state<Record<string,File|null>>({});
const canSubmit=$derived(can(page.data.context??null,'expense.submit'));
const canCancel=$derived(can(page.data.context??null,'expense.cancel'));
const setShowCancelConfirm=(value:boolean)=>showCancelConfirm=value;
async function load(){const requestedClaimId=claimId;try{const b=await api<{claim:Claim;items:Item[];receipts:Receipt[];history:History[]}>('/api/app/expenses/'+encodeURIComponent(requestedClaimId));if(requestedClaimId!==claimId)return;claim=b.claim;items=b.items;receipts=b.receipts;history=b.history;message='';failure=false;}catch(e){if(requestedClaimId!==claimId)return;message=(e as Error).message;failure=true;}}
$effect(()=>{claimId;untrack(()=>{claim=null;items=[];receipts=[];history=[];message='Loading claim…';files={};void load();});});
async function cancel(){if(busy||!canCancel)return;busy=true;try{await mutation('/api/app/expenses/'+claimId,'PATCH',{action:'cancel'});notify('Claim cancelled.','success');await load();}catch(e){message=(e as Error).message;failure=true;notify(message,'error');}finally{busy=false;}}

async function uploadReceipt(itemId:string){
 const file=files[itemId];if(busy||!file||claim?.status!=='draft')return;
 busy=true;failure=false;message='';
 try{validateDocumentFile(file);const form=new FormData();form.set('file',file);
 await mutation('/api/app/expenses/items/'+encodeURIComponent(itemId)+'/receipt','POST',form);
 files[itemId]=null;notify('Receipt uploaded.','success');await load();
 }catch(e){message=(e as Error).message;failure=true;notify(message,'error');}finally{busy=false;}
}
async function submitDraft(){
 if(busy||!canSubmit||claim?.status!=='draft')return;
 busy=true;failure=false;message='';
 try{await mutation('/api/app/expenses/'+encodeURIComponent(claimId)+'/submit','POST');notify('Claim submitted for approval.','success');await load();}
 catch(e){message=(e as Error).message;failure=true;notify(message,'error');}finally{busy=false;}
}
</script>
{#if message}<p role={failure?"alert":"status"} class={failure?"text-sm text-danger":"text-sm text-muted"}>{message}</p>{/if}{#if claim}
<div class="space-y-5"><div class="grid gap-3 sm:grid-cols-4"><div><p class="text-xs uppercase text-muted">Claim</p><p class="font-semibold">{claim.claimNumber}</p></div><div><p class="text-xs uppercase text-muted">Status</p><p class="font-semibold capitalize">{claim.status.replaceAll("_", " ")}</p></div><div><p class="text-xs uppercase text-muted">Reimbursement</p><p class="font-semibold">{claim.reimbursementStatus}</p></div><div><p class="text-xs uppercase text-muted">Total</p><p class="font-semibold">₹{claim.totalAmount}</p></div></div><p class="text-sm text-muted">{claim.title} {#if claim.description}{`· ${claim.description}`}{:else}{""}{/if}</p>{#if canSubmit && claim.status === "draft"}<Button size="sm" disabled={busy} onclick={submitDraft}>{busy?"Working…":"Submit draft for approval"}</Button>{/if}{#if canCancel && ["draft", "submitted"].includes(claim.status)}<Button size="sm" variant="secondary" disabled={busy} onclick={() => setShowCancelConfirm(true)}>Cancel claim</Button>{/if}<section><h2 class="font-semibold">Items and receipts</h2><div class="mt-2 space-y-2">{#each items as item}<div class="rounded-lg border p-3 text-sm"><div class="flex justify-between"><span>{item.expenseDate} · {item.description}</span><span>₹{item.amount}</span></div>{#each receipts.filter((receipt) => receipt.itemId === item.id) as receipt}<p class="mt-2 text-xs text-muted">Receipt: {receipt.fileName} · scan: {receipt.scanStatus} · {receipt.verificationStatus}</p>{/each}{#if claim.status === "draft"}<form class="mt-3 flex flex-wrap items-center gap-2" onsubmit={(event)=>{event.preventDefault();void uploadReceipt(item.id);}}><label class="text-xs">Attach receipt<input class="block mt-1" aria-label={`Receipt for ${item.description}`} type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onchange={(event)=>files[item.id]=event.currentTarget.files?.[0]??null}/></label><Button type="submit" size="sm" variant="secondary" disabled={busy || !files[item.id]}>Upload receipt</Button></form>{/if}</div>{/each}</div></section><section><h2 class="font-semibold">Claim history</h2><div class="mt-2 space-y-2">{#each history as entry}<div class="rounded-lg border p-3 text-sm"><span class="capitalize">{entry.action.replaceAll("_", " ")}</span><span class="ml-2 text-muted">{new Date(entry.createdAt).toLocaleString()}</span>{#if entry.comment}<p class="mt-1 text-muted">{entry.comment}</p>{/if}</div>{/each}</div></section><ConfirmDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm} title="Cancel Expense Claim" description={`Are you sure you want to cancel expense claim ${claim.claimNumber}? This action cannot be undone.`} confirmText="Cancel Claim" cancelText="Keep Claim" variant="destructive" isLoading={busy} onConfirm={async () => { setShowCancelConfirm(false); await cancel(); }} /></div>
{/if}