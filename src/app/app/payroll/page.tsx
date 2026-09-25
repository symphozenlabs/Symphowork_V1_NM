import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { PayrollDashboard } from "@/components/payroll/payroll-dashboard";
export default async function PayrollPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Payroll</Badge><h1 className="mt-3 text-3xl font-bold">Payroll operations</h1><p className="mt-2 text-sm text-muted">Effective-dated salary structures, attendance-aware calculation, statutory configuration, approvals, and finalization.</p></div><PayrollDashboard /></div>; }
