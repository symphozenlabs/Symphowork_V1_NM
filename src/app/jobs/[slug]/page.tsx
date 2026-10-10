import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Clock, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { publicJobBySlug } from "@/modules/ats/service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { job } = await publicJobBySlug((await params).slug);
    return { title: `${job.publicTitle} | SymphoWork Careers`, description: job.publicDescription.slice(0, 160) };
  } catch {
    return { title: "Job Opportunity | SymphoWork Careers" };
  }
}

export default async function PublicJobPage({ params }: { params: Promise<{ slug: string }> }) {
  let result;
  try {
    result = await publicJobBySlug((await params).slug);
  } catch {
    notFound();
  }
  const { job } = result;

  return (
    <div className="min-h-screen bg-background">
      {/* Public job board header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 px-5 backdrop-blur-md md:px-8">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity hover:opacity-90"
            aria-label="SymphoWork Home"
          >
            <Image
              src="/symphowork-logo.png"
              alt="SymphoWork"
              width={160}
              height={42}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-sidebar-active px-3 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
              Careers
            </span>
            <Link
              href="/login"
              className="text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              Employee Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main job article */}
      <main className="px-5 py-10 md:py-14">
        <article className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-[0_4px_24px_rgba(11,25,48,0.03)]">
          <header className="border-b border-border pb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <span>SymphoWork Opportunities</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {job.publicTitle}
            </h1>

            {/* Badges row */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm">
              <Badge variant="neutral" className="gap-1.5 py-1 px-3">
                <MapPin className="size-3.5 text-muted" aria-hidden="true" />
                <span>{job.location ?? "Location flexible"}</span>
              </Badge>
              <Badge variant="neutral" className="gap-1.5 py-1 px-3">
                <Briefcase className="size-3.5 text-muted" aria-hidden="true" />
                <span>{job.workMode ?? "Work mode to be confirmed"}</span>
              </Badge>
              <Badge variant="neutral" className="gap-1.5 py-1 px-3">
                <Clock className="size-3.5 text-muted" aria-hidden="true" />
                <span>{job.employmentType ?? "Full-time"}</span>
              </Badge>
            </div>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">About the role</h2>
            <div className="whitespace-pre-wrap leading-relaxed text-muted text-sm sm:text-base">
              {job.publicDescription}
            </div>
          </section>

          {job.responsibilities && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">Responsibilities</h2>
              <div className="whitespace-pre-wrap leading-relaxed text-muted text-sm sm:text-base">
                {job.responsibilities}
              </div>
            </section>
          )}

          {job.qualifications && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">Qualifications</h2>
              <div className="whitespace-pre-wrap leading-relaxed text-muted text-sm sm:text-base">
                {job.qualifications}
              </div>
            </section>
          )}

          {/* Closing apply section */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Ready to join our team?</p>
              <p className="text-xs text-muted">No account required. Application takes about 2 minutes.</p>
            </div>
            <Link
              href={`/jobs/${job.slug}/apply`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-xs transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Apply for this role</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-muted">
        <p>© {new Date().getFullYear()} SymphoWork Inc. All applications are processed securely.</p>
      </footer>
    </div>
  );
}
