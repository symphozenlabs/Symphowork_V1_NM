<script lang="ts">
  import { untrack } from "svelte";
  import { goto, invalidate, pushState } from "$app/navigation";
  import { navigating, page as routePage } from "$app/state";
  import AudienceComposer from "$lib/components/platform/AudienceComposer.svelte";
  import SupportSubmissionDetail, {
    type SupportSubmissionDetailData,
  } from "$lib/components/support/SupportSubmissionDetail.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import SvgIcon from "$lib/components/ui/Icon.svelte";
  import { notify } from "$lib/client/toast";
  import { supportRequest, queryTypes } from "$lib/client/support-communication";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const root = "/platform/support";
  const tabs = [
    { id: "inbox", label: "Inbox" },
    { id: "announcements", label: "Announcements" },
    { id: "history", label: "Communication History" },
  ];
  const audiences: Record<string, string> = {
    all_organizations: "All organizations",
    selected_organizations: "Selected organizations",
    organization_all_members: "One organization · all eligible members",
    organization_selected_members: "One organization · selected members",
  };

  let composer = $state(false);
  let body = $state("");
  let replying = $state(false);
  let replyError = $state("");
  let refreshing = $state(false);
  let problem = $state("");
  let message = $state("");
  let recipientId = $state("");
  let recipientLoading = $state(false);
  let recipientError = $state("");
  let recipients = $state<{ fullName: string; email: string; organizationName: string }[]>([]);

  let detailModalOpen = $state(Boolean(untrack(() => data.detail)));
  let activeDetail = $state<SupportSubmissionDetailData | null>(
    untrack(() => (data.detail as SupportSubmissionDetailData | null) ?? null)
  );
  let detailLoading = $state(false);
  let detailError = $state("");
  let detailSeq = 0;

  async function fetchSubmissionDetail(id: string) {
    const seq = ++detailSeq;
    detailLoading = true;
    detailError = "";
    try {
      const result = (await supportRequest(
        "/api/platform/support/submissions/" + encodeURIComponent(id)
      )) as SupportSubmissionDetailData;
      if (seq !== detailSeq) return;
      activeDetail = result;
    } catch (cause) {
      if (seq !== detailSeq) return;
      activeDetail = null;
      detailError = (cause as Error).message || "Unable to load submission details.";
    } finally {
      if (seq === detailSeq) detailLoading = false;
    }
  }

  function syncFromLocation() {
    if (typeof window === "undefined") return;
    const urlSubmissionId = new URLSearchParams(window.location.search).get("submission");
    if (!urlSubmissionId) {
      detailModalOpen = false;
      activeDetail = null;
      detailError = "";
      body = "";
      replyError = "";
      return;
    }
    detailModalOpen = true;
    const serverDetail = data.detail as SupportSubmissionDetailData | null;
    if (serverDetail && serverDetail.submission.id === urlSubmissionId) {
      activeDetail = serverDetail;
      detailError = "";
      detailLoading = false;
    } else if (activeDetail?.submission.id !== urlSubmissionId) {
      void fetchSubmissionDetail(urlSubmissionId);
    }
  }

  $effect(() => {
    const serverDetail = data.detail as SupportSubmissionDetailData | null;
    const urlSubmissionId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("submission")
        : routePage.url.searchParams.get("submission");
    untrack(() => {
      if (urlSubmissionId && serverDetail && serverDetail.submission.id === urlSubmissionId) {
        activeDetail = serverDetail;
        detailError = "";
        detailLoading = false;
        detailModalOpen = true;
      }
    });
  });

  const history = $derived(
    [
      ...(data.inbox?.rows ?? []).flatMap((s) => [
        {
          id: s.id,
          title: s.subject,
          kind: "Submission",
          date: s.createdAt,
          href: inboxUrl({ submission: s.id }),
          submissionId: s.id,
          context: s.organizationName,
          queryType: s.queryTypeLabel,
        },
        ...s.historyReplies.map((r) => ({
          id: s.id,
          title: s.subject,
          kind: "Private reply",
          date: r.createdAt,
          href: inboxUrl({ submission: s.id }),
          submissionId: s.id,
          context: s.organizationName,
          queryType: s.queryTypeLabel,
        })),
      ]),
      ...data.announcements.map((a) => ({
        id: a.id,
        title: a.title,
        kind: "Announcement published",
        date: a.publishedAt,
        href: root + "?tab=announcements#" + a.id,
        submissionId: null as string | null,
        context: `${a.recipientCount} recipient${a.recipientCount === 1 ? "" : "s"}`,
        queryType: audiences[a.audienceType] ?? a.audienceType,
      })),
    ].sort((a, b) => +new Date(b.date) - +new Date(a.date))
  );

  function inboxUrl(options: { page?: number; submission?: string | null } = {}) {
    const params = new URLSearchParams();
    if (data.tab === "history") params.set("tab", "history");
    if (data.q) params.set("q", data.q);
    if (data.queryType) params.set("type", data.queryType);
    if (data.organization) params.set("organization", data.organization);
    if (data.status) params.set("status", data.status);
    const page = options.page ?? data.inbox?.page ?? 1;
    if (page > 1) params.set("page", String(page));
    if (options.submission) params.set("submission", options.submission);
    return root + (params.size ? "?" + params.toString() : "");
  }

  function openSubmission(event: MouseEvent, id: string) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    body = "";
    replyError = "";
    detailError = "";
    activeDetail = null;
    detailModalOpen = true;
    pushState(inboxUrl({ submission: id }), {});
    void fetchSubmissionDetail(id);
  }

  function closeSubmissionModal() {
    detailModalOpen = false;
    detailError = "";
    replyError = "";
    body = "";
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("submission")) {
      pushState(inboxUrl({ submission: null }), {});
    }
  }

  function filter(event: SubmitEvent) {
    event.preventDefault();
    const values = new FormData(event.currentTarget as HTMLFormElement);
    const params = new URLSearchParams();
    if (data.tab === "history") params.set("tab", "history");
    for (const [key, value] of values) {
      if (typeof value === "string" && value.trim()) {
        params.set(key, value.trim());
      }
    }
    void goto(root + (params.size ? "?" + params.toString() : ""), {
      keepFocus: true,
      noScroll: true,
    });
  }

  async function refresh() {
    refreshing = true;
    problem = "";
    try {
      await invalidate("support:workspace");
    } catch (cause) {
      problem = (cause as Error).message;
    } finally {
      refreshing = false;
    }
  }

  async function reply(event: SubmitEvent) {
    event.preventDefault();
    const submissionId = activeDetail?.submission.id;
    if (!submissionId || replying || !body.trim()) return;
    replying = true;
    replyError = "";
    problem = "";
    try {
      await supportRequest("/api/platform/support/submissions/" + submissionId, {
        body,
      });
      body = "";
      notify("Private reply sent.", "success");
      await Promise.all([
        fetchSubmissionDetail(submissionId),
        invalidate("support:workspace"),
      ]);
    } catch (cause) {
      replyError = (cause as Error).message || "Failed to send private reply.";
    } finally {
      replying = false;
    }
  }

  async function showRecipients(id: string) {
    if (recipientId === id) {
      recipientId = "";
      return;
    }
    recipientId = id;
    recipientLoading = true;
    recipientError = "";
    recipients = [];
    try {
      const rows: typeof recipients = await supportRequest(
        "/api/platform/support/announcements/" + id + "/recipients"
      );
      if (recipientId === id) recipients = rows;
    } catch (cause) {
      if (recipientId === id) recipientError = (cause as Error).message;
    } finally {
      if (recipientId === id) recipientLoading = false;
    }
  }

  const date = (value: string | Date) => new Date(value).toLocaleString();
