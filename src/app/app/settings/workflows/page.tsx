import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowSettings } from "@/components/workflows/workflow-settings";

export default async function WorkflowSettingsPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Workflow settings</Badge><h1 className="mt-3 text-3xl font-bold">Configure approvals</h1><p className="mt-2 text-sm text-muted">Create a versioned sequential workflow for leave and attendance regularization.</p></div><Card><CardHeader><CardTitle>Organization workflows</CardTitle></CardHeader><CardContent><WorkflowSettings /></CardContent></Card></div>; }
