<script lang="ts">
type AuthMode='login'|'register'|'forgot-password';
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";
import AuthCommandCanvas from "$lib/components/auth/AuthCommandCanvas.svelte";
import LoginForm from "$lib/components/auth/LoginForm.svelte";
import RegisterForm from "$lib/components/auth/RegisterForm.svelte";
import ForgotPasswordForm from "$lib/components/auth/ForgotPasswordForm.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll,pushState} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface AuthFlipViewProps {
  initialMode?: AuthMode;
}
let { initialMode = "login" }:AuthFlipViewProps=$props();
let mode=$state<AuthMode>(untrack(()=>(initialMode)));
const setMode=(next:typeof mode|((previous:typeof mode)=>typeof mode))=>{mode=typeof next==="function"?(next as (previous:typeof mode)=>typeof mode)(mode):next;};
let frontHeight=$state<number | undefined>(untrack(()=>(initialMode === "login" ? 530 : undefined)));
const setFrontHeight=(next:typeof frontHeight|((previous:typeof frontHeight)=>typeof frontHeight))=>{frontHeight=typeof next==="function"?(next as (previous:typeof frontHeight)=>typeof frontHeight)(frontHeight):next;};
let registerHeight=$state<number | undefined>(untrack(()=>(initialMode === "register" ? 760 : undefined)));
const setRegisterHeight=(next:typeof registerHeight|((previous:typeof registerHeight)=>typeof registerHeight))=>{registerHeight=typeof next==="function"?(next as (previous:typeof registerHeight)=>typeof registerHeight)(registerHeight):next;};
let forgotHeight=$state<number | undefined>(untrack(()=>(initialMode === "forgot-password" ? 470 : undefined)));
const setForgotHeight=(next:typeof forgotHeight|((previous:typeof forgotHeight)=>typeof forgotHeight))=>{forgotHeight=typeof next==="function"?(next as (previous:typeof forgotHeight)=>typeof forgotHeight)(forgotHeight):next;};
let frontRef=$state({current:null as HTMLDivElement|null});
let registerRef=$state({current:null as HTMLDivElement|null});
let forgotRef=$state({current:null as HTMLDivElement|null});
$effect(()=>{return untrack(() => {
    function onPopState() {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.includes("register")) {
          setMode("register");
        } else if (path.includes("forgot-password")) {
          setMode("forgot-password");
        } else {
          setMode("login");
        }
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  });});
$effect(()=>{return untrack(() => {
    function measure() {
      if (frontRef.current) {
        const fh = frontRef.current.scrollHeight || frontRef.current.offsetHeight;
        if (fh > 0) setFrontHeight(fh);
      }
      if (registerRef.current) {
        const rh = registerRef.current.scrollHeight || registerRef.current.offsetHeight;
        if (rh > 0) setRegisterHeight(rh);
      }
      if (forgotRef.current) {
        const fgh = forgotRef.current.scrollHeight || forgotRef.current.offsetHeight;
        if (fgh > 0) setForgotHeight(fgh);
      }
    }
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      if (frontRef.current) ro.observe(frontRef.current);
      if (registerRef.current) ro.observe(registerRef.current);
      if (forgotRef.current) ro.observe(forgotRef.current);
    }

    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  });});
