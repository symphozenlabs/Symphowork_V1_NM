<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
type Item = { id: string; title: string; status: "pending" | "completed" | "blocked" };
let { employeeId }:{ employeeId: string }=$props();
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let items=$state<Item[]>(untrack(()=>([])));
const setItems=(next:typeof items|((previous:typeof items)=>typeof items))=>{items=typeof next==="function"?(next as (previous:typeof items)=>typeof items)(items):next;};
let status=$state<string|undefined>(untrack(()=>(undefined)));
const setStatus=(next:typeof status|((previous:typeof status)=>typeof status))=>{status=typeof next==="function"?(next as (previous:typeof status)=>typeof status)(status):next;};
let message=$state<string|undefined>(untrack(()=>(undefined)));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
const load=$derived.by(()=>{employeeId;return async () => {
    const r = await fetch(`/api/app/employees/${employeeId}/onboarding`);
    const b = await r.json();
    if (!r.ok) throw new Error(b.error?.message ?? "Unable to load onboarding.");
    setItems(b.items ?? []);
    setStatus(b.onboarding?.status);
  };});
$effect(()=>{load;return untrack(() => {
    void load().catch((e) => setMessage(e.message));
  });});
const isCompleted=$derived(status === "completed");
async function toggle(item: Item) {
    if (isCompleted) return;
    setBusy(true);
    const r = await fetch(`/api/app/employees/${employeeId}/onboarding`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId: item.id, status: item.status === "completed" ? "pending" : "completed" }),
    });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) setMessage(b.error?.message ?? "Unable to update checklist.");
    else await load();
    setBusy(false);
  }
async function complete() {
    if (isCompleted) return;
    setBusy(true);
    const r = await fetch(`/api/app/employees/${employeeId}/onboarding`, { method: "POST" });
    const b = await r.json().catch(() => ({}));
    setMessage(r.ok ? "Onboarding completed." : b.error?.message ?? "Complete all checklist items first.");
    if (r.ok) {
      await load();
      router.refresh();
    }
    setBusy(false);
  }
const completedCount=$derived(items.filter((item) => item.status === "completed").length);
</script>
<div class="space-y-3">
      {#if message}<p role="status" class="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          {message}
        </p>{/if}
      <p class="text-sm text-muted">
        Status: <span class="font-semibold text-foreground">{status ?? "Loading…"}</span> · {completedCount}/{items.length} complete
      </p>
      {#if items.length === 0}<p class="rounded-lg border border-dashed p-4 text-sm text-muted">No onboarding checklist items found.</p>{:else}{#each items as item}<label class="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <input type="checkbox" checked={item.status === "completed"} disabled={busy || isCompleted} onchange={() => void toggle(item)} />
            {item.title}
          </label>{/each}{/if}
      {#if isCompleted}<p class="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          ✓ Onboarding completed
        </p>{:else}<Button disabled={busy || !items.length || items.some((item) => item.status !== "completed")} onclick={() => void complete()}>
          {#if busy}{"Completing…"}{:else}{"Complete onboarding"}{/if}
        </Button>{/if}
    </div>
