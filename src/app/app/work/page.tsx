import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { CollaborationWorkspace } from "@/components/collaboration/workspace";
import { MessageSquare } from "lucide-react";

export default async function WorkPage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Project & Task Collaboration
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Milestones & Delivery
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Projects & Task Management
          </h1>
          <p className="mt-1 text-sm text-muted">
            Coordinate cross-functional projects, individual assignments, status transitions, and team deliverables from one unified workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/chat"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            Team Chat & Messages
          </Link>
        </div>
      </div>

      {/* Collaboration Workspace Component */}
      <CollaborationWorkspace initialView="work" />
    </div>
  );
}
