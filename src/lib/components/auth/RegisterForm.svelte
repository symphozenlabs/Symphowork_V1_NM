<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";
import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
let form=$state(untrack(()=>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })));
const setForm=(next:typeof form|((previous:typeof form)=>typeof form))=>{form=typeof next==="function"?(next as (previous:typeof form)=>typeof form)(form):next;};
let showPassword=$state(untrack(()=>(false)));
const setShowPassword=(next:typeof showPassword|((previous:typeof showPassword)=>typeof showPassword))=>{showPassword=typeof next==="function"?(next as (previous:typeof showPassword)=>typeof showPassword)(showPassword):next;};
let showConfirmPassword=$state(untrack(()=>(false)));
const setShowConfirmPassword=(next:typeof showConfirmPassword|((previous:typeof showConfirmPassword)=>typeof showConfirmPassword))=>{showConfirmPassword=typeof next==="function"?(next as (previous:typeof showConfirmPassword)=>typeof showConfirmPassword)(showConfirmPassword):next;};
let loading=$state(untrack(()=>(false)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);
let registrationStatus=$state<{
    kind: "idle" | "error" | "success";
    message?: string;
    delivery?: string;
  }>(untrack(()=>({ kind: "idle" })));
const setState=(next:typeof registrationStatus|((previous:typeof registrationStatus)=>typeof registrationStatus))=>{registrationStatus=typeof next==="function"?(next as (previous:typeof registrationStatus)=>typeof registrationStatus)(registrationStatus):next;};
const checks=$derived([
    { label: "12+ characters", pass: form.password.length >= 12 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(form.password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(form.password) },
    { label: "Number", pass: /\d/.test(form.password) },
  ]);
const strength=$derived(checks.filter((c) => c.pass).length);
async function submit(event: SubmitEvent) {
    event.preventDefault();
    if(loading)return;
    if (form.password !== form.confirmPassword) {
      const msg = "Passwords do not match.";
      showToast({ type: "error", title: "Validation error", message: msg });
      return setState({ kind: "error", message: msg });
    }

    setLoading(true);
    setState({ kind: "idle" });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = body.error?.message ?? "Registration failed.";
        showToast({ type: "error", title: "Registration failed", message: errMsg });
        return setState({ kind: "error", message: errMsg });
      }

      showToast({
        type: "success",
        title: "Account created",
        message: "Check your email to verify your account.",
      });

      setState({
        kind: "success",
        message: "Your account was created. Check your email to verify it before signing in.",
        delivery: body.delivery,
      });
    } catch {
      const connMsg = "Unable to connect to the registration service. Please try again.";
      showToast({ type: "error", title: "Connection error", message: connMsg });
      setState({
        kind: "error",
        message: connMsg,
      });
    } finally {
      setLoading(false);
    }
  }
</script>
{#if registrationStatus.kind === "success"}<div class="space-y-4 rounded-xl border border-success-border bg-success-bg p-5 text-sm text-success">
        <div class="flex items-start gap-2.5">
          <SvgIcon name="CheckCircle2" class="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div class="space-y-2">
            <p class="font-semibold text-foreground">{registrationStatus.message}</p>
            {#if registrationStatus.delivery === "not_configured"}<p class="text-xs text-muted">
                Email delivery is not configured yet. Ask an administrator for a verification link or configure the approved email provider.
              </p>{/if}
          </div>
        </div>
        <div class="pt-2">
          <a class="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-4 hover:text-secondary" href="/verify-email">
            Open verification
          </a>
        </div>
      </div>{:else}<form class="space-y-4" onsubmit={submit}>
      {#if registrationStatus.kind === "error"}<div role="alert" class="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive">
          <SvgIcon name="AlertCircle" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{registrationStatus.message}</span>
        </div>{/if}

      <div class="space-y-1.5">
        <label for="register-fullName" class="block text-sm font-semibold text-foreground">
          Full name
        </label>
        <Input id="register-fullName" required minlength={2} maxlength={160} placeholder="First and last name" value={form.fullName} oninput={(e) => setForm({ ...form, fullName: e.currentTarget.value })} disabled={loading} class="h-11 sm:h-11.5 text-sm sm:text-base px-3.5 rounded-xl shadow-xs" />
      </div>

      <div class="space-y-1.5">
        <label for="register-email" class="block text-sm font-semibold text-foreground">
          Email address
        </label>
        <Input id="register-email" required type="email" autocomplete="email" placeholder="name@company.com" value={form.email} oninput={(e) => setForm({ ...form, email: e.currentTarget.value })} disabled={loading} class="h-11 sm:h-11.5 text-sm sm:text-base px-3.5 rounded-xl shadow-xs" />
      </div>

      <div class="space-y-1.5">
        <label for="register-password" class="block text-sm font-semibold text-foreground">
          Password
        </label>
        <div class="relative">
          <Input id="register-password" required type={showPassword ? "text" : "password"} autocomplete="new-password" placeholder="••••••••••••" value={form.password} oninput={(e) => setForm({ ...form, password: e.currentTarget.value })} disabled={loading} class="h-11 sm:h-11.5 text-sm sm:text-base px-3.5 pr-11 rounded-xl shadow-xs" />
          <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1.5 cursor-pointer" onclick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {#if showPassword}<SvgIcon name="EyeOff" class="size-4" aria-hidden="true" />{:else}<SvgIcon name="Eye" class="size-4" aria-hidden="true" />{/if}
          </button>
        </div>

        
        <div class="pt-1.5 space-y-1.5">
          <div class="flex gap-1 h-1.5 w-full">
            {#each [0, 1, 2, 3] as idx}<div class={cn(
                  "flex-1 rounded-full transition-colors duration-200",
                  idx < strength
                    ? strength <= 2
                      ? "bg-amber-500"
                      : "bg-primary"
                    : "bg-border"
                )}></div>{/each}
          </div>
          <span class="block text-xs text-muted">
            Use 12+ characters with uppercase, lowercase, and a number ({strength}/4 checks).
          </span>
        </div>
      </div>

      <div class="space-y-1.5">
        <label for="register-confirmPassword" class="block text-sm font-semibold text-foreground">
          Confirm password
        </label>
        <div class="relative">
          <Input id="register-confirmPassword" required type={showConfirmPassword ? "text" : "password"} autocomplete="new-password" placeholder="••••••••••••" value={form.confirmPassword} oninput={(e) => setForm({ ...form, confirmPassword: e.currentTarget.value })} disabled={loading} class="h-11 sm:h-11.5 text-sm sm:text-base px-3.5 pr-11 rounded-xl shadow-xs" />
          <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1.5 cursor-pointer" onclick={() => setShowConfirmPassword((prev) => !prev)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
            {#if showConfirmPassword}<SvgIcon name="EyeOff" class="size-4" aria-hidden="true" />{:else}<SvgIcon name="Eye" class="size-4" aria-hidden="true" />{/if}
          </button>
        </div>
      </div>

      <Button class="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-xs mt-3 cursor-pointer" type="submit" disabled={loading}>
        {#if loading}
            <SvgIcon name="Loader2" class="mr-2 size-4 animate-spin" aria-hidden="true" />
            <span>Creating account…</span>
          {:else}<span>Create account</span>{/if}
      </Button>
    </form>{/if}
