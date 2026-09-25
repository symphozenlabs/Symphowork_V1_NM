import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceActions } from "@/components/attendance/attendance-actions";
import { RegularizationPanel } from "@/components/attendance/regularization-panel";

export default async function AttendancePage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Attendance</Badge><h1 className="mt-3 text-3xl font-bold">Attendance and time clock</h1><p className="mt-2 text-sm text-muted">Punches use your organization timezone, assigned shift, working days, and holiday rules.</p></div><Card><CardHeader><CardTitle>My attendance</CardTitle></CardHeader><CardContent><AttendanceActions /></CardContent></Card><RegularizationPanel /></div>; }
