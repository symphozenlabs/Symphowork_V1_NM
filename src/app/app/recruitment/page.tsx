import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { AtsDashboard } from "@/components/ats/ats-dashboard";
export default async function RecruitmentPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>ATS core</Badge><h1 className="mt-3 text-3xl font-bold">Recruiter dashboard</h1><p className="mt-2 text-sm text-muted">Manage requisitions, candidates, jobs, applications, interviews, and talent pools from one operational workspace.</p></div><AtsDashboard /></div>; }
