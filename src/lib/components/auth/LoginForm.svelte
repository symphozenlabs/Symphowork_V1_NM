<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack,onMount} from "svelte";
let hydrated=$state(false);
onMount(()=>{hydrated=true;});
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface LoginFormProps {
  onForgotPassword?: () => void;
  onRegister?: () => void;
}
let { onForgotPassword }:LoginFormProps=$props();
let email=$state(untrack(()=>("")));
const setEmail=(next:typeof email|((previous:typeof email)=>typeof email))=>{email=typeof next==="function"?(next as (previous:typeof email)=>typeof email)(email):next;};
let password=$state(untrack(()=>("")));
const setPassword=(next:typeof password|((previous:typeof password)=>typeof password))=>{password=typeof next==="function"?(next as (previous:typeof password)=>typeof password)(password):next;};
let showPassword=$state(untrack(()=>(false)));
const setShowPassword=(next:typeof showPassword|((previous:typeof showPassword)=>typeof showPassword))=>{showPassword=typeof next==="function"?(next as (previous:typeof showPassword)=>typeof showPassword)(showPassword):next;};
let error=$state(untrack(()=>("")));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let loading=$state(untrack(()=>(false)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
async function submit(event: SubmitEvent) {
    event.preventDefault();
    if(loading)return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || body.success !== true || typeof body.user?.id !== 'string' || !body.user.id || typeof body.user?.platformRole !== 'string') {
        const errorMsg = body.error?.message ?? "Unable to sign in.";
        setError(errorMsg);
        showToast({
          type: "error",
          title: "Sign in failed",
          message: errorMsg,
        });
      } else if (body.user?.mustChangePassword) {
        showToast({
          type: "info",
          title: "Password update required",
          message: "Please establish a new password before continuing.",
        });
        window.location.assign("/change-password");
      } else {
        showToast({
          type: "success",
          title: "Welcome back",
          message: "Signed in successfully. Redirecting...",
        });
        window.location.assign(
          body.user?.platformRole && body.user.platformRole !== "NONE"
            ? "/platform"
            : "/app"
        );
      }
    } catch {
      const connMsg = "Unable to connect to the authentication server. Please try again.";
      setError(connMsg);
      showToast({
        type: "error",
        title: "Connection error",
        message: connMsg,
      });
    } finally {
      setLoading(false);
    }
  }
</script>
<form onsubmit={submit} class="space-y-5 sm:space-y-5.5">
      {#if error}<div role="alert" class="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive">
          <SvgIcon name="AlertCircle" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>{/if}

      <div class="space-y-2">
        <label for="login-email" class="block text-sm font-semibold text-foreground">
          Email address
        </label>
        <Input id="login-email" required type="email" autocomplete="email" placeholder="name@company.com" value={email} oninput={(event) => setEmail(event.currentTarget.value)} disabled={loading || !hydrated} class="h-11 sm:h-12 text-sm sm:text-base px-3.5 rounded-xl shadow-xs" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="login-password" class="block text-sm font-semibold text-foreground">
            Password
          </label>
          <a class="text-xs sm:text-sm font-semibold text-primary transition-colors hover:underline hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs" href="/forgot-password" onclick={(e) => {
              if (onForgotPassword) {
                e.preventDefault();
                onForgotPassword();
              }
            }}>
            Forgot password?
          </a>
        </div>
        <div class="relative">
          <Input id="login-password" required type={showPassword ? "text" : "password"} autocomplete="current-password" placeholder="••••••••••••" value={password} oninput={(event) => setPassword(event.currentTarget.value)} disabled={loading || !hydrated} class="h-11 sm:h-12 text-sm sm:text-base px-3.5 pr-11 rounded-xl shadow-xs" />
          <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1.5 cursor-pointer" onclick={() => setShowPassword((prev) => !prev)} disabled={!hydrated} aria-label={showPassword ? "Hide password" : "Show password"}>
            {#if showPassword}<SvgIcon name="EyeOff" class="size-4" aria-hidden="true" />{:else}<SvgIcon name="Eye" class="size-4" aria-hidden="true" />{/if}
          </button>
        </div>
      </div>

      <Button class="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-xs mt-3 cursor-pointer" type="submit" disabled={loading || !hydrated}>
        {#if loading}
            <SvgIcon name="Loader2" class="mr-2 size-4 animate-spin" aria-hidden="true" />
            <span>Signing in…</span>
          {:else}<span>Sign in to workspace</span>{/if}
      </Button>
    </form>
