import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveApplicationForm } from "@/components/leave/leave-application-form";

export default async function LeavePage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Leave management</Badge><h1 className="mt-3 text-3xl font-bold">Request time away</h1><p className="mt-2 text-sm text-muted">Requests reserve available balance until the configured approval workflow completes.</p></div><Card><CardHeader><CardTitle>New leave request</CardTitle></CardHeader><CardContent><LeaveApplicationForm /></CardContent></Card></div>; }
