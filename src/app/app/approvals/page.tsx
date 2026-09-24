import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApprovalInbox } from "@/components/approvals/approval-inbox";

export default async function ApprovalsPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Approval inbox</Badge><h1 className="mt-3 text-3xl font-bold">Requests waiting for you</h1><p className="mt-2 text-sm text-muted">Every action is recorded in the workflow history.</p></div><Card><CardHeader><CardTitle>My approval tasks</CardTitle></CardHeader><CardContent><ApprovalInbox /></CardContent></Card></div>; }
