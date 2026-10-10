import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { RecruiterIntelligenceSearch } from "@/components/ats/recruiter-intelligence-search";
import { ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";

export default async function RecruiterIntelligencePage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          href="/app/recruitment"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Recruitment Operations
        </Link>
      </div>

      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              Recruiter Intelligence
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Evidence-Based Ranking
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Candidate Intelligence Search
          </h1>
          <p className="mt-1 text-sm text-muted">
            Interpret recruiter intent, apply transparent semantic filters, and inspect verifiable resume evidence behind every matched result.
          </p>
        </div>
      </div>

      {/* Intelligence Search Tool */}
      <RecruiterIntelligenceSearch />
    </div>
  );
}
