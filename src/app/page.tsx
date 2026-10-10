import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg shrink-0"
            aria-label="SymphoWork Home"
          >
            <Image
              src="/symphowork-symbol.png"
              alt="SymphoWork Symbol"
              width={34}
              height={34}
              priority
              className="h-8 sm:h-9.5 w-auto object-contain"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#0D3324]">
              Sympho<span className="text-[#174734]">Work</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <a
              href="#capabilities"
              className="text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              Capabilities
            </a>
            <a
              href="#architecture"
              className="text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              Platform Architecture
            </a>
            <a
              href="#governance"
              className="text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              Security & Governance
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="font-semibold text-foreground hover:bg-slate-100">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="font-semibold shadow-xs">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-surface via-background to-background py-10 sm:py-14 lg:py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
              {/* Hero Left: Headline, Value Proposition, and Primary Actions */}
              <div className="space-y-5 lg:col-span-7 animate-hero-entrance">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                  <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>SymphoWork Enterprise HCM Platform</span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-5xl xl:text-6xl leading-[1.12]">
                  Unified people operations, payroll, and workforce governance.
                </h1>

                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                  SymphoWork integrates core employee lifecycles, timezone-aware attendance,
                  effective-dated payroll calculation, candidate pipelines, and tenant collaboration
                  into a unified, multi-tenant platform.
                </p>

                {/* Clear, balanced primary & secondary CTAs (No repetitive duplicates) */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <Button asChild size="lg" className="h-12 px-6 gap-2 text-sm font-semibold shadow-xs">
                    <Link href="/login">
                      Sign in to workspace
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg" className="h-12 px-6 text-sm font-semibold border border-border">
                    <Link href="/register">Create organization account</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-5 pt-3 text-xs font-medium text-muted">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700" />
                    <span>Tenant-isolated security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700" />
                    <span>Role-based permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-700" />
                    <span>Multi-step approval engine</span>
                  </div>
                </div>
              </div>

              {/* Hero Right Visual: Distinctive Architectural Inspector (No duplicate login button) */}
              <div className="lg:col-span-5 animate-hero-entrance">
                <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 sm:p-7 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  {/* Inspector Header */}
                  <div className="flex items-center justify-between border-b border-border/70 pb-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/symphowork-symbol.png"
                        alt="SymphoWork Symbol"
                        width={36}
                        height={36}
                        className="h-9 w-auto object-contain"
                      />
                      <div>
                        <h2 className="text-sm font-bold text-primary">SymphoWork HCM</h2>
                        <p className="text-[11px] text-muted">Platform Architecture</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                      <Activity className="size-3 text-emerald-700" />
                      <span>Cluster Active</span>
                    </span>
                  </div>

                  {/* Inspector Content: Architectural Metrics and Real Modules */}
                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl border border-border/80 bg-background/80 p-3.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted">
                        <span>Unified Operating Engine</span>
                        <span className="font-mono text-primary font-bold">8 Native Modules</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 rounded-lg bg-surface p-2 font-medium text-foreground border border-border/50">
                          <UsersRound className="size-3.5 text-primary" />
                          <span>Workforce</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-surface p-2 font-medium text-foreground border border-border/50">
                          <Clock3 className="size-3.5 text-primary" />
                          <span>Attendance</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-surface p-2 font-medium text-foreground border border-border/50">
                          <Banknote className="size-3.5 text-primary" />
                          <span>Payroll</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-surface p-2 font-medium text-foreground border border-border/50">
                          <BriefcaseBusiness className="size-3.5 text-primary" />
                          <span>Recruitment</span>
                        </div>
                      </div>
                    </div>

                    {/* Platform Governance Highlights (Truthful capability summary instead of redundant button) */}
                    <div className="rounded-xl border border-border/80 bg-surface p-4 text-xs text-muted">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>Governance & Isolation</span>
                        <span className="text-[11px] text-emerald-700 font-bold">Postgres RLS</span>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-[11.5px]">
                        Multi-tenant partition enforcement ensures strict boundary isolation across all organization entities, compensation calculations, and audit ledgers.
                      </p>
                      <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
                        <span className="font-medium text-muted">Deterministic RBAC</span>
                        <a
                          href="#capabilities"
                          className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Explore capabilities
                          <ArrowRight className="size-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Capabilities Section */}
        <section id="capabilities" className="border-b border-border py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Integrated Capabilities
                </span>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  Comprehensive tools for modern workforce administration.
                </h2>
                <p className="mt-2 text-base text-muted">
                  Each module is natively engineered into SymphoWork with strict tenant scoping and unified RBAC policies.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map((cap, index) => {
                const Icon = cap.icon;
                return (
                  <Reveal key={cap.title} delayMs={index * 50}>
                    <Card className="flex h-full flex-col justify-between border-border/80 bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </div>
                          <Badge variant="neutral" className="text-[10px]">
                            {cap.badge}
                          </Badge>
                        </div>
                        <CardTitle className="mt-4 text-base font-bold text-foreground">
                          {cap.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-xs leading-relaxed text-muted">
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

        {/* Platform Architecture & Governance Section */}
        <section id="architecture" className="border-b border-border bg-surface py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-12">
              {/* Architecture narrative */}
              <div className="space-y-4 lg:col-span-5">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Enterprise Architecture
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  Built on strict security and governance foundations.
                </h2>
                <p className="text-sm leading-relaxed text-muted sm:text-base">
                  SymphoWork provides institutional confidence through deterministic tenant isolation,
                  cryptographic session handling, and configurable policy workflows.
                </p>
                {/* Purposeful architecture anchor instead of repeated login button */}
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-sidebar-active px-3.5 py-2 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Zero Data Cross-Contamination Guarantee</span>
                  </div>
                </div>
              </div>

              {/* Architecture pillars cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                {architecturePillars.map((pillar, index) => {
                  const Icon = pillar.icon;
                  return (
                    <Reveal key={pillar.title} delayMs={index * 60}>
                      <div className="h-full rounded-2xl border border-border/80 bg-background p-6 transition-colors hover:border-primary/40 shadow-xs">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                          <Icon className="size-5" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-foreground">
                          {pillar.title}
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-muted">
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

        {/* Closing Action Banner */}
        <section id="governance" className="bg-primary text-white py-14 md:py-18">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto mb-6 flex items-center justify-center">
              <Image
                src="/symphowork-logo-white.png"
                alt="SymphoWork Logo"
                width={200}
                height={56}
                className="h-16 w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
              />
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to unify your workforce operations?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#A3B899] sm:text-base">
              Onboard your organization to access automated attendance, effective-dated payroll,
              and cross-functional team collaboration in minutes.
            </p>

            {/* Purposeful closing CTAs: Onboarding primary, Console secondary */}
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-[#F0F4ED] shadow-sm font-semibold h-12 px-6"
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
                className="border-white/30 text-white hover:bg-white/10 hover:text-white h-12 px-6"
              >
                <Link href="/platform/login">Platform console access</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/symphowork-symbol.png"
              alt="SymphoWork Symbol"
              width={36}
              height={36}
              className="h-8.5 w-auto object-contain"
            />
            <div className="text-left border-l border-border/80 pl-3">
              <p className="text-xs font-bold text-primary">SymphoWork HCM</p>
              <p className="text-[11px] text-muted">Enterprise People Operations Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
            <Link href="/login" className="transition-colors hover:text-primary">
              Workspace Login
            </Link>
            <Link href="/platform/login" className="transition-colors hover:text-primary">
              Platform Console
            </Link>
            <Link href="/register" className="transition-colors hover:text-primary">
              Register Organization
            </Link>
          </div>

          <p className="text-xs text-muted">
            © {new Date().getFullYear()} SymphoWork Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

