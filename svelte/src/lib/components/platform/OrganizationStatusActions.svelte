<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let {
  organizationId,
  status: initialStatus,
}:{
  organizationId: string;
  status: string;
}=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let currentStatus=$state(untrack(()=>(initialStatus)));
const setCurrentStatus=(next:typeof currentStatus|((previous:typeof currentStatus)=>typeof currentStatus))=>{currentStatus=typeof next==="function"?(next as (previous:typeof currentStatus)=>typeof currentStatus)(currentStatus):next;};
const isPending=$derived(navigating.to!==null);const startTransition=(action:()=>unknown)=>{action();};
let isSubmitting=$state(untrack(()=>(false)));
const setIsSubmitting=(next:typeof isSubmitting|((previous:typeof isSubmitting)=>typeof isSubmitting))=>{isSubmitting=typeof next==="function"?(next as (previous:typeof isSubmitting)=>typeof isSubmitting)(isSubmitting):next;};
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let confirmingStatus=$state<string | null>(untrack(()=>(null)));
const setConfirmingStatus=(next:typeof confirmingStatus|((previous:typeof confirmingStatus)=>typeof confirmingStatus))=>{confirmingStatus=typeof next==="function"?(next as (previous:typeof confirmingStatus)=>typeof confirmingStatus)(confirmingStatus):next;};
const busy=$derived(isSubmitting || isPending);
$effect(()=>{initialStatus;return untrack(() => {
    setCurrentStatus(initialStatus);
  });});
async function executeUpdate(nextStatus: string) {
    if(busy)return;
    setIsSubmitting(true);
    setMessage("");

    try {
      const isApproval = currentStatus === "pending" && nextStatus === "active";
      const response = await fetch(
        `/api/platform/organizations/${organizationId}/${isApproval ? "approve" : "status"}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(isApproval ? {} : { status: nextStatus }),
        }
      );
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success === true) {
        setCurrentStatus(nextStatus);
        const delivery = body.provisioning?.invitation?.delivery;
        setMessage(
          isApproval && delivery === "not_configured"
            ? "Approved; invitation created, but email delivery is not configured."
            : isApproval && delivery === "sent"
            ? "Approved; invitation email sent."
            : `Organization ${nextStatus}.`
        );
        startTransition(() => {
          router.refresh();
        });
      } else {
        setMessage(body.error?.message ?? "Unable to update status.");
      }
    } catch {
      setMessage("Unable to update status.");
    } finally {
      setIsSubmitting(false);
    }
  }
function handleActionClick(nextStatus: string) {
    if (nextStatus === "suspended" || nextStatus === "rejected") {
      setConfirmingStatus(nextStatus);
    } else {
      void executeUpdate(nextStatus);
    }
  }
</script>
<div class="flex flex-wrap items-center gap-2">
      {#if currentStatus === "pending"}<Button size="sm" disabled={busy} onclick={() => handleActionClick("active")}>
          {#if busy}{"Approving…"}{:else}{"Approve and invite owner"}{/if}
        </Button>{/if}
      {#if currentStatus === "active"}<Button size="sm" variant="secondary" disabled={busy} onclick={() => handleActionClick("suspended")}>
          {#if busy}{"Updating…"}{:else}{"Suspend"}{/if}
        </Button>{/if}
      {#if currentStatus === "suspended"}<Button size="sm" disabled={busy} onclick={() => handleActionClick("active")}>
          {#if busy}{"Updating…"}{:else}{"Reactivate"}{/if}
        </Button>{/if}
      {#if currentStatus === "pending"}<Button size="sm" variant="ghost" disabled={busy} onclick={() => handleActionClick("rejected")}>
          Reject
        </Button>{/if}
      {#if message}<span class="text-xs text-muted">{message}</span>{/if}

      
      <ConfirmDialog open={Boolean(confirmingStatus)} onOpenChange={(open) => {
          if (!open) setConfirmingStatus(null);
        }} title={`Confirm Organization ${confirmingStatus === "suspended" ? "Suspension" : "Rejection"}`} description={`Are you sure you want to change this organization's status to ${confirmingStatus}? Tenant members will lose active platform access.`} confirmText={confirmingStatus === "suspended" ? "Suspend Organization" : "Reject Organization"} cancelText="Cancel" variant="destructive" isLoading={isSubmitting} onConfirm={async () => {
          if (!confirmingStatus) return;
          const statusToApply = confirmingStatus;
          setConfirmingStatus(null);
          await executeUpdate(statusToApply);
        }} />
    </div>
