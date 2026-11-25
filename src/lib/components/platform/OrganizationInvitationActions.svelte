<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let {
  organizationId,
  invitation,
}:{
  organizationId: string;
  invitation?: { id: string; status: string; expiresAt: string } | null;
}=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let message=$state<string | undefined>(untrack(()=>(undefined)));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
let modalOpen=$state(untrack(()=>(false)));
const setModalOpen=(next:typeof modalOpen|((previous:typeof modalOpen)=>typeof modalOpen))=>{modalOpen=typeof next==="function"?(next as (previous:typeof modalOpen)=>typeof modalOpen)(modalOpen):next;};
let invitationUrl=$state<string>(untrack(()=>("")));
const setInvitationUrl=(next:typeof invitationUrl|((previous:typeof invitationUrl)=>typeof invitationUrl))=>{invitationUrl=typeof next==="function"?(next as (previous:typeof invitationUrl)=>typeof invitationUrl)(invitationUrl):next;};
let copyStatus=$state<"idle" | "copied" | "error">(untrack(()=>("idle")));
const setCopyStatus=(next:typeof copyStatus|((previous:typeof copyStatus)=>typeof copyStatus))=>{copyStatus=typeof next==="function"?(next as (previous:typeof copyStatus)=>typeof copyStatus)(copyStatus):next;};
let inputRef=$state({current:null as HTMLInputElement|null});
const expired=$derived(invitation?.status === "pending" &&
    new Date(invitation.expiresAt).getTime() <= Date.now());

$effect(()=>{modalOpen;return untrack(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  });});
async function copyLink() {
    if (busy) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const response = await fetch(
        `/api/platform/organizations/${organizationId}/invitation/link`,
        { method: "POST" }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.success !== true || typeof body.invitationUrl !== "string") {
        const errorMessage = body.error?.message ?? "Unable to create an invitation link.";
        setMessage(errorMessage);
        notify(errorMessage, "error");
        return;
      }

      setInvitationUrl(body.invitationUrl);
      setCopyStatus("idle");
      setModalOpen(true);
      notify("Owner invitation link is ready to copy.", "success");
    } catch {
      const errorMessage = "Network error occurred while creating an invitation link.";
      setMessage(errorMessage);
      notify(errorMessage, "error");
    } finally {
      setBusy(false);
    }
  }
async function writeInvitationToClipboard() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationUrl);
        return true;
      }
    } catch {
      // Clipboard access may be unavailable outside a secure context or user gesture.
    }

    const input = inputRef.current;
    if (!input) return false;
    input.focus();
    input.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    }
  }
async function copyFromModal() {
    if (!invitationUrl) return;
    if (await writeInvitationToClipboard()) {
      setCopyStatus("copied");
      notify("Invitation link copied to clipboard.", "success");
      return;
    }
    setCopyStatus("error");
    notify("Could not copy automatically. Select the invitation URL and copy it manually.", "error");
  }
async function resend() {
    if (busy) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const response = await fetch(
        `/api/platform/organizations/${organizationId}/invitation/resend`,
        { method: "POST" }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.success !== true || !body.invitation) {
        const errorMessage = body.error?.message ?? "Unable to resend invitation.";
        setMessage(errorMessage);
        notify(errorMessage, "error");
        return;
      }

      const delivery = body.invitation.delivery;
      if (delivery === "sent") {
        setMessage("Invitation email sent.");
        notify("Invitation email sent.", "success");
      } else {
        const errorMessage = delivery === "failed"
          ? "Invitation renewed, but email delivery failed. Copy the link to share it manually."
          : "Invitation renewed. Email delivery is not configured—copy the link to share it manually.";
        setMessage(errorMessage);
        notify(errorMessage, delivery === "failed" ? "error" : "info");
        if (typeof body.invitationUrl === "string") {
          setInvitationUrl(body.invitationUrl);
          setCopyStatus("idle");
          setModalOpen(true);
        }
      }

      router.refresh();
    } catch {
      const errorMessage = "Network error occurred while resending the invitation.";
      setMessage(errorMessage);
      notify(errorMessage, "error");
    } finally {
      setBusy(false);
    }
  }
</script>
{#if !invitation || invitation.status !== "pending"}<p class="text-sm text-muted">
        {#if invitation?.status === "accepted"}{"Organization owner invitation accepted."}{:else}{"No pending organization owner invitation. Process or retry provisioning first."}{/if}
      </p>{:else}
      <div class="space-y-3">
        <p class="text-sm text-muted">
          {#if expired}{"Invitation expired — resend to generate a new link."}{:else}{"Email delivery is not configured. Copy this secure invitation link and send it to the organization owner manually."}{/if}
        </p>

        <div class="flex flex-wrap gap-2">
          {#if !expired}<Button size="sm" disabled={busy} onclick={() => void copyLink()}>
              {#if busy}{"Preparing…"}{:else}{"Copy invitation link"}{/if}
            </Button>{/if}
          <Button variant="secondary" size="sm" disabled={busy} onclick={() => void resend()}>
            {#if busy}{"Sending…"}{:else}{"Resend invitation"}{/if}
          </Button>
        </div>

        {#if message}<p role="status" class="text-xs text-muted">
            {message}
          </p>{/if}
      </div>

      {#if modalOpen}<div role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="invitation-dialog-title" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs" onkeydown={(e) => { if (e.key === "Escape") setModalOpen(false); }} onclick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}>
          <div class="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 id="invitation-dialog-title" class="text-lg font-bold text-foreground">
                  Owner invitation link
                </h2>
                <p class="mt-1 text-xs text-muted">
                  Share this secure invitation link with the organization owner to complete workspace onboarding.
                </p>
              </div>
              <button type="button" onclick={() => setModalOpen(false)} aria-label="Close modal" class="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground text-sm">
                ✕
              </button>
            </div>

            <div class="space-y-2">
              <label for="admin-invitation-url-input" class="block text-xs font-semibold uppercase tracking-wider text-muted">
                Invitation URL
              </label>
              <input id="admin-invitation-url-input" bind:this={inputRef.current} type="text" readOnly value={invitationUrl} onfocus={(e) => e.currentTarget.select()} onclick={(e) => (e.target as HTMLInputElement).select()} class="h-10 w-full rounded-lg border border-border bg-slate-50 px-3 font-mono text-xs shadow-sm cursor-pointer select-all focus:border-primary focus:outline-none" />
            </div>

            {#if copyStatus === "copied"}<p role="status" class="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <span>✓</span> Copied to clipboard!
              </p>{/if}

            {#if copyStatus === "error"}<p role="alert" class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                Automatic clipboard copy could not be completed. Click &quot;Copy link&quot; below or select and copy the URL manually.
              </p>{/if}

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="secondary" size="sm" onclick={() => setModalOpen(false)}>
                Close
              </Button>
              <Button type="button" size="sm" onclick={() => void copyFromModal()}>
                {#if copyStatus === "copied"}{"Copied"}{:else}{"Copy link"}{/if}
              </Button>
            </div>
          </div>
        </div>{/if}
    {/if}
