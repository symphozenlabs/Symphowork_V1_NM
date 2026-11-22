<script lang="ts">
let {data}=$props();const job=$derived(data.job);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import Badge from "$lib/components/ui/Badge.svelte";

</script>
<div class="min-h-screen bg-background">
      
      <header class="sticky top-0 z-30 border-b border-border bg-surface/90 px-5 backdrop-blur-md md:px-8">
        <div class="mx-auto flex h-16 max-w-4xl items-center justify-between">
          <a href="/" class="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-90" aria-label="SymphoWork Home">
            <img src="/symphowork-logo.png" alt="SymphoWork" width={160} height={42} class="h-10 w-auto object-contain" />
          </a>
          <div class="flex items-center gap-3">
            <span class="rounded-full bg-sidebar-active px-3 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
              Careers
            </span>
            <a href="/login" class="text-xs font-semibold text-muted hover:text-foreground transition-colors">
              Employee Login
            </a>
          </div>
        </div>
      </header>

      
      <main class="px-5 py-10 md:py-14">
        <article class="mx-auto max-w-4xl space-y-8 rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-[0_4px_24px_rgba(11,25,48,0.03)]">
          <header class="border-b border-border pb-8">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <span>SymphoWork Opportunities</span>
            </div>
            <h1 class="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {job.publicTitle}
            </h1>

            
            <div class="mt-4 flex flex-wrap items-center gap-2.5 text-sm">
              <Badge variant="neutral" class="gap-1.5 py-1 px-3">
                <SvgIcon name="MapPin" class="size-3.5 text-muted" aria-hidden="true" />
                <span>{job.location ?? "Location flexible"}</span>
              </Badge>
              <Badge variant="neutral" class="gap-1.5 py-1 px-3">
                <SvgIcon name="Briefcase" class="size-3.5 text-muted" aria-hidden="true" />
                <span>{job.workMode ?? "Work mode to be confirmed"}</span>
              </Badge>
              <Badge variant="neutral" class="gap-1.5 py-1 px-3">
                <SvgIcon name="Clock" class="size-3.5 text-muted" aria-hidden="true" />
                <span>{job.employmentType ?? "Full-time"}</span>
              </Badge>
            </div>
          </header>

          <section class="space-y-3">
            <h2 class="text-xl font-bold text-foreground">About the role</h2>
            <div class="whitespace-pre-wrap leading-relaxed text-muted text-sm sm:text-base">
              {job.publicDescription}
            </div>
          </section>

          {#if job.responsibilities}<section class="space-y-3">
              <h2 class="text-xl font-bold text-foreground">Responsibilities</h2>
              <div class="whitespace-pre-wrap leading-relaxed text-muted text-sm sm:text-base">
                {job.responsibilities}
              </div>
            </section>{/if}

          {#if job.qualifications}<section class="space-y-3">
              <h2 class="text-xl font-bold text-foreground">Qualifications</h2>
              <div class="whitespace-pre-wrap leading-relaxed text-muted text-sm sm:text-base">
                {job.qualifications}
              </div>
            </section>{/if}

          
          <div class="border-t border-border pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p class="font-semibold text-foreground">Ready to join our team?</p>
              <p class="text-xs text-muted">No account required. Application takes about 2 minutes.</p>
            </div>
            <a href={`/jobs/${job.slug}/apply`} class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-xs transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>Apply for this role</span>
              <SvgIcon name="ArrowRight" class="size-4" aria-hidden="true" />
            </a>
          </div>
        </article>
      </main>

      
      <footer class="border-t border-border bg-surface py-8 text-center text-xs text-muted">
        <p>© {new Date().getFullYear()} SymphoWork Inc. All applications are processed securely.</p>
      </footer>
    </div>

<svelte:head><title>{job.publicTitle} | SymphoWork Careers</title><meta name="description" content={job.publicDescription.slice(0,160)}/></svelte:head>
