<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let { planId }:{ planId: string }=$props();
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
async function submit(event: SubmitEvent & {currentTarget:HTMLFormElement}) { event.preventDefault(); const form = new FormData(event.currentTarget); const raw = form.get("limitValue")?.toString() ?? ""; const response = await fetch(`/api/platform/plans/${planId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ featureKey: form.get("featureKey"), enabled: form.get("enabled") === "on", limitValue: raw === "" ? null : Number(raw) }) }); const body = await response.json(); setMessage(response.ok ? "Saved." : body.error?.message ?? "Unable to save."); if (response.ok) window.location.reload(); }
</script>
<form onsubmit={submit} class="mt-3 flex flex-wrap items-end gap-2"><label class="text-xs">Feature<input name="featureKey" required placeholder="employees" class="mt-1 block rounded-lg border p-2" /></label><label class="text-xs">Limit<input name="limitValue" type="number" min="0" placeholder="Unlimited" class="mt-1 block w-28 rounded-lg border p-2" /></label><label class="flex items-center gap-1 pb-2 text-xs"><input name="enabled" type="checkbox" defaultChecked /> Enabled</label><Button size="sm" type="submit">Save feature</Button>{#if message}<span class="pb-2 text-xs text-muted">{message}</span>{/if}</form>