</script>

<svelte:window onpopstate={syncFromLocation} />

<svelte:head>
  <title>Customer Support · SymphoWork</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Support Operations
        </span>
      </div>
      <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Customer Support
      </h1>
      <p class="mt-1 max-w-3xl text-sm text-muted">
        Manage customer queries, private conversations, product feedback, and organization-wide announcements from one workspace.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-2xs hover:bg-[#F0F4ED] hover:border-accent/40 active:scale-[0.99] disabled:opacity-50 cursor-pointer transition-colors"
        onclick={refresh}
        disabled={refreshing}
      >
        <SvgIcon name="RefreshCw" class={"size-4 " + (refreshing ? "animate-spin text-primary" : "")} />
        <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
      </button>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary active:scale-[0.99] disabled:opacity-50 cursor-pointer transition-all"
        onclick={() => (composer = true)}
      >
        <SvgIcon name="Plus" class="size-4" />
        <span>New Announcement</span>
      </button>
    </div>
  </div>

  <!-- Support Statistics -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div class="rounded-xl border border-border/80 bg-surface p-5 shadow-xs">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted">Total Submissions</span>
        <span class="rounded-lg bg-slate-100 p-2 text-slate-600">
          <SvgIcon name="LifeBuoy" class="size-4" />
        </span>
      </div>
      <p class="mt-3 text-3xl font-bold tabular-nums text-foreground">{data.stats.total}</p>
      <p class="mt-1 text-xs text-muted">All customer queries received</p>
    </div>

    <div class="rounded-xl border border-border/80 bg-surface p-5 shadow-xs">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-amber-700">Open / Awaiting Response</span>
        <span class="rounded-lg bg-amber-50 p-2 text-amber-600">
          <SvgIcon name="Clock" class="size-4" />
        </span>
      </div>
      <p class="mt-3 text-3xl font-bold tabular-nums text-amber-900">{data.stats.awaiting}</p>
      <p class="mt-1 text-xs text-amber-700/80">Pending platform support response</p>
    </div>

    <div class="rounded-xl border border-border/80 bg-surface p-5 shadow-xs">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-emerald-700">Replied</span>
        <span class="rounded-lg bg-emerald-50 p-2 text-emerald-600">
          <SvgIcon name="Check" class="size-4" />
        </span>
      </div>
      <p class="mt-3 text-3xl font-bold tabular-nums text-emerald-900">{data.stats.replied}</p>
      <p class="mt-1 text-xs text-emerald-700/80">Submissions with private replies</p>
    </div>
  </div>

  <!-- Main Navigation Tabs -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-b border-border">
    <nav aria-label="Support workspace" class="flex items-center gap-6">
      {#each tabs as tab}
        <a
          href={tab.id === "inbox" ? root : root + "?tab=" + tab.id}
          aria-current={data.tab === tab.id ? "page" : undefined}
          class={"relative pb-3 text-sm font-semibold transition-colors " +
            (data.tab === tab.id
              ? "text-primary border-b-2 border-primary"
              : "text-muted hover:text-foreground border-b-2 border-transparent")}
        >
          {tab.label}
          {#if tab.id === "inbox" && data.stats.awaiting > 0}
            <span aria-hidden="true" class="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
              {data.stats.awaiting}
            </span>
          {/if}
        </a>
      {/each}
    </nav>

    {#if data.troubleshooting}
      <a
        href={root + "/troubleshooting"}
        class="inline-flex items-center gap-1.5 pb-3 text-xs font-medium text-muted hover:text-primary transition-colors"
      >
        <SvgIcon name="Building2" class="size-3.5" />
        <span>Organization troubleshooting</span>
      </a>
    {/if}
  </div>

  <!-- Problem or Status Feedback -->
  {#if problem}
    <div role="alert" class="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
      <SvgIcon name="AlertCircle" class="size-5 shrink-0 text-danger" />
      <p>{problem}</p>
    </div>
  {/if}

  {#if message}
    <div role="status" class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
      <SvgIcon name="Check" class="size-4 shrink-0 text-emerald-600" />
      <span>{message}</span>
    </div>
  {/if}

  {#if navigating.to || refreshing}
    <div role="status" class="flex items-center gap-2 text-xs font-semibold text-primary">
      <SvgIcon name="RefreshCw" class="size-3.5 animate-spin" />
      <span>Updating workspace…</span>
    </div>
  {/if}

  <!-- Tab 1: Inbox or History Submissions Table -->
  {#if data.inbox}
    <section
      class="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs"
      aria-labelledby="inbox-title"
      aria-busy={!!navigating.to || refreshing}
    >
      <div class="border-b border-border/60 p-4 sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="inbox-title" class="text-lg font-bold text-foreground">
              {data.tab === "history" ? "Activity" : "Support Submissions"}
            </h2>
            <p class="text-xs text-muted">
              {data.tab === "history"
                ? "Recent chronological activity across submissions, replies, and announcements."
                : "Customer queries and private communication threads from all organizations."}
            </p>
          </div>
        </div>

        <!-- Filter Form -->
        <form method="GET" action={root} onsubmit={filter} class="mt-4 flex flex-wrap items-end gap-3">
          {#if data.tab === "history"}
            <input type="hidden" name="tab" value="history" />
          {/if}

          <label class="grid min-w-56 flex-1 gap-1 text-xs font-semibold text-foreground">
            Search submissions
            <div class="relative">
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                <SvgIcon name="Search" class="size-3.5" />
              </span>
              <input
                class="w-full rounded-lg border border-border bg-surface pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                name="q"
                type="search"
                value={data.q}
                placeholder="Subject or submitter"
              />
            </div>
          </label>

          <label class="grid min-w-40 gap-1 text-xs font-semibold text-foreground">
            Query type
            <select
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              name="type"
              value={data.queryType}
            >
              <option value="">All types</option>
              {#each Object.entries(queryTypes) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </label>

          <label class="grid min-w-44 gap-1 text-xs font-semibold text-foreground">
            Organization
            <input
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              name="organization"
              value={data.organization}
              placeholder="Any organization"
            />
          </label>

          <label class="grid min-w-36 gap-1 text-xs font-semibold text-foreground">
            Response
            <select
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              name="status"
              value={data.status}
            >
              <option value="">All responses</option>
              <option value="awaiting">Awaiting first reply</option>
              <option value="replied">Replied</option>
            </select>
          </label>

          <button
            type="submit"
            class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-2xs hover:bg-[#F0F4ED] hover:border-accent/40 active:scale-[0.99] cursor-pointer"
          >
            <SvgIcon name="Filter" class="size-3.5 text-muted" />
            <span>Apply filters</span>
          </button>

          {#if data.q || data.queryType || data.organization || data.status}
            <a
              class="inline-flex items-center px-2 py-2 text-xs font-semibold text-primary underline hover:text-secondary"
              href={root + (data.tab === "history" ? "?tab=history" : "")}
            >
              Clear
            </a>
          {/if}
        </form>
      </div>

      <!-- History Tab Content -->
      {#if data.tab === "history"}
        <p class="px-5 pt-4 text-xs font-medium text-muted">
          Recent communication activity for this page of submissions, plus latest platform announcements.
        </p>

        <ul class="divide-y divide-border/60">
          {#each history as event}
            <li class="flex flex-wrap items-start justify-between gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class={"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold " +
                    (event.kind === "Announcement published"
                      ? "bg-purple-50 text-purple-800 border border-purple-200/60"
                      : event.kind === "Private reply"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                        : "bg-blue-50 text-blue-800 border border-blue-200/60")}>
                    {event.kind}
                  </span>
                  {#if event.submissionId}
                    <a
                      class="font-semibold text-primary hover:underline"
                      href={event.href}
                      onclick={(e) => openSubmission(e, event.submissionId!)}
                    >
                      {event.title}
                    </a>
                  {:else}
                    <a class="font-semibold text-primary hover:underline" href={event.href}>
                      {event.title}
                    </a>
                  {/if}
                </div>
                <p class="text-xs text-muted">
                  {event.queryType} · <span class="font-medium text-foreground">{event.context}</span>
                </p>
              </div>
              <time class="text-xs text-muted tabular-nums whitespace-nowrap">{date(event.date)}</time>
            </li>
          {:else}
            <li class="p-8 text-center text-sm text-muted">
              No communication activity to show.
            </li>
          {/each}
        </ul>

      <!-- Inbox Submissions Table -->
      {:else if data.inbox.rows.length}
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead class="border-b border-border bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" class="px-4 py-3.5">Subject</th>
                <th scope="col" class="px-4 py-3.5">Query Type</th>
                <th scope="col" class="px-4 py-3.5">Submitter</th>
                <th scope="col" class="px-4 py-3.5">Organization</th>
                <th scope="col" class="px-4 py-3.5">Submitted</th>
                <th scope="col" class="px-4 py-3.5">Response</th>
                <th scope="col" class="px-4 py-3.5">Latest Activity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
              {#each data.inbox.rows as s (s.id)}
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="px-4 py-3.5 max-w-xs">
                    <a
                      class="font-semibold text-primary hover:underline break-words"
                      href={inboxUrl({ submission: s.id })}
                      onclick={(e) => openSubmission(e, s.id)}
                    >
                      {s.subject}
                    </a>
                    {#if s.hasAttachment}
                      <span class="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                        <SvgIcon name="Paperclip" class="size-3 text-muted" />
                        Attachment
                      </span>
                    {/if}
                  </td>
                  <td class="px-4 py-3.5">
                    <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {s.queryTypeLabel}
                    </span>
                  </td>
                  <td class="px-4 py-3.5">
                    <span class="font-medium text-foreground">{s.submitterName}</span>
                    <span class="block text-xs text-muted truncate max-w-[200px]">{s.submitterEmail}</span>
                  </td>
                  <td class="px-4 py-3.5">
                    <span class="font-medium text-foreground">{s.organizationName}</span>
                  </td>
                  <td class="px-4 py-3.5 text-xs text-muted tabular-nums">
                    {date(s.createdAt)}
                  </td>
                  <td class="px-4 py-3.5">
                    <span class={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                      (s.replyCount ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60" : "bg-amber-50 text-amber-900 border border-amber-200/60")}>
                      {s.replyCount ? "Replied" : "Awaiting first reply"}
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-xs text-muted tabular-nums">
                    {date(s.latestReply?.createdAt ?? s.createdAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="p-12 text-center space-y-3">
          <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <SvgIcon name="LifeBuoy" class="size-6" />
          </div>
          <h3 class="text-base font-bold text-foreground">No submissions found</h3>
          <p class="mx-auto max-w-sm text-sm text-muted">
            No customer submissions match these filters. Try clearing your query or adjusting the filters above.
          </p>
          {#if data.q || data.queryType || data.organization || data.status}
            <div class="pt-2">
              <a
                class="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-[#F0F4ED]"
                href={root}
              >
                Clear all filters
              </a>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Pagination -->
      <nav aria-label="Submission pages" class="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 px-5 py-3.5 text-xs font-medium text-muted">
        <span>{data.inbox.total} submissions · Page {data.inbox.page} of {data.inbox.pageCount}</span>
        <div class="flex gap-2">
          {#if data.inbox.page > 1}
            <a
              class="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-slate-50 transition-colors"
              href={inboxUrl({ page: data.inbox.page - 1 })}
            >
              <SvgIcon name="ChevronLeft" class="size-3.5" />
              <span>Previous</span>
            </a>
          {/if}
          {#if data.inbox.page < data.inbox.pageCount}
            <a
              class="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-slate-50 transition-colors"
              href={inboxUrl({ page: data.inbox.page + 1 })}
            >
              <span>Next</span>
              <SvgIcon name="ChevronRight" class="size-3.5" />
            </a>
          {/if}
        </div>
      </nav>
    </section>
  {/if}

  <!-- Tab 2: Announcements Tab -->
  {#if data.tab === "announcements"}
    <section
      class="rounded-xl border border-border/80 bg-surface shadow-xs"
      aria-labelledby="announcements-title"
    >
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-5">
        <div>
          <h2 id="announcements-title" class="text-lg font-bold text-foreground">
            Publication history
          </h2>
          <p class="text-xs text-muted">
            Broadcast messages and announcements delivered to tenant organizations and users.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary active:scale-[0.99] cursor-pointer"
          onclick={() => (composer = true)}
        >
          <SvgIcon name="Plus" class="size-4" />
          <span>Create Announcement</span>
        </button>
      </header>

      {#each data.announcements as a (a.id)}
        <article id={a.id} class="space-y-3 border-b border-border/60 p-5 last:border-b-0 hover:bg-slate-50/50 transition-colors">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 class="text-base font-bold text-foreground">{a.title}</h3>
              <p class="mt-0.5 text-xs text-muted">
                {date(a.publishedAt)} · <span class="font-medium text-foreground">{audiences[a.audienceType] ?? a.audienceType}</span>
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-slate-50 cursor-pointer"
              aria-expanded={recipientId === a.id}
              onclick={() => showRecipients(a.id)}
            >
              <SvgIcon name="Users" class="size-3.5 text-muted" />
              <span>{a.recipientCount} recipients</span>
            </button>
          </div>

          <p class="whitespace-pre-wrap break-words text-sm text-foreground leading-relaxed">
            {a.body}
          </p>

          {#if recipientId === a.id}
            <div class="mt-3 rounded-lg border border-border bg-slate-50/90 p-4 space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-muted">Snapshot Recipient List</h4>
              {#if recipientLoading}
                <div role="status" class="flex items-center gap-2 text-xs text-muted">
                  <SvgIcon name="RefreshCw" class="size-3.5 animate-spin text-primary" />
                  <span>Loading recipients…</span>
                </div>
              {:else if recipientError}
                <p role="alert" class="text-xs font-semibold text-danger">{recipientError}</p>
              {:else}
                <ul class="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-md border border-border bg-surface text-xs [scrollbar-width:thin]">
                  {#each recipients as r}
                    <li class="break-words px-3 py-2 text-foreground">
                      <span class="font-medium">{r.fullName}</span> · <span class="text-muted">{r.email}</span> · <span class="font-semibold text-primary">{r.organizationName}</span>
                    </li>
                  {:else}
                    <li class="px-3 py-2 text-muted">No recipient records.</li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        </article>
      {:else}
        <div class="p-12 text-center space-y-2">
          <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <SvgIcon name="Bell" class="size-6" />
          </div>
          <h3 class="text-base font-bold text-foreground">No published announcements</h3>
          <p class="text-sm text-muted">There are no announcements published yet. Click "Create Announcement" to send one.</p>
        </div>
      {/each}
    </section>
  {/if}
</div>

<!-- Submission Details & Private Conversation Modal -->
<Modal
  bind:open={detailModalOpen}
  title="Submission Details"
  lockScroll
  onclose={closeSubmissionModal}
  class="max-w-3xl"
>
  <SupportSubmissionDetail
    mode="platform"
    detail={activeDetail}
    loading={detailLoading}
    error={detailError}
    attachmentBasePath="/api/platform/support/attachments/"
  >
    {#snippet replySection()}
      <form onsubmit={reply} class="space-y-3 border-t border-border pt-4">
        <label class="grid gap-1.5 text-xs font-semibold text-foreground">
          Reply privately
          <textarea
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            rows="4"
            bind:value={body}
            maxlength="12000"
            placeholder="Type your response to the customer. This reply is strictly private to the original submitter."
            disabled={replying}
            required
          ></textarea>
        </label>

        {#if replyError}
          <p role="alert" class="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
            {replyError}
          </p>
        {/if}

        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-muted">
            <span class="font-medium text-amber-800">Privacy guarantee:</span> Only the original submitter receives this reply. Other organization members cannot view this conversation.
          </p>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary active:scale-[0.99] disabled:opacity-50 cursor-pointer transition-all"
            disabled={replying || !body.trim()}
          >
            <SvgIcon name="Send" class="size-4" />
            <span>{replying ? "Sending…" : "Send private reply"}</span>
          </button>
        </div>
      </form>
    {/snippet}
  </SupportSubmissionDetail>
</Modal>

<!-- Create Announcement Modal -->
<Modal bind:open={composer} title="Create Announcement" lockScroll class="max-w-2xl">
  {#if composer}
    <AudienceComposer
      onpublished={() => {
        composer = false;
        notify("Announcement published.", "success");
      }}
    />
  {/if}
</Modal>
