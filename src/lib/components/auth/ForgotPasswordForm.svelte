<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface ForgotPasswordFormProps {
  onSignIn?: () => void;
}
let { onSignIn }:ForgotPasswordFormProps=$props();
let email=$state(untrack(()=>("")));
const setEmail=(next:typeof email|((previous:typeof email)=>typeof email))=>{email=typeof next==="function"?(next as (previous:typeof email)=>typeof email)(email):next;};
let message=$state<string|undefined>(untrack(()=>(undefined)));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let delivery=$state<string|undefined>(untrack(()=>(undefined)));
const setDelivery=(next:typeof delivery|((previous:typeof delivery)=>typeof delivery))=>{delivery=typeof next==="function"?(next as (previous:typeof delivery)=>typeof delivery)(delivery):next;};
let loading=$state(untrack(()=>(false)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
async function submit(e: SubmitEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const b = await r.json().catch(() => ({}));
      const msg = b.message ?? "If that email is registered, reset instructions will be sent.";
      setMessage(msg);
      setDelivery(b.delivery);
      showToast({
        type: "info",
        title: "Instructions dispatched",
        message: msg,
      });
    } catch {
      const fallbackMsg = "If that email is registered, reset instructions will be sent.";
      setMessage(fallbackMsg);
      showToast({
        type: "info",
        title: "Instructions dispatched",
        message: fallbackMsg,
      });
    } finally {
      setLoading(false);
    }
  }
</script>
{#if message}<div class="space-y-4 rounded-xl border border-success-border bg-success-bg p-6 text-sm text-success">
        <div class="flex items-start gap-2.5">
          <SvgIcon name="CheckCircle2" class="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div class="space-y-2">
            <p class="font-semibold text-foreground text-sm sm:text-base">{message}</p>
            {#if delivery === "not_configured"}<p class="text-xs text-muted">
                Email delivery is not configured, so no reset email was sent.
              </p>{/if}
          </div>
        </div>
        <div class="pt-2">
          <a class="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 hover:text-secondary cursor-pointer" href="/login" onclick={(e) => {
              if (onSignIn) {
                e.preventDefault();
                onSignIn();
              }
            }}>
            Return to sign in
          </a>
        </div>
      </div>{:else}<form class="space-y-5 sm:space-y-5.5" onsubmit={submit}>
      <div class="space-y-2">
        <label for="forgot-email" class="block text-sm font-semibold text-foreground">
          Email address
        </label>
        <Input id="forgot-email" required type="email" autocomplete="email" placeholder="name@company.com" value={email} oninput={(e) => setEmail(e.currentTarget.value)} disabled={loading} class="h-11 sm:h-12 text-sm sm:text-base px-3.5 rounded-xl shadow-xs" />
      </div>

      <Button class="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-xs mt-3 cursor-pointer" type="submit" disabled={loading}>
        {#if loading}{"Sending instructions…"}{:else}{"Send reset instructions"}{/if}
      </Button>
    </form>{/if}
