<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
const params=$derived(page.params as { slug: string });
let message=$state(untrack(()=>""));
const setMessage=(next:typeof message|((previous:typeof message)=>typeof message))=>{message=typeof next==="function"?(next as (previous:typeof message)=>typeof message)(message):next;};
let error=$state(untrack(()=>""));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let busy=$state(untrack(()=>false));
const setBusy=(next:typeof busy|((previous:typeof busy)=>typeof busy))=>{busy=typeof next==="function"?(next as (previous:typeof busy)=>typeof busy)(busy):next;};
async function submit(event: SubmitEvent & {currentTarget:HTMLFormElement}) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    form.set("consentStatus", form.get("consentStatus") === "on" ? "granted" : "not_granted");

    try {
      const response = await fetch(`/api/public/jobs/${params.slug}/apply`, {
        method: "POST",
        body: form,
      });
      const body = await response.json();

      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "We could not submit this application.");
      }

      setMessage("Application submitted successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not submit this application.");
    } finally {
      setBusy(false);
    }
  }
</script>
<div class="min-h-screen bg-background">
      
      <header class="sticky top-0 z-30 border-b border-border bg-surface/90 px-5 backdrop-blur-md md:px-8">
        <div class="mx-auto flex h-16 max-w-3xl items-center justify-between">
          <a href="/" class="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-90" aria-label="SymphoWork Home">
            <img src="/symphowork-logo.png" alt="SymphoWork" width={160} height={42} class="h-10 w-auto object-contain" />
          </a>
          {#if params.slug}<a href={`/jobs/${params.slug}`} class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors">
              <SvgIcon name="ArrowLeft" class="size-3.5" aria-hidden="true" />
              <span>Back to job details</span>
            </a>{/if}
        </div>
      </header>

      
      <main class="px-5 py-10 md:py-14">
        <form onsubmit={submit} class="mx-auto max-w-3xl space-y-6 rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-[0_4px_24px_rgba(11,25,48,0.03)]">
          <header class="border-b border-border pb-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted">
              Candidate Application
            </p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tell us about yourself
            </h1>
            <p class="mt-2 text-sm leading-relaxed text-muted">
              No account is required. Your application and documents are stored securely with the hiring team.
            </p>
          </header>

          
          <div class="space-y-4">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact & Professional Details
            </h2>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-firstName">First name *</label>
                <input name="firstName" id="application-firstName" required placeholder="First name" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-lastName">Last name *</label>
                <input name="lastName" id="application-lastName" required placeholder="Last name" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-email">Email address *</label>
                <input name="email" id="application-email" type="email" required placeholder="you@example.com" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-phone">Phone number</label>
                <input name="phone" id="application-phone" placeholder="+1 (555) 000-0000" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-location">Current location</label>
                <input name="location" id="application-location" placeholder="City, Country" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-currentCompany">Current company</label>
                <input name="currentCompany" id="application-currentCompany" placeholder="Current employer" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-currentDesignation">Current designation</label>
                <input name="currentDesignation" id="application-currentDesignation" placeholder="Senior Software Engineer" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-totalExperience">Total experience (years)</label>
                <input name="totalExperience" id="application-totalExperience" type="number" min="0" step="0.1" placeholder="e.g. 5.5" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-expectedSalary">Expected salary</label>
                <input name="expectedSalary" id="application-expectedSalary" type="number" min="0" placeholder="Annual target compensation" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-muted" for="application-noticePeriodDays">Notice period (days)</label>
                <input name="noticePeriodDays" id="application-noticePeriodDays" type="number" min="0" placeholder="e.g. 30" class="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>
          </div>

          
          <div class="space-y-1.5">
            <label class="block text-sm font-semibold text-foreground" for="application-coverNote">Cover note</label>
            <textarea name="coverNote" id="application-coverNote" placeholder="Share relevant projects, motivations, or context for your application…" class="min-h-28 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"></textarea>
          </div>

          
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-foreground" for="application-resume">
              Resume / Curriculum Vitae *
            </label>
            <div class="rounded-xl border border-dashed border-border bg-background/50 p-4 transition-colors hover:border-primary/50">
              <div class="flex items-center gap-3">
                <div class="grid size-10 shrink-0 place-items-center rounded-lg bg-sidebar-active text-sidebar-active-text border border-primary/10">
                  <SvgIcon name="FileUp" class="size-5" aria-hidden="true" />
                </div>
                <div class="flex-1 min-w-0">
                  <input id="application-resume" name="resume" type="file" accept=".pdf,.doc,.docx" required class="block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-secondary cursor-pointer" />
                  <p class="mt-1 text-[11px] text-muted">Supported formats: PDF, DOC, DOCX</p>
                </div>
              </div>
            </div>
          </div>

          
          <label class="flex items-start gap-2.5 text-xs text-muted cursor-pointer select-none">
            <input name="consentStatus" type="checkbox" required class="mt-0.5 size-4 rounded-xs border-border text-primary focus:ring-ring" />
            <span>
              I consent to this organization processing my application and candidate data for recruitment purposes in accordance with data privacy regulations.
            </span>
          </label>

          
          {#if error}<div role="alert" class="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-destructive">
              <SvgIcon name="AlertCircle" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {#if error.includes("scanner") || error.includes("admission")}{"Resume upload is temporarily unavailable while secure file scanning is not configured."}{:else}{error}{/if}
              </span>
            </div>{/if}

          {#if message}<div role="status" class="flex items-start gap-2.5 rounded-lg border border-success-border bg-success-bg p-4 text-sm text-success">
              <SvgIcon name="CheckCircle2" class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p class="font-semibold text-foreground">{message}</p>
            </div>{/if}

          
          <div class="border-t border-border pt-4">
            <Button type="submit" disabled={busy} class="w-full sm:w-auto px-8">
              {#if busy}{"Submitting application…"}{:else}{"Submit application"}{/if}
            </Button>
          </div>
        </form>
      </main>

      
      <footer class="border-t border-border bg-surface py-8 text-center text-xs text-muted">
        <p>© {new Date().getFullYear()} SymphoWork Inc. High-integrity workforce operations.</p>
      </footer>
    </div>
