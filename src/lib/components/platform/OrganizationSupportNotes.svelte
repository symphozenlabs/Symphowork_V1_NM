<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
type Note = {
  id: string;
  note: string;
  createdAt: string;
  createdByUserId?: string | null;
};
let {
  organizationId,
}:{
  organizationId: string;
}=$props();
let notes=$state<Note[]>(untrack(()=>([])));
const setNotes=(next:typeof notes|((previous:typeof notes)=>typeof notes))=>{notes=typeof next==="function"?(next as (previous:typeof notes)=>typeof notes)(notes):next;};
let note=$state(untrack(()=>("")));
const setNote=(next:typeof note|((previous:typeof note)=>typeof note))=>{note=typeof next==="function"?(next as (previous:typeof note)=>typeof note)(note):next;};
let error=$state(untrack(()=>("")));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
const load=$derived.by(()=>{organizationId;return async () => {
    try {
      const response = await fetch(`/api/platform/support?organizationId=${organizationId}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Support notes could not be loaded.");
      }
      setNotes(body.notes ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Support notes could not be loaded.");
    }
  };});
$effect(()=>{load;return untrack(() => {
    void load();
  });});
async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/platform/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId, note: note.trim() }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Support note could not be created.");
      }
      setNote("");
      showToast({ type: "success", title: "Note recorded", message: "Support note added to timeline." });
      await load();
    } catch (cause) {
      const errMsg = cause instanceof Error ? cause.message : "Support note could not be created.";
      setError(errMsg);
      showToast({ type: "error", title: "Note failed", message: errMsg });
    } finally {
      setBusy(false);
    }
  }
</script>
<Card class="border border-border/80 bg-surface shadow-xs">
      <CardHeader class="flex flex-row items-center justify-between border-b border-border/50 pb-4">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SvgIcon name="MessageSquare" class="h-4 w-4" />
          </div>
          <div>
            <CardTitle class="text-base font-semibold text-foreground">
              Internal Support & Escalation Notes
            </CardTitle>
            <p class="text-xs text-muted">
              Confidential operator annotations visible only to platform administrators
            </p>
          </div>
        </div>
        <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
          {notes.length} {#if notes.length === 1}{"note"}{:else}{"notes"}{/if}
        </span>
      </CardHeader>
      <CardContent class="space-y-4 pt-5">
        {#if error}<div class="flex items-center gap-2 rounded-lg border border-danger-border bg-danger-bg p-3 text-xs text-danger">
            <SvgIcon name="AlertCircle" class="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>{/if}

        <form onsubmit={submit} class="flex gap-2">
          <Input aria-label="Support note" placeholder="Add an operational or compliance note for this tenant…" value={note} onchange={(event) => setNote(event.currentTarget.value)} class="flex-1 bg-slate-50/50 text-sm focus:bg-white" />
          <Button type="submit" disabled={busy || !note.trim()} class="gap-1.5 shrink-0">
            <SvgIcon name="Send" class="h-3.5 w-3.5" />
            <span>{#if busy}{"Saving…"}{:else}{"Add Note"}{/if}</span>
          </Button>
        </form>

        {#if notes.length}<div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {#each notes as item}<div class="group rounded-xl border border-border/70 bg-slate-50/50 p-3.5 transition-colors hover:border-border hover:bg-slate-50">
                <p class="text-sm text-foreground/90 leading-relaxed">{item.note}</p>
                <div class="mt-2.5 flex items-center gap-2 text-xs text-muted">
                  <SvgIcon name="Clock" class="h-3 w-3" />
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  {#if item.createdByUserId}<span class="text-slate-400 font-mono text-[11px]">
                      · Author: {item.createdByUserId.slice(0, 8)}…
                    </span>{/if}
                </div>
              </div>{/each}
          </div>{:else}<div class="rounded-xl border border-dashed border-border/80 p-6 text-center">
            <p class="text-sm font-medium text-slate-600">No support notes recorded</p>
            <p class="mt-1 text-xs text-muted">
              Add operational guidelines, escalation notices, or compliance details above.
            </p>
          </div>{/if}
      </CardContent>
    </Card>
