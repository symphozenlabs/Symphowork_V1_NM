<script lang="ts">
 import Input from '../ui/Input.svelte';import Button from '../ui/Button.svelte';import{mutation}from '$lib/client/api';import{notify}from '$lib/client/toast';import{untrack}from 'svelte';
 let{initial}:{initial:{firstName:string;lastName:string;middleName?:string|null;personalEmail:string|null;phone:string|null}}=$props();
 let form=$state(untrack(()=>({firstName:initial.firstName,middleName:initial.middleName??'',lastName:initial.lastName,personalEmail:initial.personalEmail??'',phone:initial.phone??''})));
 let message=$state(''),saving=$state(false),failure=$state(false);
 const fields=[['firstName','First name'],['middleName','Middle name'],['lastName','Last name'],['personalEmail','Personal email'],['phone','Phone']]as const;
 async function submit(e:SubmitEvent){e.preventDefault();if(saving)return;
 if(!form.firstName.trim() || !form.lastName.trim()){message='First name and last name are required.';failure=true;return;}
 saving=true;message='';failure=false;try{await mutation('/api/app/me/employee','PATCH',form);message='Profile updated.';notify('Your employee details were saved.','success');}catch(e){message=(e as Error).message;failure=true;notify(message,'error');}finally{saving=false;}}
</script>
<form onsubmit={submit} class="space-y-4">{#each fields as [key,label]}<label class="block text-sm font-semibold">{label}<Input bind:value={form[key]} type={key==='personalEmail'?'email':'text'} required={key==='firstName'||key==='lastName'} maxlength={key==='phone'?40:key==='personalEmail'?undefined:80} disabled={saving} class="mt-2"/></label>{/each}{#if message}<p role={failure?'alert':'status'} class="text-sm text-muted">{message}</p>{/if}<Button type="submit" disabled={saving}>{saving?'Saving…':'Save permitted details'}</Button></form>

