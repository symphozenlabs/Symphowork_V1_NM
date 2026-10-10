import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/modules/identity/auth";
import { CollaborationWorkspace } from "@/components/collaboration/workspace";
import { Briefcase } from "lucide-react";

export default async function ChatPage() {
  if (!(await getSessionUser())) redirect("/login");

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Internal Communication
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Direct & Team Channels
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Team Messaging & Channels
          </h1>
          <p className="mt-1 text-sm text-muted">
            Communicate with people in your organization in real time, coordinate operations, and seamlessly turn conversation items into tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/work"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50"
          >
            <Briefcase className="h-4 w-4 text-primary" />
            Projects & Task Board
          </Link>
        </div>
      </div>

      {/* Collaboration Workspace Chat View */}
      <CollaborationWorkspace initialView="chat" />
    </div>
  );
}
