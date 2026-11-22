<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import type { ChatMessageSearchResult } from "$lib/components/chat/types";
import { formatMessageTime } from "$lib/components/chat/utils";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
interface ChatSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onNavigateToMessage: (conversationId: string, messageId: string) => void;
}
let {
  open,
  onClose,
  onNavigateToMessage,
}:ChatSearchDialogProps=$props();
let searchInput=$state<HTMLInputElement | undefined>(undefined);
let query=$state(untrack(()=>("")));
const setQuery=(next:typeof query|((previous:typeof query)=>typeof query))=>{query=typeof next==="function"?(next as (previous:typeof query)=>typeof query)(query):next;};
let results=$state<ChatMessageSearchResult[]>(untrack(()=>([])));
const setResults=(next:typeof results|((previous:typeof results)=>typeof results))=>{results=typeof next==="function"?(next as (previous:typeof results)=>typeof results)(results):next;};
let loading=$state(untrack(()=>(false)));
const setLoading=(next:typeof loading|((previous:typeof loading)=>typeof loading))=>{loading=typeof next==="function"?(next as (previous:typeof loading)=>typeof loading)(loading):next;};
let searched=$state(untrack(()=>(false)));
const setSearched=(next:typeof searched|((previous:typeof searched)=>typeof searched))=>{searched=typeof next==="function"?(next as (previous:typeof searched)=>typeof searched)(searched):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
$effect(()=>{open;query;return untrack(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/app/chat/search?query=${encodeURIComponent(trimmed)}&limit=25`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error?.message ?? "Failed to search messages.");
        }
        setResults(data.results ?? []);
        setSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error searching messages.");
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  });});
$effect(() => { if (open) searchInput?.focus(); });

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightSnippet(snippet: string, targetQuery: string): string {
  const safeText = escapeHtml(snippet);
  const query = targetQuery.trim();
  if (!query) return safeText;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeText.replace(
    new RegExp(`(${safeQuery})`, "gi"),
    '<mark class="rounded-xs bg-amber-200 px-0.5 font-bold text-amber-950">$1</mark>'
  );
}
</script>
{#if !open}{:else}<div role="dialog" tabindex="-1" aria-modal="true" aria-label="Search Messages" class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs pt-16 sm:pt-24 px-4 animate-in fade-in duration-150" onclick={(event) => { if (event.target === event.currentTarget) onClose(); }} onkeydown={(event) => { if (event.key === "Escape") onClose(); }}>
      <div class="relative w-full max-w-xl rounded-2xl border border-border bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        <div class="flex items-center gap-3 p-3.5 border-b border-border bg-surface">
          <SvgIcon name="Search" class="size-5 text-muted shrink-0" />
          <input type="text" placeholder="Search across all conversations…" value={query} oninput={(e) => setQuery(e.currentTarget.value)} class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none" bind:this={searchInput} />
          {#if loading}<SvgIcon name="Loader2" class="size-4 animate-spin text-muted shrink-0" />{/if}
          {#if query && !loading}<button type="button" onclick={() => setQuery("")} class="p-1 rounded-full text-muted hover:text-foreground hover:bg-slate-100" aria-label="Clear search">
              <SvgIcon name="X" class="size-4" />
            </button>{/if}
          <button type="button" onclick={onClose} class="text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">
            ESC
          </button>
        </div>

        
        <div class="flex-1 overflow-y-auto p-2">
          {#if query.trim().length > 0 && query.trim().length < 2}<div class="py-8 text-center text-xs text-muted">
              Type at least 2 characters to search
            </div>{/if}

          {#if error}<div class="py-8 text-center text-xs text-rose-600 font-medium">
              {error}
            </div>{/if}

          {#if searched && !loading && results.length === 0}<div class="py-12 text-center space-y-1">
              <p class="text-sm font-semibold text-slate-700">No messages found</p>
              <p class="text-xs text-muted">
                No matching messages found for &ldquo;{query}&rdquo;
              </p>
            </div>{/if}

          {#if results.length > 0}<div class="space-y-1">
              <div class="px-3 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                {results.length} result{#if results.length === 1}{""}{:else}{"s"}{/if} found
              </div>

              {#each results as item}{@const isGroup = item.conversationType === "group"}<button type="button" onclick={() => {
                      onNavigateToMessage(item.conversationId, item.id);
                      onClose();
                    }} class="w-full text-left rounded-xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 flex flex-col gap-1 group cursor-pointer">
                    <div class="flex items-center justify-between text-xs">
                      <div class="flex items-center gap-1.5 min-w-0">
                        {#if isGroup}<SvgIcon name="Users" class="size-3.5 text-primary shrink-0" />{:else}<SvgIcon name="MessageSquare" class="size-3.5 text-muted shrink-0" />{/if}
                        <span class="font-bold text-foreground truncate">
                          {item.conversationName}
                        </span>
                        <span class="text-[11px] text-muted">
                          • {item.senderDisplayName}
                        </span>
                      </div>
                      <div class="flex items-center gap-1 text-[11px] text-muted shrink-0 ml-2">
                        <span>{formatMessageTime(item.createdAt)}</span>
                        <SvgIcon name="ArrowRight" class="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </div>
                    </div>

                    <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {@html highlightSnippet(item.snippet || item.content, query)}
                    </p>
                  </button>{/each}
            </div>{/if}
        </div>
      </div>
    </div>{/if}
