<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
type ProvisioningJob = {
  status: string;
  currentStep: string;
  failureMessage: string | null;
};
let { organizationId, organizationName, contactEmail, job }:{ organizationId: string; organizationName: string; contactEmail: string | null; job: ProvisioningJob }=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let email=$state(untrack(()=>(contactEmail ?? "")));
const setEmail=(next:typeof email|((previous:typeof email)=>typeof email))=>{email=typeof next==="function"?(next as (previous:typeof email)=>typeof email)(email):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let error=$state(untrack(()=>("")));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
const actionable=$derived(job.status === "pending" || job.status === "failed" || job.status === "retrying");
async function process() {
    if(busy || !actionable)return;
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Enter the primary administrator email before processing this organization.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/platform/provisioning/${organizationId}/retry`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ primaryAdminEmail: email.trim().toLowerCase() }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.success !== true) throw new Error(body.error?.message ?? "Provisioning could not be completed.");
      setMessage(body.invitation?.delivery === "not_configured" ? "Provisioning completed. Email delivery is not configured; open the organization and copy the invitation link to share it manually." : "Provisioning completed and the primary admin invitation was prepared.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Provisioning could not be completed.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
</script>
<div class="space-y-2 text-xs"><a href={`/platform/organizations/${organizationId}`} class="font-semibold hover:text-primary">{organizationName}</a>{#if actionable}<div class="flex flex-wrap items-end gap-2"><label class="min-w-64 flex-1 font-medium text-muted">Primary admin email{#if !contactEmail}<span class="ml-1 text-warning">required</span>{/if}<Input type="email" value={email} oninput={(event) => setEmail(event.currentTarget.value)} disabled={busy} placeholder="admin@company.com" class="mt-1 h-9 text-sm" /></label><Button size="sm" onclick={() => void process()} disabled={busy}>{#if busy}{"Processing…"}{:else}{#if job.status === "failed" || job.status === "retrying"}{"Retry"}{:else}{"Process"}{/if}{/if}</Button></div>{/if}{#if job.status === "running"}<p class="text-muted">Provisioning is currently running.</p>{/if}{#if job.status === "completed"}<a href={`/platform/organizations/${organizationId}`} class="text-primary hover:underline">View organization</a>{/if}{#if job.failureMessage}<p class="text-danger">{job.failureMessage}</p>{/if}{#if error}<p role="alert" class="text-danger">{error}</p>{/if}{#if message}<p role="status" class="text-success">{message}</p>{/if}</div>
