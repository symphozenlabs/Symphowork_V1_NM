<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import ChatWorkspace from "$lib/components/chat/ChatWorkspace.svelte";

</script>
<div class="space-y-6">
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Internal Communication
            </span>
            <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              Direct & Team Channels
            </span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Team Messaging & Channels
          </h1>
          <p class="mt-1 text-sm text-muted">
            Communicate with people in your organization in real time, coordinate operations, and seamlessly turn conversation items into tasks.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a href="/app/work" class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-slate-50">
            <SvgIcon name="Briefcase" class="h-4 w-4 text-primary" />
            Projects & Task Board
          </a>
        </div>
      </div>

      
      <ChatWorkspace />
    </div>
