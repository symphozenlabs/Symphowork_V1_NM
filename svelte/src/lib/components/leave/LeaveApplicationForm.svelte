<script lang="ts">
 import {onMount} from 'svelte';import {api,mutation} from '$lib/client/api';import {notify} from '$lib/client/toast';import Input from '../ui/Input.svelte';import Button from '../ui/Button.svelte';
 type LeaveType={id:string;name:string;halfDayAllowed:boolean};
 type Application={id:string;startDate:string;endDate:string;requestedDays:number;reason:string;status:string;typeName?:string|null};
 type Balance={id:string;openingBalance:number;accrued:number;consumed:number;pending:number;adjusted:number;leaveYear:number;typeName?:string|null};
 let types=$state<LeaveType[]>([]),applications=$state<Application[]>([]),balances=$state<Balance[]>([]);
 let form=$state({leaveTypeId:'',startDate:'',endDate:'',reason:'',halfDay:false});
 let loading=$state(true),submitting=$state(false),message=$state(''),error=$state('');
 async function load(){loading=true;error='';try{
 // Preserve one side-effecting /leave read per explicit load. No hover preload or retry.
 const [t,b]=await Promise.all([api<{leaveTypes:LeaveType[]}>('/api/app/leave/types'),api<{applications:{application:Application;typeName?:string}[];balances:{balance:Balance;typeName?:string}[]}>('/api/app/leave')]);
 types=t.leaveTypes;applications=b.applications.map(r=>({...r.application,typeName:r.typeName}));balances=b.balances.map(r=>({...r.balance,typeName:r.typeName}));
 }catch(e){error=(e as Error).message;}finally{loading=false;}}
 onMount(()=>{void load();});
 async function submit(e:SubmitEvent){e.preventDefault();if(submitting)return;message='';error='';if(!form.reason.trim()){error='A leave reason is required.';return;}if(form.endDate<form.startDate){error='End date must be on or after the start date.';notify(error,'error');return;}submitting=true;
 try{await mutation('/api/app/leave','POST',{...form,reason:form.reason.trim()});message='Leave request submitted for approval.';notify(message,'success');form={leaveTypeId:'',startDate:'',endDate:'',reason:'',halfDay:false};await load();}catch(e){error=(e as Error).message;notify(error,'error');}finally{submitting=false;}}
</script>
<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"><form onsubmit={submit} class="grid gap-4 rounded-xl border p-5 bg-surface shadow-sm">
<div><h2 class="font-semibold text-primary">Request leave</h2><p class="mt-1 text-sm text-muted">Your request will follow the organization approval workflow.</p></div>
<label class="grid gap-1 text-sm">Leave type<select required class="h-10 rounded-lg border bg-surface px-3" bind:value={form.leaveTypeId} onchange={()=>form.halfDay=false}><option value="">Select a type</option>{#each types as type}<option value={type.id}>{type.name}</option>{/each}</select></label>
<div class="grid gap-4 sm:grid-cols-2"><label class="grid gap-1 text-sm">Start date<Input required type="date" bind:value={form.startDate}/></label><label class="grid gap-1 text-sm">End date<Input required type="date" bind:value={form.endDate}/></label></div>
{#if types.find(t=>t.id===form.leaveTypeId)?.halfDayAllowed}<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={form.halfDay}/>Half-day request</label>{/if}
<label class="grid gap-1 text-sm">Reason<textarea required class="min-h-24 rounded-lg border bg-surface p-3" bind:value={form.reason}></textarea></label>
{#if error}<p role="alert" class="text-sm text-danger">{error}</p>{/if}{#if message}<p aria-live="polite" class="text-sm text-success">{message}</p>{/if}
<Button type="submit" disabled={submitting}>{submitting?'Submitting…':'Submit request'}</Button></form>
<div class="space-y-6"><section><h2 class="font-semibold text-primary">Available balances</h2>
{#if loading}<p class="mt-2 text-sm text-muted">Loading balances…</p>{:else if !balances.length}<p class="mt-2 text-sm text-muted">No leave balances have been configured yet.</p>{:else}<div class="mt-3 space-y-2">{#each balances as row}<div class="rounded-xl border p-3 text-sm bg-surface shadow-sm"><div class="flex justify-between"><span class="font-medium">{row.typeName??'Leave'}</span><span>{row.leaveYear}</span></div><p class="mt-1 text-muted">Available: {(Number(row.openingBalance)+Number(row.accrued)+Number(row.adjusted)-Number(row.consumed)-Number(row.pending)).toFixed(1)} days · Pending: {Number(row.pending).toFixed(1)}</p></div>{/each}</div>{/if}</section>
<section><h2 class="font-semibold text-primary">Request history</h2>{#if loading}<p class="mt-2 text-sm text-muted">Loading history…</p>{:else if !applications.length}<p class="mt-2 text-sm text-muted">No leave requests yet.</p>{:else}<div class="mt-3 space-y-2">{#each applications as application}<div class="rounded-xl border p-3 text-sm bg-surface shadow-sm"><div class="flex justify-between gap-3"><span class="font-medium">{application.typeName??'Leave'}</span><span class="capitalize text-muted">{application.status.replaceAll('_',' ')}</span></div><p class="mt-1 text-muted">{application.startDate} → {application.endDate} · {application.requestedDays} day(s)</p><p class="mt-1 text-muted">{application.reason}</p></div>{/each}</div>{/if}</section></div></div>

