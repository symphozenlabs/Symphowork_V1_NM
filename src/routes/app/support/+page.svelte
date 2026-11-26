<script lang="ts">
  import { untrack } from "svelte";
  import { invalidate, pushState } from "$app/navigation";
  import { page } from "$app/state";
  import Modal from "$lib/components/ui/Modal.svelte";
  import SvgIcon from "$lib/components/ui/Icon.svelte";
  import SupportSubmissionDetail, {
    type SupportSubmissionDetailData,
  } from "$lib/components/support/SupportSubmissionDetail.svelte";
  import { notify } from "$lib/client/toast";
  import {
    queryTypes,
    queryLabel,
    supportRequest,
  } from "$lib/client/support-communication";

  type AnnouncementItem = {
    id: string;
    title: string;
    body: string;
    publishedAt: string | Date;
    notificationId: string | null;
    readAt: string | Date | null;
  };

  let { data } = $props();

  let open = $state(false);
  let busy = $state(false);
  let message = $state("");
  let problem = $state("");
  let markingId = $state("");

  let submissionModalOpen = $state(
    Boolean(untrack(() => data.selected || data.selectedError))
  );
  let activeSubmission = $state<SupportSubmissionDetailData | null>(
    untrack(() => (data.selected as SupportSubmissionDetailData | null) ?? null)
  );
  let submissionLoading = $state(false);
  let submissionError = $state(untrack(() => data.selectedError ?? ""));
  let submissionSeq = 0;

  let announcementModalOpen = $state(
    Boolean(untrack(() => data.selectedAnnouncement || data.announcementError))
  );
  let activeAnnouncement = $state<AnnouncementItem | null>(
    untrack(() => (data.selectedAnnouncement as AnnouncementItem | null) ?? null)
  );
  let announcementLoading = $state(false);
  let announcementError = $state(untrack(() => data.announcementError ?? ""));
  let announcementSeq = 0;

  async function fetchSubmission(id: string) {
    const seq = ++submissionSeq;
    submissionLoading = true;
    submissionError = "";
    try {
      const result = (await supportRequest(
        "/api/app/support/submissions/" + encodeURIComponent(id)
      )) as SupportSubmissionDetailData;
      if (seq !== submissionSeq) return;
      activeSubmission = result;
    } catch (cause) {
      if (seq !== submissionSeq) return;
      activeSubmission = null;
      submissionError =
        (cause as Error).message ||
        "This submission could not be found or you do not have permission to view it.";
    } finally {
      if (seq === submissionSeq) submissionLoading = false;
    }
  }

  async function fetchAnnouncement(id: string) {
    const seq = ++announcementSeq;
    announcementLoading = true;
    announcementError = "";
    try {
      const result = (await supportRequest(
        "/api/app/support/announcements/" + encodeURIComponent(id)
      )) as AnnouncementItem;
      if (seq !== announcementSeq) return;
      activeAnnouncement = result;
    } catch (cause) {
      if (seq !== announcementSeq) return;
      activeAnnouncement = null;
      announcementError =
        (cause as Error).message ||
        "This announcement is unavailable or you are not an authorized recipient.";
    } finally {
      if (seq === announcementSeq) announcementLoading = false;
    }
  }

  function syncFromLocation() {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlSubId = params.get("submission");
    const urlAnnId = params.get("announcement");

    if (!urlSubId) {
      submissionModalOpen = false;
      activeSubmission = null;
      submissionError = "";
    } else {
      submissionModalOpen = true;
      const localSub = data.submissions.find((s: { id: string }) => s.id === urlSubId);
      if (localSub) {
        activeSubmission = {
          submission: localSub,
          replies: localSub.replies ?? [],
          attachments: localSub.attachments ?? [],
        };
        submissionError = "";
        submissionLoading = false;
      } else if (activeSubmission?.submission.id !== urlSubId) {
        void fetchSubmission(urlSubId);
      }
    }

    if (!urlAnnId) {
      announcementModalOpen = false;
      activeAnnouncement = null;
      announcementError = "";
    } else {
      announcementModalOpen = true;
      const localAnn = (data.announcements as AnnouncementItem[]).find((a) => a.id === urlAnnId);
      if (localAnn) {
        activeAnnouncement = localAnn;
        announcementError = "";
        announcementLoading = false;
      } else if (activeAnnouncement?.id !== urlAnnId) {
        void fetchAnnouncement(urlAnnId);
      }
    }
  }

  $effect(() => {
    const serverSub = data.selected as SupportSubmissionDetailData | null;
    const serverSubError = data.selectedError ?? "";
    const urlSubId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("submission")
        : page.url.searchParams.get("submission");

    untrack(() => {
      if (!urlSubId) return;
      if (serverSub && serverSub.submission.id === urlSubId) {
        activeSubmission = serverSub;
        submissionError = "";
        submissionLoading = false;
        submissionModalOpen = true;
      } else if (serverSubError && !activeSubmission) {
        activeSubmission = null;
        submissionError = serverSubError;
        submissionLoading = false;
        submissionModalOpen = true;
      }
    });
  });

  $effect(() => {
    const serverAnn = data.selectedAnnouncement as AnnouncementItem | null;
    const serverAnnError = data.announcementError ?? "";
    const urlAnnId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("announcement")
        : page.url.searchParams.get("announcement");

    untrack(() => {
      if (!urlAnnId) return;
      if (serverAnn && serverAnn.id === urlAnnId) {
        activeAnnouncement = serverAnn;
        announcementError = "";
        announcementLoading = false;
        announcementModalOpen = true;
      } else if (serverAnnError && !activeAnnouncement) {
        activeAnnouncement = null;
        announcementError = serverAnnError;
        announcementLoading = false;
        announcementModalOpen = true;
      }
    });
  });

  function openSubmissionModal(event: MouseEvent, item: any) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    submissionError = "";
    submissionLoading = false;
    activeSubmission = {
      submission: item,
      replies: item.replies ?? [],
      attachments: item.attachments ?? [],
    };
    submissionModalOpen = true;
    pushState(`/app/support?submission=${encodeURIComponent(item.id)}`, {});
  }

  function closeSubmissionModal() {
    submissionModalOpen = false;
    activeSubmission = null;
    submissionError = "";
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("submission")) {
      pushState("/app/support", {});
    }
  }

  function openAnnouncementModal(event: MouseEvent, item: AnnouncementItem) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    announcementError = "";
    announcementLoading = false;
    activeAnnouncement = item;
    announcementModalOpen = true;
    pushState(`/app/support?announcement=${encodeURIComponent(item.id)}`, {});
  }

  function closeAnnouncementModal() {
    announcementModalOpen = false;
    activeAnnouncement = null;
    announcementError = "";
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("announcement")) {
      pushState("/app/support", {});
    }
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    busy = true;
    problem = "";
    try {
      await supportRequest(
        "/api/app/support",
        new FormData(event.currentTarget as HTMLFormElement)
      );
      open = false;
      message = "Query submitted.";
      notify("Query submitted.", "success");
      await invalidate("app:support:workspace");
    } catch (e) {
      problem = (e as Error).message;
    } finally {
      busy = false;
    }
  }

  async function mark(notificationId: string) {
    if (!notificationId || markingId === notificationId) return;
    markingId = notificationId;
    problem = "";
    try {
      await supportRequest("/api/app/notifications/" + notificationId, {});
      if (activeAnnouncement && activeAnnouncement.notificationId === notificationId) {
        activeAnnouncement = {
          ...activeAnnouncement,
          readAt: new Date().toISOString(),
        };
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("symphowork:notifications-updated"));
      }
      await invalidate("app:support:workspace");
    } catch (e) {
      problem = (e as Error).message;
    } finally {
      markingId = "";
    }
  }

  const formatDate = (value: string | Date) => new Date(value).toLocaleString();
  const fieldClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50";
