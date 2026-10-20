<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import LinkButton from "$lib/components/ui/LinkButton.svelte";
import EnterpriseJourneyMap from "$lib/components/journey/EnterpriseJourneyMap.svelte";
import Reveal from "$lib/components/ui/Reveal.svelte";
import Card from "$lib/components/ui/Card.svelte";
import CardHeader from "$lib/components/ui/CardHeader.svelte";
import Badge from "$lib/components/ui/Badge.svelte";
import CardTitle from "$lib/components/ui/CardTitle.svelte";
import CardContent from "$lib/components/ui/CardContent.svelte";
import CardDescription from "$lib/components/ui/CardDescription.svelte";
const capabilities = $derived([
    {
      title: "Workforce & People Directory",
      description:
        "Centralized employee directory, lifecycle statuses, structured onboarding checklists, and self-service profile management.",
      icon: "UsersRound",
      badge: "Core HR",
    },
    {
      title: "Time & Attendance Engine",
      description:
        "Timezone-aware clock in/out, shift assignments, working-day schedules, break policies, and regularization requests.",
      icon: "Clock3",
      badge: "Time Tracking",
    },
    {
      title: "Leave Management",
      description:
        "Balance accruals, holiday calendars, multi-tier approval routing, and status visibility across organization teams.",
      icon: "CalendarCheck2",
      badge: "Absence",
    },
    {
      title: "Effective-Dated Payroll",
      description:
        "Salary structures, attendance-linked gross/net calculation, statutory contributions, and immutable finalized payroll runs.",
      icon: "Banknote",
      badge: "Compensation",
    },
    {
      title: "Recruitment & ATS Intelligence",
      description:
        "Job requisitions, public job portal, candidate pipelines, interview panels, and evidence-based resume extraction.",
      icon: "BriefcaseBusiness",
      badge: "Talent",
    },
    {
      title: "Projects & Task Collaboration",
      description:
        "Tenant-scoped projects, task prioritization, due dates, and direct conversion of team chat discussions into actionable tasks.",
      icon: "ListTodo",
      badge: "Execution",
    },
    {
      title: "Internal Organization Chat",
      description:
        "Secure organization-scoped direct messaging and discussion channels integrated with operational workflows.",
      icon: "MessageCircle",
      badge: "Communication",
    },
    {
      title: "Reporting & Workforce Analytics",
      description:
        "Department distribution charts, attendance breakdowns, leave utilization, expense totals, and role-governed data exports.",
      icon: "BarChart3",
      badge: "Intelligence",
    },
  ]);
const architecturePillars = $derived([
    {
      title: "Strict Tenant Isolation",
      description:
        "Every database query and mutation is partitioned by tenant ID, preventing cross-organization data leakage.",
      icon: "Lock",
    },
    {
      title: "Granular RBAC Governance",
      description:
        "Role-based permission sets dictate feature access for administrators, HR specialists, managers, and employees.",
      icon: "ShieldCheck",
    },
    {
      title: "Multi-Step Workflow Routing",
      description:
        "Automated step approval pipelines for leave, regularization, expense claims, and payroll sign-offs.",
      icon: "Layers",
    },
    {
      title: "Automated Provisioning",
      description:
        "Deterministic pipeline initializing roles, permissions, subscriptions, and administrative invitations.",
      icon: "Sparkles",
    },
  ]);
