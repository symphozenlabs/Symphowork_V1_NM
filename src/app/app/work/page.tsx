import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { Badge } from "@/components/ui/badge";
import { CollaborationWorkspace } from "@/components/collaboration/workspace";
export default async function WorkPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Work</Badge><h1 className="mt-3 text-3xl font-bold">Projects and tasks</h1><p className="mt-2 text-sm text-muted">Coordinate projects, assignments, due dates, and team work from one tenant-scoped workspace.</p></div><CollaborationWorkspace /></div>; }
