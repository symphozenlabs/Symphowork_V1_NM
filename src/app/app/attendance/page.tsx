import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceActions } from "@/components/attendance/attendance-actions";

export default async function AttendancePage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Attendance</Badge><h1 className="mt-3 text-3xl font-bold">Today’s attendance</h1><p className="mt-2 text-sm text-muted">Punches are recorded against your assigned shift and organization timezone.</p></div><div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]"><Card><CardHeader><CardTitle>Time clock</CardTitle></CardHeader><CardContent><AttendanceActions /></CardContent></Card><Card><CardHeader><CardTitle>Recent records</CardTitle></CardHeader><CardContent><div id="attendance-history" className="text-sm text-muted">Loading your attendance history…</div></CardContent></Card></div></div>; }