</script>
<div class="flex min-h-screen flex-col bg-white text-[#0D3324] overflow-x-hidden">
      
      
      
      <header class="sticky top-0 z-40 w-full border-b border-emerald-100/80 bg-white/95 backdrop-blur-md">
        <div class="mx-auto flex h-16 sm:h-18 max-w-[1600px] items-center justify-between px-3 sm:px-6 lg:px-10">
          <a href="/" class="flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-90 rounded-lg shrink-0" aria-label="SymphoWork Home">
            <img src="/symphowork-symbol.png" alt="SymphoWork Symbol" width={30} height={30} class="h-7 sm:h-8.5 w-auto object-contain" />
            <span class="text-base sm:text-xl font-bold tracking-tight text-[#0D3324]">
              Sympho<span class="text-[#10B981]">Work</span>
            </span>
          </a>

          <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LinkButton variant="ghost" size="sm" class="font-semibold text-xs sm:text-sm px-2 sm:px-3 text-[#0D3324] hover:bg-emerald-50" href="/login">Sign in</LinkButton>
            <LinkButton size="sm" class="font-bold text-xs sm:text-sm bg-[#10B981] hover:bg-[#059669] text-white shadow-xs rounded-full px-2.5 sm:px-4.5 gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap" href="/register">
                <span>Create account</span>
                <SvgIcon name="ArrowRight" class="size-3 sm:size-3.5" />
              </LinkButton>
          </div>
        </div>
      </header>

      <main class="flex-1">
        
        
        
        <section id="journey-map" class="relative overflow-hidden border-b border-emerald-100/60 bg-gradient-to-b from-white via-[#F6FAF7] to-white py-6 sm:py-8 lg:py-10">
          
          <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute -top-10 left-10 size-[500px] rounded-full bg-emerald-100/50 blur-[130px]"></div>
            <div class="absolute bottom-10 right-10 size-[600px] rounded-full bg-teal-100/40 blur-[140px]"></div>
          </div>

          <div class="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div class="grid lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center">
              
              <div class="lg:col-span-5 xl:col-span-4 space-y-6 animate-hero-entrance z-10">
                
                <div class="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-800 shadow-xs backdrop-blur-xs max-w-full">
                  <span class="relative flex size-2 shrink-0">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex size-2 rounded-full bg-[#10B981]"></span>
                  </span>
                  <span class="truncate">Platform Operational · All 19 HCM Modules Online</span>
                </div>

                
                <h1 class="text-3xl sm:text-5xl lg:text-[2.9rem] xl:text-[3.4rem] font-extrabold tracking-tight text-[#0D3324] leading-[1.08] break-words">
                  Unified People Operations for Every Stage of{" "}
                  <span class="text-[#10B981]">Your Growth.</span>
                </h1>

                
                <p class="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  From organization genesis and employee onboarding to shift attendance, leave approvals, payroll, and enterprise intelligence — SymphoWork orchestrates your complete workforce lifecycle in one tenant-isolated platform.
                </p>

                
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <LinkButton size="lg" class="h-12 px-8 sm:min-w-[160px] justify-center gap-2 text-sm sm:text-base font-semibold bg-[#0D3324] hover:bg-[#174734] text-white shadow-md cursor-pointer" href="/login">
                      Sign in
                      <SvgIcon name="ArrowRight" class="size-4 text-[#10B981]" />
                    </LinkButton>
                  <LinkButton size="lg" variant="outline" class="h-12 px-8 sm:min-w-[160px] justify-center text-sm sm:text-base font-semibold bg-white hover:bg-slate-50 text-[#0D3324] border-slate-300 shadow-xs cursor-pointer" href="/register">Get Started</LinkButton>
                </div>

                
                <div class="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-medium text-[#174734]">
                  <div class="flex items-center gap-2">
                    <SvgIcon name="CheckCircle2" class="size-4 text-[#10B981] shrink-0" />
                    <span>Tenant-isolated security</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <SvgIcon name="CheckCircle2" class="size-4 text-[#10B981] shrink-0" />
                    <span>Role-based permissions</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <SvgIcon name="CheckCircle2" class="size-4 text-[#10B981] shrink-0" />
                    <span>Complete employee lifecycle</span>
                  </div>
                </div>

                
                <div class="pt-4 border-t border-slate-200/80 flex items-center gap-5 sm:gap-8 text-xs text-slate-500">
                  <div>
                    <div class="text-xl font-bold text-[#0D3324] tracking-tight">19+</div>
                    <div class="text-[11px] text-slate-500">Integrated Modules</div>
                  </div>
                  <div>
                    <div class="text-xl font-bold text-[#0D3324] tracking-tight">100%</div>
                    <div class="text-[11px] text-slate-500">Postgres RLS</div>
                  </div>
                  <div>
                    <div class="text-xl font-bold text-[#0D3324] tracking-tight">∞</div>
                    <div class="text-[11px] text-slate-500">Built for Scale</div>
                  </div>
                </div>
              </div>

              
              <div class="lg:col-span-7 xl:col-span-8 relative z-10 w-full">
                <EnterpriseJourneyMap />
              </div>
            </div>
          </div>
        </section>

        
        
        
        <section id="capabilities" class="border-b border-emerald-100/60 py-10 md:py-14 bg-[#F8FAF9]">
          <div class="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <Reveal>
              <div class="mx-auto max-w-3xl text-center">
                <span class="inline-flex items-center rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  Integrated Capabilities
                </span>
                <h2 class="mt-3 text-3xl font-bold tracking-tight text-[#0D3324] sm:text-4xl">
                  Comprehensive tools for modern workforce administration.
                </h2>
                <p class="mt-2 text-base text-slate-600">
                  Each module is natively engineered into SymphoWork with strict tenant scoping and unified RBAC policies.
                </p>
              </div>
            </Reveal>

            <div class="mt-8 sm:mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {#each capabilities as cap, index}{@const Icon = cap.icon}<Reveal delayMs={index * 45}>
                    <Card class="flex h-full flex-col justify-between border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-lg shadow-xs">
                      <CardHeader class="pb-3">
                        <div class="flex items-center justify-between">
                          <div class="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <SvgIcon name={Icon} class="size-5" />
                          </div>
                          <Badge variant="neutral" class="text-[10px] bg-slate-100 text-slate-700 border-slate-200">
                            {cap.badge}
                          </Badge>
                        </div>
                        <CardTitle class="mt-4 text-base font-bold text-[#0D3324]">
                          {cap.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent class="pt-0">
                        <CardDescription class="text-xs leading-relaxed text-slate-600">
                          {cap.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Reveal>{/each}
            </div>
          </div>
        </section>

        
        
        
        <section id="architecture" class="border-b border-emerald-100/60 bg-white py-12 md:py-16">
          <div class="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div class="grid items-center gap-10 lg:grid-cols-12">
              <div class="space-y-4 lg:col-span-5">
                <span class="inline-flex items-center rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  Enterprise Architecture
                </span>
                <h2 class="text-3xl font-bold tracking-tight text-[#0D3324] sm:text-4xl">
                  Built on strict security and governance foundations.
                </h2>
                <p class="text-sm leading-relaxed text-slate-600 sm:text-base">
                  SymphoWork provides institutional confidence through deterministic tenant isolation,
                  cryptographic session handling, and configurable policy workflows.
                </p>
                <div class="pt-2">
                  <div class="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <SvgIcon name="ShieldCheck" class="size-4 text-emerald-600" />
                    <span>Zero Data Cross-Contamination Guarantee</span>
                  </div>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                {#each architecturePillars as pillar, index}{@const Icon = pillar.icon}<Reveal delayMs={index * 60}>
                      <div class="h-full rounded-2xl border border-slate-200/80 bg-[#F8FAF9] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/40 shadow-xs">
                        <div class="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <SvgIcon name={Icon} class="size-5" />
                        </div>
                        <h3 class="mt-4 text-base font-semibold text-[#0D3324]">
                          {pillar.title}
                        </h3>
                        <p class="mt-2 text-xs leading-relaxed text-slate-600">
                          {pillar.description}
                        </p>
                      </div>
                    </Reveal>{/each}
              </div>
            </div>
          </div>
        </section>

        
        
        
        <section id="governance" class="py-10 md:py-14 px-4 sm:px-6 lg:px-10">
          <div class="mx-auto max-w-[1400px] rounded-3xl bg-[#0D3324] text-white py-14 px-6 sm:px-12 text-center shadow-xl">
            <div class="mx-auto mb-6 flex items-center justify-center">
              <img src="/symphowork-logo-white.png" alt="SymphoWork Logo" width={200} height={56} class="h-14 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]" />
            </div>

            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Ready to unify your workforce operations?
            </h2>
            <p class="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-emerald-200 sm:text-base">
              Onboard your organization to access automated attendance, effective-dated payroll,
              and cross-functional team collaboration in minutes.
            </p>

            <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton size="lg" class="bg-[#10B981] text-white hover:bg-[#059669] shadow-sm font-bold h-13 px-7 cursor-pointer" href="/register">
                  Get started with organization onboarding
                  <SvgIcon name="ArrowRight" class="size-4" />
                </LinkButton>
              <LinkButton variant="outline" size="lg" class="border-white/30 text-white hover:bg-white/10 hover:text-white h-13 px-7 cursor-pointer" href="/platform/login">Platform console access</LinkButton>
            </div>
          </div>
        </section>
      </main>

      
      <footer class="border-t border-slate-200 bg-white py-10">
        <div class="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6 lg:px-10">
          <div class="flex items-center gap-3">
            <img src="/symphowork-symbol.png" alt="SymphoWork Symbol" width={36} height={36} class="h-8.5 w-auto object-contain" />
            <div class="text-left border-l border-slate-200 pl-3">
              <p class="text-xs font-bold text-[#0D3324]">SymphoWork HCM</p>
              <p class="text-[11px] text-slate-500">Enterprise People Operations Platform</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
            <a href="/login" class="transition-colors hover:text-[#10B981]">
              Workspace Login
            </a>
            <a href="/platform/login" class="transition-colors hover:text-[#10B981]">
              Platform Console
            </a>
            <a href="/register" class="transition-colors hover:text-[#10B981]">
              Register Organization
            </a>
          </div>

          <p class="text-xs text-slate-500">
            © {new Date().getFullYear()} SymphoWork Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
