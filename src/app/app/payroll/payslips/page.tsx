import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { PayslipList } from "@/components/payroll/payslip-list";
export default async function PayslipsPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Self service</Badge><h1 className="mt-3 text-3xl font-bold">My payslips</h1><p className="mt-2 text-sm text-muted">Only finalized payslips for your employee account are shown.</p></div><PayslipList /></div>; }
