<script lang="ts">
  import { goto, pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { api, mutation } from "$lib/client/api";
  import Button from "../ui/Button.svelte";

  type Item = {
    id: string;
    title: string;
    message: string;
    type?: string;
    entityType?: string | null;
    entityId?: string | null;
    actionUrl?: string | null;
    readAt?: string | null;
    createdAt: string;
  };

  let items = $state<Item[]>([]);
  let unread = $state(0);
  let loading = $state(true);
  let error = $state("");
  let busy = $state(false);

  function resolveSupportHref(item: Item): string | null {
    if (item.entityType === "support_submission" && item.entityId) {
      return `/app/support?submission=${encodeURIComponent(item.entityId)}`;
    }
    if (item.entityType === "support_announcement" && item.entityId) {
      return `/app/support?announcement=${encodeURIComponent(item.entityId)}`;
    }
    if (item.actionUrl && item.actionUrl.startsWith("/app/support?")) {
      return item.actionUrl;
    }
    return null;
  }

  function resolveActionHref(item: Item): string | null {
    const supportHref = resolveSupportHref(item);
    if (supportHref) return supportHref;
    if (item.actionUrl && item.actionUrl.startsWith("/") && !item.actionUrl.startsWith("//")) {
      return item.actionUrl;
    }
    return null;
  }

  async function load() {
    loading = true;
    error = "";
    try {
      const b = await api<{ notifications: Item[]; unreadCount: number }>("/api/app/notifications");
      items = b.notifications;
      unread = b.unreadCount;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void load();
  });

  async function mark(id?: string) {
    if (busy) return;
    busy = true;
    try {
      await mutation(
        id ? "/api/app/notifications/" + id : "/api/app/notifications",
        id ? "POST" : "PATCH",
        id ? undefined : { markAllRead: true }
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("symphowork:notifications-updated"));
      }
      await load();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      busy = false;
    }
  }

  async function handleOpen(event: MouseEvent, item: Item, href: string) {
    const supportHref = resolveSupportHref(item);
    if (!supportHref) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    error = "";
    if (!item.readAt) {
      try {
        await mutation("/api/app/notifications/" + item.id, "POST");
        items = items.map((entry) =>
          entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry
        );
        unread = Math.max(0, unread - 1);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("symphowork:notifications-updated"));
        }
      } catch (cause) {
        error = (cause as Error).message;
        return;
      }
    }
    if (page.url.pathname === "/app/support") {
      pushState(href, {});
      if (typeof window !== "undefined") {
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } else {
      await goto(href);
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <p class="text-sm text-muted">{unread} unread</p>
    <Button size="sm" variant="secondary" disabled={busy || unread === 0} onclick={() => mark()}>
      Mark all read
    </Button>
  </div>

  {#if error}
    <p role="alert" class="text-sm text-danger">{error}</p>
  {/if}

  {#if loading}
    <p class="text-sm text-muted">Loading notifications…</p>
  {:else if items.length === 0}
    <p class="rounded-xl border border-dashed p-6 text-sm text-muted">You are all caught up.</p>
  {:else}
    {#each items as item (item.id)}
      {@const href = resolveActionHref(item)}
      <div class={"rounded-xl border p-4 " + (item.readAt ? "opacity-70" : "bg-surface")}>
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="font-medium">{item.title}</p>
            <p class="mt-1 text-sm text-muted">{item.message}</p>
            <p class="mt-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
          </div>
          {#if !item.readAt}
            <Button size="sm" variant="ghost" disabled={busy} onclick={() => mark(item.id)}>
              Mark read
            </Button>
          {/if}
        </div>
        {#if href}
          <a
            class="mt-2 inline-block text-sm font-semibold text-primary"
            {href}
            onclick={(e) => handleOpen(e, item, href)}
          >
            Open
          </a>
        {/if}
      </div>
    {/each}
  {/if}
</div>
