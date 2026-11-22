<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import DialogFrame from "$lib/components/ui/DialogFrame.svelte";
import Input from "$lib/components/ui/Input.svelte";
import Button from "$lib/components/ui/Button.svelte";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface MessageToTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: MessageItem | null;
  onTaskCreated: (taskId: string, messageId: string) => void;
}
let {
  open,
  onOpenChange,
  message,
  onTaskCreated,
}:MessageToTaskDialogProps=$props();
const initialTitle=$derived(message?.content?.trim()
    ? message.content.trim().length > 80
      ? `${message.content.trim().slice(0, 77)}…`
      : message.content.trim()
    : "Task from chat");
const initialDescription=$derived(message?.content?.trim() ?? "");
let title=$state(untrack(()=>(initialTitle)));
const setTitle=(next:typeof title|((previous:typeof title)=>typeof title))=>{title=typeof next==="function"?(next as (previous:typeof title)=>typeof title)(title):next;};
let description=$state(untrack(()=>(initialDescription)));
const setDescription=(next:typeof description|((previous:typeof description)=>typeof description))=>{description=typeof next==="function"?(next as (previous:typeof description)=>typeof description)(description):next;};
let projectId=$state(untrack(()=>("")));
const setProjectId=(next:typeof projectId|((previous:typeof projectId)=>typeof projectId))=>{projectId=typeof next==="function"?(next as (previous:typeof projectId)=>typeof projectId)(projectId):next;};
let assigneeEmployeeId=$state(untrack(()=>("")));
const setAssigneeEmployeeId=(next:typeof assigneeEmployeeId|((previous:typeof assigneeEmployeeId)=>typeof assigneeEmployeeId))=>{assigneeEmployeeId=typeof next==="function"?(next as (previous:typeof assigneeEmployeeId)=>typeof assigneeEmployeeId)(assigneeEmployeeId):next;};
let priority=$state<"low" | "medium" | "high" | "urgent">(untrack(()=>("medium")));
const setPriority=(next:typeof priority|((previous:typeof priority)=>typeof priority))=>{priority=typeof next==="function"?(next as (previous:typeof priority)=>typeof priority)(priority):next;};
let dueDate=$state(untrack(()=>("")));
const setDueDate=(next:typeof dueDate|((previous:typeof dueDate)=>typeof dueDate))=>{dueDate=typeof next==="function"?(next as (previous:typeof dueDate)=>typeof dueDate)(dueDate):next;};
let projects=$state<TaskProjectOption[]>(untrack(()=>([])));
const setProjects=(next:typeof projects|((previous:typeof projects)=>typeof projects))=>{projects=typeof next==="function"?(next as (previous:typeof projects)=>typeof projects)(projects):next;};
let assignees=$state<ChatRecipient[]>(untrack(()=>([])));
const setAssignees=(next:typeof assignees|((previous:typeof assignees)=>typeof assignees))=>{assignees=typeof next==="function"?(next as (previous:typeof assignees)=>typeof assignees)(assignees):next;};
let loadingOptions=$state(untrack(()=>(false)));
const setLoadingOptions=(next:typeof loadingOptions|((previous:typeof loadingOptions)=>typeof loadingOptions))=>{loadingOptions=typeof next==="function"?(next as (previous:typeof loadingOptions)=>typeof loadingOptions)(loadingOptions):next;};
let submitting=$state(untrack(()=>(false)));
const setSubmitting=(next:typeof submitting|((previous:typeof submitting)=>typeof submitting))=>{submitting=typeof next==="function"?(next as (previous:typeof submitting)=>typeof submitting)(submitting):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
$effect(()=>{message;return untrack(() => {
    if (message) {
      const rawContent = message.content?.trim() ?? "";
      const suggestedTitle = rawContent.length > 80 ? `${rawContent.slice(0, 77)}…` : rawContent;
      setTitle(suggestedTitle || "Task from chat");
      setDescription(rawContent);
      setProjectId("");
      setAssigneeEmployeeId("");
      setPriority("medium");
      setDueDate("");
      setError(null);
    }
  });});
$effect(()=>{open;return untrack(() => {
    if (!open) return;

    let isCancelled = false;
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [projectsRes, assigneesRes] = await Promise.all([
          fetch("/api/app/projects").then((r) => (r.ok ? r.json() : { projects: [] })),
          fetch("/api/app/chat/recipients").then((r) => (r.ok ? r.json() : { recipients: [] })),
        ]);

        if (!isCancelled) {
          setProjects(projectsRes.projects ?? []);
          setAssignees(assigneesRes.recipients ?? []);
        }
      } catch {
        // Fallback silently if projects endpoint isn't accessible
      } finally {
        if (!isCancelled) setLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      isCancelled = true;
    };
  });});