</script>

<svelte:window onpopstate={syncFromLocation} />

<svelte:head>
  <title>Support · SymphoWork</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Help &amp; Communication
        </span>
      </div>
      <h1 class="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Support
      </h1>
      <p class="mt-1 max-w-2xl text-sm text-muted">
        View announcements from the product team and manage your private support inquiries.
      </p>
    </div>

    <button
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-secondary active:scale-[0.99] cursor-pointer transition-all"
      onclick={() => {
        problem = "";
        open = true;
      }}
    >
      <SvgIcon name="Plus" class="size-4" />
      <span>Raise a Query</span>
    </button>
  </div>

  {#if message}
    <div role="status" class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
      <SvgIcon name="Check" class="size-4 shrink-0 text-emerald-600" />
      <span>{message}</span>
    </div>
  {/if}

  {#if problem && !open}
    <div role="alert" class="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
      <SvgIcon name="AlertCircle" class="size-5 shrink-0 text-danger" />
      <p>{problem}</p>
    </div>
  {/if}

  <!-- Product Team Announcements -->
  <section class="rounded-xl border border-border/80 bg-surface shadow-xs" aria-labelledby="announcements-heading">
    <header class="flex items-center justify-between border-b border-border/60 px-5 py-4">
      <div class="flex items-center gap-2.5">
        <span class="rounded-lg bg-primary/10 p-2 text-primary">
          <SvgIcon name="Bell" class="size-4" />
        </span>
        <div>
          <h2 id="announcements-heading" class="text-base font-bold text-foreground">
            Product Team Announcements
          </h2>
          <p class="text-xs text-muted">Updates and notices targeted to you</p>
        </div>
      </div>
    </header>

    <div class="divide-y divide-border/60">
      {#each data.announcements as a (a.id)}
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors">
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <a
                href={"?announcement=" + a.id}
                onclick={(e) => openAnnouncementModal(e, a)}
                class="font-semibold text-primary hover:underline break-words"
              >
                {a.title}
              </a>
              <span
                class={"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                  (a.readAt
                    ? "border border-slate-200 bg-slate-100 text-slate-600"
                    : "border border-amber-200 bg-amber-50 text-amber-900")}
              >
                {a.readAt ? "Read" : "Unread"}
              </span>
            </div>
            <p class="line-clamp-1 text-xs text-muted">{a.body}</p>
            <p class="text-[11px] text-muted tabular-nums">
              Product Team · {formatDate(a.publishedAt)}
            </p>
          </div>

          <div class="flex items-center gap-2">
            {#if !a.readAt && a.notificationId}
              <button
                type="button"
                class="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                disabled={markingId === a.notificationId}
                onclick={() => mark(a.notificationId!)}
              >
                {markingId === a.notificationId ? "Marking…" : "Mark read"}
              </button>
            {/if}
            <a
              href={"?announcement=" + a.id}
              onclick={(e) => openAnnouncementModal(e, a)}
              class="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary shadow-2xs hover:bg-slate-50"
            >
              <span>View</span>
            </a>
          </div>
        </div>
      {:else}
        <p class="p-8 text-center text-sm text-muted">No announcements yet.</p>
      {/each}
    </div>
  </section>

  <!-- My Submissions -->
  <section class="rounded-xl border border-border/80 bg-surface shadow-xs" aria-labelledby="submissions-heading">
    <header class="flex items-center justify-between border-b border-border/60 px-5 py-4">
      <div class="flex items-center gap-2.5">
        <span class="rounded-lg bg-slate-100 p-2 text-slate-600">
          <SvgIcon name="LifeBuoy" class="size-4" />
        </span>
        <div>
          <h2 id="submissions-heading" class="text-base font-bold text-foreground">
            My Submissions
          </h2>
          <p class="text-xs text-muted">Your private queries and product team replies</p>
        </div>
      </div>
    </header>

    <div class="divide-y divide-border/60">
      {#each data.submissions as s (s.id)}
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors">
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <a
                href={"?submission=" + s.id}
                onclick={(e) => openSubmissionModal(e, s)}
                class="font-semibold text-primary hover:underline break-words"
              >
                {s.subject}
              </a>
              <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {queryLabel(s.queryType)}
              </span>
              {#if s.attachments?.length}
                <span class="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                  <SvgIcon name="Paperclip" class="size-3" />
                  Attachment
                </span>
              {/if}
            </div>
            <p class="text-xs text-muted tabular-nums">
              Submitted {formatDate(s.createdAt)}
            </p>
          </div>

          <span
            class={"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold " +
              (s.replies.length
                ? "border border-emerald-200/70 bg-emerald-50 text-emerald-800"
                : "border border-amber-200/70 bg-amber-50 text-amber-900")}
          >
            {s.replies.length ? "Product team replied" : "Submitted"}
          </span>
        </div>
      {:else}
        <p class="p-8 text-center text-sm text-muted">Your submitted queries will appear here.</p>
      {/each}
    </div>
  </section>
</div>

<!-- Submission Details Modal (Read-only for organization staff; no reply composer) -->
<Modal
  bind:open={submissionModalOpen}
  title="Submission Details"
  lockScroll
  onclose={closeSubmissionModal}
  class="max-w-2xl"
>
  <SupportSubmissionDetail
    mode="staff"
    detail={activeSubmission}
    loading={submissionLoading}
    error={submissionError}
    attachmentBasePath="/api/app/support/attachments/"
  />
</Modal>

<!-- Announcement Details Modal -->
<Modal
  bind:open={announcementModalOpen}
  title="Announcement Details"
  lockScroll
  onclose={closeAnnouncementModal}
  class="max-w-2xl"
>
  {#if announcementLoading}
    <div role="status" class="flex items-center justify-center gap-2.5 py-10 text-sm text-muted">
      <SvgIcon name="RefreshCw" class="size-4 animate-spin text-primary" />
      <span>Loading announcement…</span>
    </div>
  {:else if announcementError}
    <div role="alert" class="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger">
      <SvgIcon name="AlertCircle" class="size-5 shrink-0 text-danger" />
      <div>
        <p class="font-semibold">Unable to display announcement</p>
        <p class="mt-1 text-xs">{announcementError}</p>
      </div>
    </div>
  {:else if activeAnnouncement}
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-2 border-b border-border/70 pb-4 text-xs">
        <span class="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
          Product Team
        </span>
        <span
          class={"inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold " +
            (activeAnnouncement.readAt
              ? "border border-slate-200 bg-slate-100 text-slate-600"
              : "border border-amber-200 bg-amber-50 text-amber-900")}
        >
          {activeAnnouncement.readAt ? "Read" : "Unread"}
        </span>
        <time class="ml-auto text-xs text-muted tabular-nums">
          {formatDate(activeAnnouncement.publishedAt)}
        </time>
      </div>

      <h3 class="text-lg font-bold text-foreground break-words">
        {activeAnnouncement.title}
      </h3>

      <div class="rounded-xl border border-border bg-slate-50/70 p-4">
        <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {activeAnnouncement.body}
        </p>
      </div>

      {#if !activeAnnouncement.readAt && activeAnnouncement.notificationId}
        <div class="flex justify-end pt-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            disabled={markingId === activeAnnouncement.notificationId}
            onclick={() => mark(activeAnnouncement!.notificationId!)}
          >
            <SvgIcon name="Check" class="size-3.5 text-primary" />
            <span>{markingId === activeAnnouncement.notificationId ? "Marking…" : "Mark read"}</span>
          </button>
        </div>
      {/if}
    </div>
  {/if}
</Modal>

<!-- Raise a Query Modal -->
<Modal bind:open title="Raise a Query" lockScroll class="max-w-xl">
  {#if open}
    <form onsubmit={submit} class="space-y-4">
      <label class="block text-sm font-semibold text-foreground">
        Query Type
        <select name="queryType" required class={"mt-1 " + fieldClass}>
          <option value="">Select a type</option>
          {#each Object.entries(queryTypes) as [key, label]}
            <option value={key}>{label}</option>
          {/each}
        </select>
      </label>

      <label class="block text-sm font-semibold text-foreground">
        Subject
        <input
          required
          maxlength="180"
          name="subject"
          placeholder="Brief summary of your question or issue"
          class={"mt-1 " + fieldClass}
        />
      </label>

      <label class="block text-sm font-semibold text-foreground">
        Description
        <textarea
          required
          maxlength="12000"
          name="description"
          rows="5"
          placeholder="Provide clear details so our support team can assist you…"
          class={"mt-1 " + fieldClass}
        ></textarea>
      </label>

      <label class="block text-sm font-semibold text-foreground">
        Attachment (optional, PDF, JPEG or PNG up to 2 MB)
        <input
          type="file"
          name="file"
          accept="application/pdf,image/jpeg,image/png"
          class="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
        />
      </label>

      {#if problem}
        <p role="alert" class="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
          {problem}
        </p>
      {/if}

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 cursor-pointer"
          disabled={busy}
          onclick={() => (open = false)}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-secondary disabled:opacity-50 cursor-pointer"
          disabled={busy}
        >
          {busy ? "Submitting…" : "Submit query"}
        </button>
      </div>
    </form>
  {/if}
</Modal>