function handleFlip(targetMode: AuthMode) {
    if (targetMode === mode) return;
    setMode(targetMode);
    if (typeof window !== "undefined") {
      const targetPath =
        targetMode === "login"
          ? "/login"
          : targetMode === "register"
          ? "/register"
          : "/forgot-password";
      pushState(targetPath, {});
      document.title =
        targetMode === "login"
          ? "Sign In | SymphoWork"
          : targetMode === "register"
          ? "Create Account | SymphoWork"
          : "Account Recovery | SymphoWork";

      // If returning to a shorter form, smoothly scroll to top
      if (targetMode === "login" || targetMode === "forgot-password") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }
const activeHeight=$derived(mode === "login"
      ? frontHeight
      : mode === "register"
      ? registerHeight
      : forgotHeight);
</script>
<div class="min-h-screen bg-background lg:grid lg:grid-cols-12">
      
      <AuthCommandCanvas mode={mode} />

      
      <div class="flex min-h-screen flex-col justify-center items-center p-6 sm:p-8 lg:col-span-7 lg:p-10 xl:p-12 bg-gradient-to-b from-[#F7F8FB] to-[#F1F5F0]">
        
        <div class="w-full max-w-[500px] xl:max-w-[520px] lg:hidden flex flex-col items-center gap-2 pb-6">
          <a href="/" class="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-opacity hover:opacity-90" aria-label="SymphoWork Home">
            <img src="/symphowork-logo.png" alt="SymphoWork" width={180} height={56} class="h-14 sm:h-16 w-auto object-contain" />
          </a>
          <div class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-sidebar-active px-3 py-0.5 text-[11px] font-semibold text-primary">
            <span class="size-1.5 rounded-full bg-primary animate-pulse"></span>
            <span>
              {#if mode === "login"}{"Enterprise Identity Gateway"}{:else}{#if mode === "register"}{"Operator Registration"}{:else}{"Account Recovery Enclave"}{/if}{/if}
            </span>
          </div>
        </div>

        
        <div class="w-full max-w-[500px] xl:max-w-[520px] my-auto py-2 sm:py-4 flex flex-col items-center">
          
          <div class="auth-flip-perspective w-full">
            <div class={cn(
                "auth-flip-card",
                mode === "login" && "state-login",
                mode === "register" && "state-register is-flipped",
                mode === "forgot-password" && "state-forgot"
              )} style:height={activeHeight ? `${activeHeight}px` : undefined}>
              
              <div bind:this={frontRef.current} class="auth-card-face auth-card-front" aria-hidden={mode !== "login"} inert={mode !== "login"}>
                <div class="rounded-2xl border border-[#DCE6DA] bg-surface p-8 sm:p-10 lg:p-11 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  <header class="space-y-2.5">
                    <div class="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                      <SvgIcon name="Lock" class="size-3.5 text-primary" aria-hidden="true" />
                      <span>Secure Identity Gateway</span>
                    </div>
                    <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Welcome back
                    </h1>
                    <p class="text-sm text-muted leading-relaxed">
                      Sign in to your SymphoWork organization workspace.
                    </p>
                  </header>

                  <div class="mt-7">
                    <LoginForm onForgotPassword={() => handleFlip("forgot-password")} onRegister={() => handleFlip("register")} />
                  </div>

                  <footer class="mt-7 border-t border-border/80 pt-5 text-center text-xs sm:text-sm text-muted">
                    Don&apos;t have an account?{" "}
                    <button type="button" onclick={() => handleFlip("register")} class="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer">
                      Create account
                    </button>
                  </footer>
                </div>
              </div>

              
              <div bind:this={registerRef.current} class="auth-card-face auth-card-back-register" aria-hidden={mode !== "register"} inert={mode !== "register"}>
                <div class="rounded-2xl border border-[#DCE6DA] bg-surface p-8 sm:p-10 lg:p-11 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  <header class="space-y-2.5">
                    <div class="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                      <SvgIcon name="UserPlus" class="size-3.5 text-primary" aria-hidden="true" />
                      <span>Operator Registration</span>
                    </div>
                    <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Create your account
                    </h1>
                    <p class="text-sm text-muted leading-relaxed">
                      Register your personal operator identity. Workspace tenant access is granted upon approved invitation.
                    </p>
                  </header>

                  <div class="mt-7">
                    <RegisterForm />
                  </div>

                  <footer class="mt-7 border-t border-border/80 pt-5 text-center text-xs sm:text-sm text-muted">
                    Already have an account?{" "}
                    <button type="button" onclick={() => handleFlip("login")} class="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer">
                      Sign in
                    </button>
                  </footer>
                </div>
              </div>

              
              <div bind:this={forgotRef.current} class="auth-card-face auth-card-back-forgot" aria-hidden={mode !== "forgot-password"} inert={mode !== "forgot-password"}>
                <div class="rounded-2xl border border-[#DCE6DA] bg-surface p-8 sm:p-10 lg:p-11 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  <header class="space-y-2.5">
                    <div class="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                      <SvgIcon name="RotateCcw" class="size-3.5 text-primary" aria-hidden="true" />
                      <span>Account Recovery Enclave</span>
                    </div>
                    <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Forgot password
                    </h1>
                    <p class="text-sm text-muted leading-relaxed">
                      Enter your registered email address to receive a secure password recovery link.
                    </p>
                  </header>

                  <div class="mt-7">
                    <ForgotPasswordForm onSignIn={() => handleFlip("login")} />
                  </div>

                  <footer class="mt-7 border-t border-border/80 pt-5 text-center text-xs sm:text-sm text-muted">
                    Remembered your credentials?{" "}
                    <button type="button" onclick={() => handleFlip("login")} class="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer">
                      Sign in
                    </button>
                  </footer>
                </div>
              </div>
            </div>
          </div>

          
          <p class="mt-6 text-center text-xs text-muted leading-relaxed">
            Protected by enterprise-grade cryptographic session authorization
          </p>
        </div>
      </div>
    </div>
