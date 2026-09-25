import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CollaborationWorkspace } from "@/components/collaboration/workspace";
import { getSessionUser } from "@/modules/identity/auth";

export default async function ChatPage() { if (!(await getSessionUser())) redirect("/login"); return <div className="space-y-6"><div><Badge>Internal collaboration</Badge><h1 className="mt-3 text-3xl font-bold">Chat</h1><p className="mt-2 text-sm text-muted">Message people in your organization and turn useful conversations into work.</p></div><CollaborationWorkspace initialView="chat" /></div>; }
