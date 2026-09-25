import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { RecruiterIntelligenceSearch } from "@/components/ats/recruiter-intelligence-search";

export default async function RecruiterIntelligencePage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Recruiter intelligence</Badge><h1 className="mt-3 text-3xl font-bold">Search by evidence, not opaque scores</h1><p className="mt-2 text-sm text-muted">Interpret recruiter intent, apply transparent filters, and inspect the evidence behind every result.</p></div><RecruiterIntelligenceSearch /></div>; }
