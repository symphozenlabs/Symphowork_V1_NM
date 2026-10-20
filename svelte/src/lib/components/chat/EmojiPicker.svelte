<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys",
    icon: "Smile",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
      "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
      "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
      "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
      "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
      "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
      "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
    ],
  },
  {
    id: "people",
    name: "Gestures",
    icon: "ThumbsUp",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
      "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
      "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐",
      "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵",
      "🦶", "👂", "👃", "🧠", "👀", "👁️", "👅", "👄", "🧑‍💻", "👩‍💼",
    ],
  },
  {
    id: "hearts",
    name: "Hearts & Signs",
    icon: "Heart",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🔥",
      "✨", "🌟", "⭐", "💥", "💯", "💢", "🎉", "🎊", "🎈", "🎁",
      "🏆", "🥇", "✅", "✔️", "❌", "⚠️", "🔔", "💡", "🚀", "🎯",
    ],
  },
  {
    id: "work",
    name: "Work & Objects",
    icon: "Briefcase",
    emojis: [
      "💼", "📁", "📂", "📄", "📃", "📋", "📌", "📍", "📎", "🖇️",
      "💻", "🖥️", "📱", "⌨️", "🖱️", "🖨️", "📊", "📈", "📉", "🗓️",
      "📅", "📆", "📇", "🏷️", "📝", "✏️", "✒️", "🖊️", "🔒", "🔓",
      "🔑", "☕", "🍕", "🍔", "🍎", "🍩", "🍻", "🥂", "⏰", "⏳",
    ],
  },
];
interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}
let {
  onSelectEmoji,
  onClose,
  className,
}:EmojiPickerProps=$props();
let activeCategory=$state<string>(untrack(()=>("smileys")));
const setActiveCategory=(next:typeof activeCategory|((previous:typeof activeCategory)=>typeof activeCategory))=>{activeCategory=typeof next==="function"?(next as (previous:typeof activeCategory)=>typeof activeCategory)(activeCategory):next;};
let search=$state(untrack(()=>("")));
const setSearch=(next:typeof search|((previous:typeof search)=>typeof search))=>{search=typeof next==="function"?(next as (previous:typeof search)=>typeof search)(search):next;};
const filteredEmojis=$derived.by(() => {
    if (!search.trim()) return null;
    const q = search.trim();
    const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return allEmojis.filter((e) => e.includes(q));
  });

import { cn } from '$lib/utils';</script>
<div role="dialog" aria-label="Emoji Picker" class={cn(
        "flex flex-col w-72 sm:w-80 h-72 rounded-xl border border-border bg-white shadow-xl overflow-hidden z-50",
        className
      )}>
      
      <div class="flex items-center gap-1.5 p-2 border-b border-border bg-slate-50">
        <div class="relative flex-1">
          <SvgIcon name="Search" class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted pointer-events-none" />
          <input type="text" placeholder="Search emoji…" value={search} onchange={(e) => setSearch(e.currentTarget.value)} class="w-full rounded-md border border-slate-200 bg-white pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary" />
          {#if search}<button type="button" onclick={() => setSearch("")} class="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground" aria-label="Clear search">
              <SvgIcon name="X" class="size-3" />
            </button>{/if}
        </div>
        {#if onClose}<button type="button" onclick={onClose} class="p-1 rounded-md text-muted hover:text-foreground hover:bg-slate-200 transition-colors" aria-label="Close emoji picker">
            <SvgIcon name="X" class="size-4" />
          </button>{/if}
      </div>

      
      {#if !search}<div class="flex items-center border-b border-border bg-slate-50/60 px-1 py-1 gap-1">
          {#each EMOJI_CATEGORIES as cat}{@const Icon = cat.icon}{@const isActive = activeCategory === cat.id}<button type="button" onclick={() => setActiveCategory(cat.id)} class={cn(
                  "flex-1 flex items-center justify-center py-1 rounded-md text-xs transition-colors",
                  isActive
                    ? "bg-white text-primary font-semibold shadow-xs"
                    : "text-muted hover:text-foreground hover:bg-slate-100"
                )} title={cat.name} aria-label={cat.name}>
                <SvgIcon name={Icon} class="size-3.5" />
              </button>{/each}
        </div>{/if}

      
      <div class="flex-1 overflow-y-auto p-2">
        {#if filteredEmojis}{#if filteredEmojis.length === 0}<div class="flex items-center justify-center h-full text-xs text-muted">
              No emojis found
            </div>{:else}<div class="grid grid-cols-7 sm:grid-cols-8 gap-1">
              {#each filteredEmojis as emoji, index}<button type="button" onclick={() => onSelectEmoji(emoji)} class="flex size-8 items-center justify-center rounded-md text-lg hover:bg-slate-100 transition-transform active:scale-90" aria-label={`Select emoji ${emoji}`}>
                  {emoji}
                </button>{/each}
            </div>{/if}{:else}<div class="grid grid-cols-7 sm:grid-cols-8 gap-1">
            {#each EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis as emoji, index}<button type="button" onclick={() => onSelectEmoji(emoji)} class="flex size-8 items-center justify-center rounded-md text-lg hover:bg-slate-100 transition-transform active:scale-90" aria-label={`Select emoji ${emoji}`}>
                {emoji}
              </button>{/each}
          </div>{/if}
      </div>
    </div>
