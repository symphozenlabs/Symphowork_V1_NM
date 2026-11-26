<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { supportRequest } from "$lib/client/support-communication";
  import SvgIcon from "$lib/components/ui/Icon.svelte";

  let {
    onpublished,
  }: {
    onpublished?: (result?: unknown) => void | Promise<void>;
  } = $props();

  let mode = $state("all_organizations");
  let title = $state("");
  let body = $state("");
  let orgs = $state<string[]>([]);
  let members = $state<string[]>([]);
  let orgQuery = $state("");
  let memberQuery = $state("");
  let organizations = $state<{ id: string; name: string }[]>([]);
  let people = $state<{ userId: string; fullName: string; email: string }[]>([]);
  let preview = $state<{
    count: number;
    sample: { fullName: string; organizationName: string }[];
  } | null>(null);
  let problem = $state("");
  let message = $state("");
  let busy = $state(false);

  const audience = $derived(
    mode === "all_organizations"
      ? { type: mode }
      : mode === "selected_organizations"
        ? { type: mode, organizationIds: orgs }
        : {
            type: mode,
            organizationId: orgs[0],
            ...(mode === "organization_selected_members"
              ? { userIds: members }
              : {}),
          },
  );

  $effect(() => {
    audience;
    preview = null;
  });

  $effect(() => {
    const q = orgQuery;
    let active = true;
    supportRequest("/api/platform/support/audience?q=" + encodeURIComponent(q))
      .then((rows) => {
        if (active) organizations = rows;
      })
      .catch((e) => {
        if (active) problem = e.message;
      });
    return () => {
      active = false;
    };
  });

  $effect(() => {
    const org = orgs[0];
    const q = memberQuery;
    let active = true;
    people = [];
    if (org && mode === "organization_selected_members") {
      supportRequest(
        "/api/platform/support/audience?organization=" +
          org +
          "&q=" +
          encodeURIComponent(q),
      )
        .then((rows) => {
          if (active) people = rows;
        })
        .catch((e) => {
          if (active) problem = e.message;
        });
    }
    return () => {
      active = false;
    };
  });

  async function send(publish: boolean) {
    if (busy) return;
    busy = true;
    problem = "";
    message = "";
    try {
      if (publish) {
        const result = await supportRequest("/api/platform/support/announcements", {
          title,
          body,
          audience,
        });
        title = "";
        body = "";
        mode = "all_organizations";
        orgs = [];
        members = [];
        orgQuery = "";
        memberQuery = "";
        preview = null;
        problem = "";
        message = "";
        await invalidate("support:workspace");
        await onpublished?.(result);
      } else {
        preview = await supportRequest(
          "/api/platform/support/audience",
          audience,
        );
      }
    } catch (e) {
      problem = (e as Error).message;
    } finally {
      busy = false;
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50";
  const selectClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50";
</script>

<form onsubmit={(e) => e.preventDefault()} class="space-y-4">
  <fieldset disabled={busy} class="space-y-4">
    <div>
      <label for="announcement-title" class="block text-sm font-semibold text-foreground">
        Title
      </label>
      <input
        id="announcement-title"
        class={"mt-1 " + inputClass}
        bind:value={title}
        maxlength="180"
        placeholder="e.g. Scheduled Maintenance Notice"
        required
      />
      <div class="mt-1 flex justify-end text-xs text-muted">
        <span>{title.length}/180</span>
      </div>
    </div>

    <div>
      <label for="announcement-message" class="block text-sm font-semibold text-foreground">
        Message
      </label>
      <textarea
        id="announcement-message"
        class={"mt-1 min-h-[100px] " + inputClass}
        bind:value={body}
        maxlength="12000"
        rows="4"
        placeholder="Write the full announcement text here…"
        required
      ></textarea>
      <div class="mt-1 flex justify-end text-xs text-muted">
        <span>{body.length}/12000</span>
      </div>
    </div>

    <div>
      <label for="announcement-audience" class="block text-sm font-semibold text-foreground">
        Audience
      </label>
      <select
        id="announcement-audience"
        class={"mt-1 " + selectClass}
        bind:value={mode}
        onchange={() => {
          orgs = [];
          members = [];
        }}
      >
          <option value="all_organizations">All organizations</option>
          <option value="selected_organizations">Selected organizations</option>
          <option value="organization_all_members">One organization — all members</option>
          <option value="organization_selected_members">One organization — selected members</option>
      </select>

      {#if mode === "all_organizations"}
        <p class="mt-2 text-xs text-muted">
          Broadcast to all active members across every active organization in the platform.
        </p>
      {/if}
    </div>

    {#if mode !== "all_organizations"}
      <div class="rounded-xl border border-border bg-slate-50/60 p-3.5 space-y-3">
        <label class="block text-xs font-semibold uppercase tracking-wider text-muted">
          Find organization
          <div class="relative mt-1">
            <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <SvgIcon name="Search" class="size-3.5" />
            </span>
            <input
              type="search"
              class={"pl-8 " + inputClass}
              placeholder="Search organizations by name…"
              bind:value={orgQuery}
            />
          </div>
        </label>

        <div class="max-h-40 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border bg-surface [scrollbar-width:thin]">
          {#each organizations as o (o.id)}
            <label class="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                class="size-4 rounded border-border text-primary focus:ring-primary"
                checked={orgs.includes(o.id)}
                onchange={(e) => {
                  orgs = e.currentTarget.checked
                    ? mode === "selected_organizations"
                      ? [...orgs, o.id]
                      : [o.id]
                    : orgs.filter((id) => id !== o.id);
                  members = [];
                }}
              />
              <span class="truncate font-medium">{o.name}</span>
            </label>
          {:else}
            <p class="p-3 text-center text-xs text-muted">No organizations found.</p>
          {/each}
        </div>
        {#if mode === "selected_organizations"}
          <p class="text-xs text-muted font-medium">{orgs.length} organization(s) selected</p>
        {:else if orgs.length > 0}
          <p class="text-xs text-muted font-medium">Selected target organization set.</p>
        {/if}
      </div>
    {/if}

    {#if mode === "organization_selected_members"}
      <div class="rounded-xl border border-border bg-slate-50/60 p-3.5 space-y-3">
        <label class="block text-xs font-semibold uppercase tracking-wider text-muted">
          Find member by name or email
          <div class="relative mt-1">
            <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <SvgIcon name="Search" class="size-3.5" />
            </span>
            <input
              type="search"
              class={"pl-8 " + inputClass}
              placeholder="Search active members…"
              bind:value={memberQuery}
              disabled={!orgs[0]}
            />
          </div>
        </label>

        {#if !orgs[0]}
          <p class="text-xs text-amber-700">Please select an organization above first.</p>
        {:else}
          <div class="max-h-40 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border bg-surface [scrollbar-width:thin]">
            {#each people as p (p.userId)}
              <label class="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-slate-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  class="size-4 rounded border-border text-primary focus:ring-primary"
                  bind:group={members}
                  value={p.userId}
                />
                <span class="truncate font-medium">{p.fullName}</span>
                <span class="text-xs text-muted truncate">({p.email})</span>
              </label>
            {:else}
              <p class="p-3 text-center text-xs text-muted">No members found in selected organization.</p>
            {/each}
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-muted font-medium">{members.length} member(s) selected</span>
            {#if members.length > 0}
              <button
                type="button"
                class="font-semibold text-primary hover:underline cursor-pointer"
                onclick={() => (members = [])}
              >
                Clear selection
              </button>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <div class="pt-2">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-2xs hover:bg-[#F0F4ED] hover:border-accent/40 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        disabled={busy || !title.trim() || !body.trim() || (mode !== "all_organizations" && orgs.length === 0) || (mode === "organization_selected_members" && members.length === 0)}
        onclick={() => send(false)}
      >
        <SvgIcon name="Eye" class="size-4" />
        <span>Preview recipients</span>
      </button>
    </div>

    {#if preview}
      <div class="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-foreground">Announcement preview</h3>
          <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {preview.count} eligible recipients at preview time
          </span>
        </div>

        <div class="rounded-lg border border-border bg-surface p-3">
          <p class="font-semibold text-foreground">{title}</p>
          <p class="mt-1 whitespace-pre-wrap break-words text-xs text-muted">{body}</p>
        </div>

        <div class="rounded-lg border border-amber-200/80 bg-amber-50/70 p-2.5 text-xs text-amber-900">
          <p class="font-medium">Critical recipient snapshot guarantee:</p>
          <p class="mt-0.5 text-amber-800">
            Eligible recipients are resolved and snapshotted at publication time. Users joining later will not receive or access this announcement.
          </p>
        </div>

        {#if preview.sample.length > 0}
          <div class="text-xs text-muted">
            <span class="font-semibold text-foreground">Recipient sample:</span>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              {#each preview.sample as p}
                <span class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {p.organizationName} · {p.fullName}
                </span>
              {/each}
            </div>
          </div>
        {/if}

        <div class="pt-2">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-secondary active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            disabled={!preview.count || !title.trim() || !body.trim() || busy}
            onclick={() => send(true)}
          >
            <SvgIcon name="Send" class="size-4" />
            <span>Publish announcement</span>
          </button>
        </div>
      </div>
    {/if}
  </fieldset>

  {#if busy}
    <div role="status" class="flex items-center gap-2 text-sm text-muted">
      <SvgIcon name="RefreshCw" class="size-4 animate-spin text-primary" />
      <span>Working…</span>
    </div>
  {/if}

  {#if problem}
    <div role="alert" class="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-danger">
      {problem}
    </div>
  {/if}

  {#if message}
    <div role="status" class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
      {message}
    </div>
  {/if}
</form>
