import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { ReportDashboard } from "@/components/reports/report-dashboard";
export default async function ReportsPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Reports</Badge><h1 className="mt-3 text-3xl font-bold">Operational reporting</h1><p className="mt-2 text-sm text-muted">Tenant-scoped workforce, operations, recruitment, projects, and permission-controlled payroll metrics.</p></div><ReportDashboard /></div>; }
