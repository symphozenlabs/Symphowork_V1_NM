import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const reports = ["HR", "Attendance", "Leave", "Expenses", "Payroll", "Recruitment", "Projects", "Tasks"];
export default async function ReportsPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Reports</Badge><h1 className="mt-3 text-3xl font-bold">Operational reporting</h1><p className="mt-2 text-sm text-muted">Organization-scoped reports with server-side filters and permission-aware exports.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{reports.map((report) => <Card key={report}><CardHeader><CardTitle>{report}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted">Run a permission-controlled {report.toLowerCase()} report from the reporting API.</p></CardContent></Card>)}</div></div>; }
