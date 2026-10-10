import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeIntelligencePanel } from "@/components/ats/resume-intelligence-panel";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";

export default async function CandidateResumePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  if (!(await getSessionUser())) redirect("/login");
  const { candidateId } = await params;

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
              Resume Intelligence
            </span>
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              ID: {candidateId}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Candidate Profile Enrichment
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review deterministic extraction results, provenance, confidence scores, and raw resume facts before confirming profile changes.
          </p>
        </div>
      </div>

      {/* Main Enrichment Card */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Deterministic Resume Processing & Facts
              </CardTitle>
              <p className="text-xs text-muted">
                Extracted skills, employment history, certifications, and validation checkpoints
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResumeIntelligencePanel candidateId={candidateId} />
        </CardContent>
      </Card>
    </div>
  );
}
