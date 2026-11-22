<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let {
  setting,
}:{
  setting: { key: string; value: string | null };
}=$props();
let message=$state(untrack(()=>("")));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let isSuccess=$state(untrack(()=>(false)));
const setIsSuccess=(next:typeof isSuccess|((previous:typeof isSuccess)=>typeof isSuccess))=>{isSuccess=typeof next==="function"?(next as (previous:typeof isSuccess)=>typeof isSuccess)(isSuccess):next;};
let busy=$state(untrack(()=>(false)));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
async function submit(event: SubmitEvent & {currentTarget:HTMLFormElement}) {
    event.preventDefault();
    if(busy)return;
    setBusy(true);
    setMessage("");
    const value = new FormData(event.currentTarget).get("value");
    try {
      const response = await fetch("/api/platform/configuration", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: setting.key, value }),
      });
      const body = await response.json();
      if (response.ok && body.success === true) {
        setIsSuccess(true);
        const succMsg = "Setting saved successfully.";
        setMessage(succMsg);
        showToast({
          type: "success",
          title: "Configuration updated",
          message: `Setting "${setting.key}" has been saved.`,
        });
      } else {
        setIsSuccess(false);
        const errMsg = body.error?.message ?? "Unable to save configuration.";
        setMessage(errMsg);
        showToast({ type: "error", title: "Update failed", message: errMsg });
      }
    } catch {
      setIsSuccess(false);
      const connMsg = "Network error occurred while saving configuration.";
      setMessage(connMsg);
      showToast({ type: "error", title: "Connection error", message: connMsg });
    } finally {
      setBusy(false);
    }
  }
</script>
<form onsubmit={submit} class="space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex-1 min-w-[240px]">
          <label class="sr-only" for={`setting-${setting.key}`}>
            {setting.key}
          </label>
          <Input id={`setting-${setting.key}`} name="value" value={setting.value ?? ""} class="bg-slate-50/50 text-sm focus:bg-white" />
        </div>
        <Button size="sm" type="submit" disabled={busy} class="gap-1.5 shrink-0">
          <SvgIcon name="Save" class="h-3.5 w-3.5" />
          <span>{#if busy}{"Saving…"}{:else}{"Save"}{/if}</span>
        </Button>
      </div>
      {#if message}<div role={isSuccess?"status":"alert"} class={`flex items-center gap-1.5 text-xs font-medium ${
            isSuccess ? "text-emerald-700" : "text-danger"
          }`}>
          {#if isSuccess}<SvgIcon name="CheckCircle2" class="h-3.5 w-3.5" />{:else}<SvgIcon name="AlertCircle" class="h-3.5 w-3.5" />{/if}
          <span>{message}</span>
        </div>{/if}
    </form>
