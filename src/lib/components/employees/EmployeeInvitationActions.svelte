<script lang="ts">
let invitationDialog=$state<HTMLDialogElement>();
$effect(()=>{if(modalOpen&&invitationDialog&&!invitationDialog.open)invitationDialog.showModal();});
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let {
  employeeId,
  email,
  status,
}:{
  employeeId: string;
  email?: string | null;
  status: string;
}=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let message=$state<string|undefined>(untrack(()=>(undefined)));
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
$effect(()=>{modalOpen;return untrack(() => {
    if (!modalOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });});
$effect(()=>{modalOpen;return untrack(() => {
    if (modalOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  });});
async function copyFromModal() {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopyStatus("copied");
    } catch {
      if (inputRef.current) {
        inputRef.current.select();
        try {
          const ok = document.execCommand("copy");
          if (ok) {
            setCopyStatus("copied");
            return;
          }
        } catch {
          // ignore execCommand failure
        }
      }
      setCopyStatus("error");
    }
  }
async function invite(resend = false) {
    if (busy) return;
    setBusy(true);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/app/employees/${employeeId}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, resend }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || body.success !== true) {
        setMessage(body.error?.message ?? "Unable to send invitation.");
        return;
      }

      if (body.invitation?.delivery !== "sent" && typeof body.invitationUrl === "string") {
        setInvitationUrl(body.invitationUrl);
        setModalOpen(true);
        try {
          await navigator.clipboard.writeText(body.invitationUrl);
          setCopyStatus("copied");
        } catch {
          setCopyStatus("error");
        }
        setMessage(
          "Invitation created, but email delivery is not configured—copy the invitation link to share it manually."
        );
      } else {
        setMessage(
          body.invitation?.delivery === "not_configured"
            ? "Invitation created, but email delivery is not configured."
            : body.invitation?.delivery === "sent" ? "Invitation email sent." : "Invitation created, but email delivery was not confirmed."
        );
      }

      router.refresh();
    } catch {
      setMessage("Network error occurred while sending invitation.");
    } finally {
      setBusy(false);
    }
  }
async function revoke() {
    if (busy) return;
    setBusy(true);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/app/employees/${employeeId}/invite/revoke`, {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || body.success !== true) {
        setMessage(body.error?.message ?? "Unable to revoke invitation.");
      } else {
        setMessage("Invitation revoked.");
        router.refresh();
      }
    } catch {
      setMessage("Network error occurred while revoking invitation.");
    } finally {
      setBusy(false);
    }
  }
</script>

      <div class="space-y-2">
        {#if status === "active"}<span class="text-sm text-muted">Account active</span>{:else}<div class="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={busy || !email} onclick={() => void invite(status === "invited")}>
              {#if busy}{"Sending…"}{:else}{#if status === "invited"}{"Resend invitation"}{:else}{"Invite employee"}{/if}{/if}
            </Button>
            {#if status === "invited"}<Button size="sm" variant="secondary" disabled={busy} onclick={() => void revoke()} class="text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs">
                Revoke
              </Button>{/if}
          </div>{/if}
        {#if !email}<p class="text-xs text-muted">Add an employee email before inviting.</p>{/if}
        {#if message}<p role="status" class="text-xs text-muted">
            {message}
          </p>{/if}
      </div>

      {#if modalOpen}<dialog bind:this={invitationDialog} oncancel={()=>setModalOpen(false)} onclose={()=>setModalOpen(false)} aria-modal="true" aria-labelledby="employee-invitation-dialog-title" class="fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs" onclick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}>
          <div class="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 id="employee-invitation-dialog-title" class="text-lg font-bold text-foreground">
                  Employee invitation link
                </h2>
                <p class="mt-1 text-xs text-muted">
                  Share this secure invitation link with the employee to complete onboarding.
                </p>
              </div>
              <button type="button" onclick={() => setModalOpen(false)} aria-label="Close modal" class="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-foreground text-sm">
                ✕
              </button>
            </div>

            <div class="space-y-2">
              <label for="employee-invitation-url-input" class="block text-xs font-semibold uppercase tracking-wider text-muted">
                Invitation URL
              </label>
              <input id="employee-invitation-url-input" bind:this={inputRef.current} type="text" readonly value={invitationUrl} onfocus={(e) => e.currentTarget.select()} onclick={(e) => (e.target as HTMLInputElement).select()} class="h-10 w-full rounded-lg border border-border bg-slate-50 px-3 font-mono text-xs shadow-sm cursor-pointer select-all focus:border-primary focus:outline-none" />
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
        </dialog>{/if}
    
