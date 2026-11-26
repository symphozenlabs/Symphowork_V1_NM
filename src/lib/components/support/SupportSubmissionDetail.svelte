<script lang="ts">
  import type { Snippet } from "svelte";
  import SvgIcon from "$lib/components/ui/Icon.svelte";
  import { queryLabel } from "$lib/client/support-communication";

  export type SupportSubmissionDetailData = {
    submission: {
      id: string;
      subject: string;
      queryType: string;
      description: string;
      createdAt: string | Date;
      submitterName?: string;
      submitterEmail?: string;
      organizationName?: string;
    };
    replies: {
      id: string;
      authorName: string;
      authorSide?: string;
      body: string;
      createdAt: string | Date;
    }[];
    attachments: {
      id: string;
      fileName: string;
      mimeType?: string;
      fileSize?: number;
    }[];
  };

  let {
    mode,
    detail,
    loading = false,
    error = "",
    attachmentBasePath,
    replySection,
  }: {
    mode: "platform" | "staff";
    detail: SupportSubmissionDetailData | null;
    loading?: boolean;
    error?: string;
    attachmentBasePath: string;
    replySection?: Snippet<[SupportSubmissionDetailData]>;
  } = $props();

  const formatDate = (value: string | Date) => new Date(value).toLocaleString();
  const formatBytes = (size?: number) => {
    if (!size || size <= 0) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };
</script>

{#if loading}
  <div role="status" class="flex items-center justify-center gap-2.5 py-10 text-sm text-muted">
    <SvgIcon name="RefreshCw" class="size-4 animate-spin text-primary" />
    <span>Loading submission details…</span>
  </div>
{:else if error}
  <div role="alert" class="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
    <SvgIcon name="AlertCircle" class="size-5 shrink-0 text-danger" />
    <div>
      <p class="font-semibold">Unable to load submission</p>
      <p class="mt-1 text-xs">{error}</p>
    </div>
  </div>
{:else if detail}
  {@const s = detail.submission}
  {@const hasReplies = detail.replies.length > 0}
  <div class="space-y-5">
    <!-- Subject & Status Header -->
    <div class="space-y-2 border-b border-border/70 pb-4">
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
          {queryLabel(s.queryType)}
        </span>
        <span
          class={"inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold " +
            (hasReplies
              ? "border border-emerald-200/70 bg-emerald-50 text-emerald-800"
              : "border border-amber-200/70 bg-amber-50 text-amber-900")}
        >
          {#if mode === "platform"}
            {hasReplies ? "Replied" : "Awaiting first reply"}
          {:else}
            {hasReplies ? "Product team replied" : "Submitted"}
          {/if}
        </span>
        <time class="ml-auto text-xs text-muted tabular-nums">{formatDate(s.createdAt)}</time>
      </div>
      <h3 class="text-lg font-bold text-foreground break-words">{s.subject}</h3>
    </div>

    <!-- Original Customer Submission -->
    <article class="space-y-3 rounded-xl border border-border bg-slate-50/80 p-4">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <span class="text-xs font-bold uppercase tracking-wider text-muted">
          {mode === "platform" ? "Customer submission" : "Your submitted query"}
        </span>
        <time class="text-xs text-muted tabular-nums">{formatDate(s.createdAt)}</time>
      </div>

      {#if mode === "platform" && (s.submitterName || s.organizationName)}
        <div class="space-y-0.5 text-xs text-muted">
          {#if s.submitterName}
            <p>
              <span class="font-semibold text-foreground">Submitter:</span>
              {s.submitterName}
              {#if s.submitterEmail}({s.submitterEmail}){/if}
            </p>
          {/if}
          {#if s.organizationName}
            <p>
              <span class="font-semibold text-foreground">Organization:</span>
              {s.organizationName}
            </p>
          {/if}
        </div>
      {/if}

      <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
        {s.description}
      </p>

      {#if detail.attachments.length > 0}
        <div class="space-y-2 border-t border-border/60 pt-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-muted">Attachments</span>
          <div class="flex flex-wrap gap-2">
            {#each detail.attachments as a (a.id)}
              <a
                class="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-slate-50"
                href={attachmentBasePath + a.id}
              >
                <SvgIcon name="Paperclip" class="size-3.5 text-muted" />
                <span>Download {a.fileName}</span>
                {#if a.fileSize}
                  <span class="text-[11px] font-normal text-muted">({formatBytes(a.fileSize)})</span>
                {/if}
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </article>

    <!-- Private Reply Conversation -->
    <div class="space-y-3">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-muted">
        {mode === "platform" ? "Conversation Thread" : "Private Replies"}
      </h4>

      {#if hasReplies}
        <div class="max-h-72 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {#each detail.replies as r (r.id)}
            <article class="space-y-2 rounded-xl border border-border bg-surface p-4 shadow-2xs">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    {mode === "platform" ? "Platform Support" : "Product Team"}
                  </span>
                  <span class="text-xs font-semibold text-foreground">
                    {mode === "platform" ? `Private reply · ${r.authorName}` : r.authorName}
                  </span>
                </div>
                <time class="text-xs text-muted tabular-nums">{formatDate(r.createdAt)}</time>
              </div>
              <p class="whitespace-pre-wrap break-words pt-1 text-sm leading-relaxed text-foreground">
                {r.body}
              </p>
            </article>
          {/each}
        </div>
      {:else}
        <div class="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
          {mode === "platform"
            ? "No replies sent yet. Use the form below to send a private response."
            : "No replies yet. You will be notified when the product team responds."}
        </div>
      {/if}
    </div>

    {#if replySection}
      {@render replySection(detail)}
    {/if}
  </div>
{/if}
