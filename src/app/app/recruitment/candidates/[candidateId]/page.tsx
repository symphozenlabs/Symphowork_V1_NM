import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeIntelligencePanel } from "@/components/ats/resume-intelligence-panel";
export default async function CandidateResumePage({ params }: { params: Promise<{ candidateId: string }> }) { if (!(await getSessionUser())) redirect("/login"); const { candidateId } = await params; return <div className="space-y-6"><div><Badge>Resume intelligence</Badge><h1 className="mt-3 text-3xl font-bold">Candidate profile enrichment</h1><p className="mt-2 text-sm text-muted">Review deterministic extraction results, provenance, confidence, and processing failures before confirming profile data.</p></div><Card><CardHeader><CardTitle>Resume processing</CardTitle></CardHeader><CardContent><ResumeIntelligencePanel candidateId={candidateId} /></CardContent></Card></div>; }
