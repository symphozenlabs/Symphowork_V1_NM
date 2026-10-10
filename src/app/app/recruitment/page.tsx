import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { AtsDashboard } from "@/components/ats/ats-dashboard";
import { AtsInterviewPanel } from "@/components/ats/ats-interview-panel";
import { Sparkles } from "lucide-react";

export default async function RecruitmentPage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Talent Acquisition & ATS
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Requisitions & Pipeline
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Recruitment & Talent Operations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage job requisitions, candidate pipelines, interview workflows, and talent pools with deterministic candidate evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/recruitment/intelligence"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Sparkles className="h-4 w-4" />
            Candidate Intelligence Search
          </Link>
        </div>
      </div>

      {/* Main ATS Operations Dashboard */}
      <AtsDashboard />

      {/* Structured Interview Panel */}
      <div className="pt-2">
        <AtsInterviewPanel />
      </div>
    </div>
  );
}
