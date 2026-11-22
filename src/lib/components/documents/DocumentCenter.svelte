<script lang="ts">
import {validateDocumentFile} from '$lib/client/document-file';
import {onMount} from 'svelte';import {api,mutation} from '$lib/client/api';import {notify} from '$lib/client/toast';import Button from '../ui/Button.svelte';
type DocumentType={id:string;name:string};type DocumentRecord={id:string;fileName:string;status:string;lifecycleStatus:string;scanStatus:string;expiresAt?:string|null};
let types=$state<DocumentType[]>([]),documents=$state<DocumentRecord[]>([]),typeId=$state(''),file=$state<File|null>(null),loading=$state(true),busy=$state(false),message=$state(''),error=$state('');
async function load(){loading=true;error='';try{documents=(await api<{documents:DocumentRecord[]}>('/api/app/documents')).documents;}catch(e){error=(e as Error).message;}finally{loading=false;}}
onMount(()=>{void api<{types:DocumentType[]}>('/api/app/documents/types').then(b=>types=b.types).catch(e=>error=e.message);void load();});
async function upload(e:SubmitEvent){e.preventDefault();if(busy||!file||!typeId)return;busy=true;message='';error='';const form=new FormData();form.set('file',file);form.set('documentTypeId',typeId);
try{validateDocumentFile(file);await mutation('/api/app/documents','POST',form);message='Document uploaded and queued for admission.';notify(message,'success');file=null;await load();}catch(e){error=(e as Error).message;notify(error,'error');}finally{busy=false;}}
async function open(id:string){error='';try{const b=await api<{url?:string}>('/api/app/documents/'+id);if(!b.url)throw new Error('This document is not available for download yet.');const url=new URL(b.url,window.location.origin);if(!['https:','http:'].includes(url.protocol))throw new Error('Unsupported download address.');window.location.assign(url.href);}catch(e){error=(e as Error).message;notify(error,'error');}}
</script>
<div class="space-y-6"><form onsubmit={upload} class="grid gap-3 rounded-xl border p-5 md:grid-cols-[1fr_1fr_auto] bg-surface shadow-sm">
<select required aria-label="Document type" class="h-10 rounded-lg border bg-surface px-3" bind:value={typeId}><option value="">Document type</option>{#each types as type}<option value={type.id}>{type.name}</option>{/each}</select>
<input required aria-label="Document file" type="file" accept="application/pdf,image/jpeg,image/png" onchange={e=>file=e.currentTarget.files?.[0]??null}/>
<Button type="submit" disabled={busy}>{busy?'Uploading…':'Upload'}</Button></form>
{#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}{#if message}<p aria-live="polite" class="text-sm text-success">{message}</p>{/if}
<div class="space-y-3">{#if loading}<p class="text-sm text-muted">Loading documents…</p>{:else if !documents.length}<p class="text-sm text-muted">No documents uploaded yet.</p>{:else}{#each documents as document (document.id)}
<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 bg-surface shadow-sm"><div><p class="font-medium text-primary">{document.fileName}</p><p class="text-sm text-muted">{document.status} · {document.lifecycleStatus} · scan: {document.scanStatus}</p><p class="text-xs text-muted">{document.expiresAt?'Expires '+document.expiresAt:'No expiry'}</p></div><Button size="sm" variant="secondary" disabled={document.scanStatus!=='clean'} onclick={()=>open(document.id)}>{document.scanStatus==='clean'?'Open':'Unavailable until clean'}</Button></div>{/each}{/if}</div></div>

