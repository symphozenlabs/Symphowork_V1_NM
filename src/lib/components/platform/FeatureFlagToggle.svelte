<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";
import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";

import {untrack} from "svelte";
import {page} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let {
  flag,
}:{
  flag: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    enabled: boolean;
  };
}=$props();
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let showConfirm=$state(untrack(()=>(false)));
const setShowConfirm=(next:typeof showConfirm|((previous:typeof showConfirm)=>typeof showConfirm))=>{showConfirm=typeof next==="function"?(next as (previous:typeof showConfirm)=>typeof showConfirm)(showConfirm):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
async function executeToggle() {
    if(busy)return;
    setBusy(true);
    try {
      const response = await fetch(`/api/platform/features/${flag.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: flag.key,
          name: flag.name,
          description: flag.description,
          enabled: !flag.enabled,
        }),
      });
      const body = await response.json().catch(() => ({}));
      setMessage(response.ok ? "Saved." : body.error?.message ?? "Unable to update.");
      if (response.ok) {
        await invalidateAll();
      }
    } catch {
      setMessage("Unable to update feature flag.");
    } finally {
      setBusy(false);
      setShowConfirm(false);
    }
  }
</script>
<div class="flex items-center gap-2">
      <Button size="sm" variant={flag.enabled ? "secondary" : "ghost"} onclick={() => setShowConfirm(true)} disabled={busy}>
        {#if flag.enabled}{"Disable"}{:else}{"Enable"}{/if}
      </Button>
      {#if message}<span class="text-xs text-muted">{message}</span>{/if}

      <ConfirmDialog open={showConfirm} onOpenChange={setShowConfirm} title={`${flag.enabled ? "Disable" : "Enable"} ${flag.name}?`} description={flag.description
            ? `Are you sure you want to ${flag.enabled ? "disable" : "enable"} ${flag.name}? ${flag.description}`
            : `Are you sure you want to ${flag.enabled ? "disable" : "enable"} ${flag.name}?`} confirmText={flag.enabled ? "Disable Flag" : "Enable Flag"} cancelText="Cancel" variant={flag.enabled ? "destructive" : "primary"} isLoading={busy} onConfirm={executeToggle} />
    </div>