async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!message) return;
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/app/chat/messages/${message.id}/task`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: projectId || undefined,
          assigneeEmployeeId: assigneeEmployeeId || undefined,
          dueDate: dueDate || undefined,
          priority,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to convert message to task.");
      }

      const taskId = body.task?.id ?? message.id;
      onTaskCreated(taskId, message.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not convert message to task.");
    } finally {
      setSubmitting(false);
    }
  }

import type { TaskProjectOption, MessageItem, ChatRecipient } from '$lib/components/chat/types';</script>
{#if !message}{:else}<DialogFrame open={open} onOpenChange={onOpenChange}>
      
        
        <div class="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div class="flex items-center gap-2.5">
              <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SvgIcon name="Briefcase" class="size-5" />
              </div>
              <div>
                <h2 class="text-base font-bold text-slate-900">
                  Create Task from Message
                </h2>
                <p class="text-xs text-slate-500">
                  Turn this conversation message into a trackable project task.
                </p>
              </div>
            </div>

            
              <button type="button" onclick={() => onOpenChange(false)} class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Close dialog">
                <SvgIcon name="X" class="size-4" />
              </button>
            
          </div>

          <form onsubmit={handleSubmit} class="mt-4 space-y-3.5">
            
            <div>
              <label for="task-title" class="block text-xs font-semibold text-slate-700 mb-1">
                Task Title *
              </label>
              <Input id="task-title" required maxlength={180} placeholder="Task title" value={title} onchange={(e) => setTitle(e.currentTarget.value)} class="text-xs h-10" />
            </div>

            
            <div>
              <label for="task-description" class="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea id="task-description" rows={3} placeholder="Task details and context…" value={description} onchange={(e) => setDescription(e.currentTarget.value)} class="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
            </div>

            
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="task-project" class="block text-xs font-semibold text-slate-700 mb-1">
                  Project
                </label>
                <select id="task-project" value={projectId} onchange={(e) => setProjectId(e.currentTarget.value)} disabled={loadingOptions} class="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">No Project</option>
                  {#each projects as p}<option value={p.id}>
                      {p.name}
                    </option>{/each}
                </select>
              </div>

              <div>
                <label for="task-assignee" class="block text-xs font-semibold text-slate-700 mb-1">
                  Assignee
                </label>
                <select id="task-assignee" value={assigneeEmployeeId} onchange={(e) => setAssigneeEmployeeId(e.currentTarget.value)} disabled={loadingOptions} class="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Unassigned</option>
                  {#each assignees as a}<option value={a.id}>
                      {a.displayName}
                    </option>{/each}
                </select>
              </div>
            </div>

            
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="task-priority" class="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select id="task-priority" value={priority} onchange={(e) => setPriority(e.currentTarget.value as typeof priority)} class="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label for="task-due-date" class="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <Input id="task-due-date" type="date" value={dueDate} onchange={(e) => setDueDate(e.currentTarget.value)} class="text-xs h-10" />
              </div>
            </div>

            
            {#if error}<div class="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-2.5 text-xs text-danger">
                <SvgIcon name="AlertCircle" class="size-4 shrink-0" />
                <span>{error}</span>
              </div>{/if}

            
            <div class="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" size="sm" onclick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submitting || !title.trim()} class="gap-1.5">
                {#if submitting}
                    <SvgIcon name="Loader2" class="size-3.5 animate-spin" />
                    <span>Creating Task…</span>
                  {:else}
                    <SvgIcon name="CheckCircle2" class="size-3.5" />
                    <span>Create Task</span>
                  {/if}
              </Button>
            </div>
          </form>
        </div>
      
    </DialogFrame>{/if}
