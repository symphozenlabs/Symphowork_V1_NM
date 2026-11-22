<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
const router={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};
let form=$state(untrack(()=>({
    name: "",
    legalName: "",
    slug: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    contactEmail: "",
  })));
const setForm=(next:typeof form|((previous:typeof form)=>typeof form))=>{form=typeof next==="function"?(next as (previous:typeof form)=>typeof form)(form):next;};
let error=$state(untrack(()=>("")));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let created=$state(untrack(()=>("")));
const setCreated=(next:typeof created|((previous:typeof created)=>typeof created))=>{created=typeof next==="function"?(next as (previous:typeof created)=>typeof created)(created):next;};
let loading=$state(untrack(()=>(false)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setCreated("");
    setLoading(true);

    try {
      const response = await fetch("/api/platform/organizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug.trim().toLowerCase(),
          contactEmail: form.contactEmail.trim().toLowerCase(),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errMsg = body.error?.message ?? "Unable to create organization. Please try again.";
        setError(errMsg);
        showToast({ type: "error", title: "Creation failed", message: errMsg });
        setLoading(false);
      } else {
        const org = body.organization;
        const orgName = org?.name || form.name;
        setCreated(orgName);
        showToast({
          type: "success",
          title: "Organization created",
          message: `${orgName} has been provisioned successfully.`,
        });
        setTimeout(() => {
          router.push("/platform/organizations");
        }, 800);
      }
    } catch {
      const connMsg = "The organization could not be created. Check your connection and try again.";
      setError(connMsg);
      showToast({ type: "error", title: "Connection error", message: connMsg });
      setLoading(false);
    }
  }
</script>
<form onsubmit={submit} class="space-y-4" aria-busy={loading}>
      {#each [
        ["name", "Organization name"],
        ["legalName", "Legal name"],
        ["slug", "Slug"],
        ["contactEmail", "Primary admin email"],
        ["timezone", "Timezone"],
        ["currency", "Currency"],
      ] as [key, label]}<label class="block text-sm font-semibold">
          {label}
          {#if key === "contactEmail"}<span class="ml-1 text-xs font-normal text-muted">
              (used for the organization invitation)
            </span>{/if}
          <Input required disabled={loading || Boolean(created)} type={key === "contactEmail" ? "email" : "text"} value={form[key as keyof typeof form]} onchange={(event) =>
              setForm({ ...form, [key]: event.currentTarget.value })} class="mt-2" />
        </label>{/each}

      {#if error}<p role="alert" class="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive">
          {error}
        </p>{/if}

      {#if created}
          <div role="status" aria-live="polite" class="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-white p-4 shadow-xl transition-all">
            <div class="grid size-7 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              ✓
            </div>
            <div>
              <p class="font-semibold text-emerald-950">Organization created successfully.</p>
              <p class="text-xs text-muted">&ldquo;{created}&rdquo; is pending approval. Redirecting&hellip;</p>
            </div>
          </div>
          <p role="status" class="rounded-lg border border-emerald-200 bg-success-bg p-3 text-sm text-emerald-800">
            Organization &ldquo;{created}&rdquo; created successfully. Redirecting to organizations list&hellip;
          </p>
        {/if}

      <Button type="submit" disabled={loading || Boolean(created)}>
        {#if loading}{#if created}{"Redirecting…"}{:else}{"Creating organization…"}{/if}{:else}{"Create pending organization"}{/if}
      </Button>
    </form>
