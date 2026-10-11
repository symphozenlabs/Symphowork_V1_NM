import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Layers,
  ListTodo,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { getSessionUser } from "@/modules/identity/auth";
import { EnterpriseJourneyMap } from "@/components/journey/enterprise-journey-map";

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.platformRole && user.platformRole !== "NONE" ? "/platform" : "/app");
  }

  const capabilities = [
    {
      title: "Workforce & People Directory",
      description:
        "Centralized employee directory, lifecycle statuses, structured onboarding checklists, and self-service profile management.",
      icon: UsersRound,
      badge: "Core HR",
    },
    {
      title: "Time & Attendance Engine",
      description:
        "Timezone-aware clock in/out, shift assignments, working-day schedules, break policies, and regularization requests.",
      icon: Clock3,
      badge: "Time Tracking",
    },
    {
      title: "Leave Management",
      description:
        "Balance accruals, holiday calendars, multi-tier approval routing, and status visibility across organization teams.",
      icon: CalendarCheck2,
      badge: "Absence",
    },
    {
      title: "Effective-Dated Payroll",
      description:
        "Salary structures, attendance-linked gross/net calculation, statutory contributions, and immutable finalized payroll runs.",
      icon: Banknote,
      badge: "Compensation",
    },
    {
      title: "Recruitment & ATS Intelligence",
      description:
        "Job requisitions, public job portal, candidate pipelines, interview panels, and evidence-based resume extraction.",
      icon: BriefcaseBusiness,
      badge: "Talent",
    },
    {
      title: "Projects & Task Collaboration",
      description:
        "Tenant-scoped projects, task prioritization, due dates, and direct conversion of team chat discussions into actionable tasks.",
      icon: ListTodo,
      badge: "Execution",
    },
    {
      title: "Internal Organization Chat",
      description:
        "Secure organization-scoped direct messaging and discussion channels integrated with operational workflows.",
      icon: MessageCircle,
      badge: "Communication",
    },
    {
      title: "Reporting & Workforce Analytics",
      description:
        "Department distribution charts, attendance breakdowns, leave utilization, expense totals, and role-governed data exports.",
      icon: BarChart3,
      badge: "Intelligence",
    },
  ];

  const architecturePillars = [
    {
      title: "Strict Tenant Isolation",
      description:
        "Every database query and mutation is partitioned by tenant ID, preventing cross-organization data leakage.",
      icon: Lock,
    },
    {
      title: "Granular RBAC Governance",
      description:
        "Role-based permission sets dictate feature access for administrators, HR specialists, managers, and employees.",
      icon: ShieldCheck,
    },
    {
      title: "Multi-Step Workflow Routing",
      description:
        "Automated step approval pipelines for leave, regularization, expense claims, and payroll sign-offs.",
      icon: Layers,
    },
    {
      title: "Automated Provisioning",
      description:
        "Deterministic pipeline initializing roles, permissions, subscriptions, and administrative invitations.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0D3324] overflow-x-hidden">
      {/* ================================================================ */}
      {/* TOP NAVIGATION BAR (WHITE + GREEN PALETTE MATCHING REFERENCE)     */}
      {/* ================================================================ */}
      <header className="sticky top-0 z-40 w-full border-b border-emerald-100/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-18 max-w-[1600px] items-center justify-between px-3 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-90 rounded-lg shrink-0"
            aria-label="SymphoWork Home"
          >
            <Image
              src="/symphowork-symbol.png"
              alt="SymphoWork Symbol"
              width={30}
              height={30}
              priority
              className="h-7 sm:h-8.5 w-auto object-contain"
            />
            <span className="text-base sm:text-xl font-bold tracking-tight text-[#0D3324]">
              Sympho<span className="text-[#10B981]">Work</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Button asChild variant="ghost" size="sm" className="font-semibold text-xs sm:text-sm px-2 sm:px-3 text-[#0D3324] hover:bg-emerald-50">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="font-bold text-xs sm:text-sm bg-[#10B981] hover:bg-[#059669] text-white shadow-xs rounded-full px-2.5 sm:px-4.5 gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Link href="/register">
                <span>Create account</span>
                <ArrowRight className="size-3 sm:size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ================================================================ */}
        {/* SPLIT HERO SECTION: 35% LEFT HERO (WHITE BG), 65% 3D ADVENTURE   */}
        {/* ================================================================ */}
        <section
          id="journey-map"
          className="relative overflow-hidden border-b border-emerald-100/60 bg-gradient-to-b from-white via-[#F6FAF7] to-white py-6 sm:py-8 lg:py-10"
        >
          {/* Subtle environmental ambient light */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 left-10 size-[500px] rounded-full bg-emerald-100/50 blur-[130px]" />
            <div className="absolute bottom-10 right-10 size-[600px] rounded-full bg-teal-100/40 blur-[140px]" />
          </div>

          <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-center">
              {/* LEFT COLUMN: ~35% OF VIEWPORT (PREDOMINANTLY WHITE / LIGHT NEUTRAL) */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-6 animate-hero-entrance z-10">
                {/* Animated Platform-Status Indicator */}
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-800 shadow-xs backdrop-blur-xs max-w-full">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#10B981]" />
                  </span>
                  <span className="truncate">Platform Operational · All 19 HCM Modules Online</span>
                </div>

                {/* Confident Main Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-[2.9rem] xl:text-[3.4rem] font-extrabold tracking-tight text-[#0D3324] leading-[1.08] break-words">
                  Unified People Operations for Every Stage of{" "}
                  <span className="text-[#10B981]">Your Growth.</span>
                </h1>

                {/* Concise Description of Employee Lifecycle */}
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  From organization genesis and employee onboarding to shift attendance, leave approvals, payroll, and enterprise intelligence — SymphoWork orchestrates your complete workforce lifecycle in one tenant-isolated platform.
                </p>

                {/* Primary & Secondary Call to Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-8 sm:min-w-[160px] justify-center gap-2 text-sm sm:text-base font-semibold bg-[#0D3324] hover:bg-[#174734] text-white shadow-md cursor-pointer"
                  >
                    <Link href="/login">
                      Sign in
                      <ArrowRight className="size-4 text-[#10B981]" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 sm:min-w-[160px] justify-center text-sm sm:text-base font-semibold bg-white hover:bg-slate-50 text-[#0D3324] border-slate-300 shadow-xs cursor-pointer"
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>

                {/* Three Product Benefits with Green Checkmarks */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-medium text-[#174734]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                    <span>Tenant-isolated security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                    <span>Role-based permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#10B981] shrink-0" />
                    <span>Complete employee lifecycle</span>
                  </div>
                </div>

                {/* Verified Product Facts Row */}
                <div className="pt-4 border-t border-slate-200/80 flex items-center gap-5 sm:gap-8 text-xs text-slate-500">
                  <div>
                    <div className="text-xl font-bold text-[#0D3324] tracking-tight">19+</div>
                    <div className="text-[11px] text-slate-500">Integrated Modules</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#0D3324] tracking-tight">100%</div>
                    <div className="text-[11px] text-slate-500">Postgres RLS</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#0D3324] tracking-tight">∞</div>
                    <div className="text-[11px] text-slate-500">Built for Scale</div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ~65% OF VIEWPORT (THE 3D ADVENTURE WORLD) */}
              <div className="lg:col-span-7 xl:col-span-8 relative z-10 w-full">
                <EnterpriseJourneyMap />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* BOTTOM INFORMATION CARDS: COMPREHENSIVE CAPABILITIES (LIGHT BG)  */}
        {/* ================================================================ */}
        <section id="capabilities" className="border-b border-emerald-100/60 py-10 md:py-14 bg-[#F8FAF9]">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  Integrated Capabilities
                </span>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0D3324] sm:text-4xl">
                  Comprehensive tools for modern workforce administration.
                </h2>
                <p className="mt-2 text-base text-slate-600">
                  Each module is natively engineered into SymphoWork with strict tenant scoping and unified RBAC policies.
                </p>
              </div>
            </Reveal>

            <div className="mt-8 sm:mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((cap, index) => {
                const Icon = cap.icon;
                return (
                  <Reveal key={cap.title} delayMs={index * 45}>
                    <Card className="flex h-full flex-col justify-between border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-lg shadow-xs">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Icon className="size-5" />
                          </div>
                          <Badge variant="neutral" className="text-[10px] bg-slate-100 text-slate-700 border-slate-200">
                            {cap.badge}
                          </Badge>
                        </div>
                        <CardTitle className="mt-4 text-base font-bold text-[#0D3324]">
                          {cap.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-xs leading-relaxed text-slate-600">
                          {cap.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* PLATFORM ARCHITECTURE & GOVERNANCE SECTION (LIGHT BG)            */}
        {/* ================================================================ */}
        <section id="architecture" className="border-b border-emerald-100/60 bg-white py-12 md:py-16">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-5">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  Enterprise Architecture
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-[#0D3324] sm:text-4xl">
                  Built on strict security and governance foundations.
                </h2>
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  SymphoWork provides institutional confidence through deterministic tenant isolation,
                  cryptographic session handling, and configurable policy workflows.
                </p>
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <span>Zero Data Cross-Contamination Guarantee</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                {architecturePillars.map((pillar, index) => {
                  const Icon = pillar.icon;
                  return (
                    <Reveal key={pillar.title} delayMs={index * 60}>
                      <div className="h-full rounded-2xl border border-slate-200/80 bg-[#F8FAF9] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/40 shadow-xs">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Icon className="size-5" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-[#0D3324]">
                          {pillar.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {pillar.description}
                        </p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* CLOSING ACTION BANNER (DEEP GREEN BRAND ACCENT BANNER)           */}
        {/* ================================================================ */}
        <section id="governance" className="py-10 md:py-14 px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1400px] rounded-3xl bg-[#0D3324] text-white py-14 px-6 sm:px-12 text-center shadow-xl">
            <div className="mx-auto mb-6 flex items-center justify-center">
              <Image
                src="/symphowork-logo-white.png"
                alt="SymphoWork Logo"
                width={200}
                height={56}
                className="h-14 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
              />
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Ready to unify your workforce operations?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-emerald-200 sm:text-base">
              Onboard your organization to access automated attendance, effective-dated payroll,
              and cross-functional team collaboration in minutes.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-[#10B981] text-white hover:bg-[#059669] shadow-sm font-bold h-13 px-7 cursor-pointer"
              >
                <Link href="/register">
                  Get started with organization onboarding
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white h-13 px-7 cursor-pointer"
              >
                <Link href="/platform/login">Platform console access</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Image
              src="/symphowork-symbol.png"
              alt="SymphoWork Symbol"
              width={36}
              height={36}
              className="h-8.5 w-auto object-contain"
            />
            <div className="text-left border-l border-slate-200 pl-3">
              <p className="text-xs font-bold text-[#0D3324]">SymphoWork HCM</p>
              <p className="text-[11px] text-slate-500">Enterprise People Operations Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
            <Link href="/login" className="transition-colors hover:text-[#10B981]">
              Workspace Login
            </Link>
            <Link href="/platform/login" className="transition-colors hover:text-[#10B981]">
              Platform Console
            </Link>
            <Link href="/register" className="transition-colors hover:text-[#10B981]">
              Register Organization
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} SymphoWork Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
