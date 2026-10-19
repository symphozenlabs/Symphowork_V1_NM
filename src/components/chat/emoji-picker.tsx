"use client";

import React, { useMemo, useState } from "react";
import { Smile, Heart, ThumbsUp, Briefcase, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys",
    icon: Smile,
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
    icon: ThumbsUp,
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
    icon: Heart,
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
    icon: Briefcase,
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

export function EmojiPicker({
  onSelectEmoji,
  onClose,
  className,
}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("smileys");
  const [search, setSearch] = useState("");

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim();
    const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return allEmojis.filter((e) => e.includes(q));
  }, [search]);

  return (
    <div
      role="dialog"
      aria-label="Emoji Picker"
      className={cn(
        "flex flex-col w-72 sm:w-80 h-72 rounded-xl border border-border bg-white shadow-xl overflow-hidden z-50",
        className
      )}
    >
      {/* Search Header */}
      <div className="flex items-center gap-1.5 p-2 border-b border-border bg-slate-50">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search emoji…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted hover:text-foreground hover:bg-slate-200 transition-colors"
            aria-label="Close emoji picker"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex items-center border-b border-border bg-slate-50/60 px-1 py-1 gap-1">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex-1 flex items-center justify-center py-1 rounded-md text-xs transition-colors",
                  isActive
                    ? "bg-white text-primary font-semibold shadow-xs"
                    : "text-muted hover:text-foreground hover:bg-slate-100"
                )}
                title={cat.name}
                aria-label={cat.name}
              >
                <Icon className="size-3.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredEmojis ? (
          filteredEmojis.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-muted">
              No emojis found
            </div>
          ) : (
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => onSelectEmoji(emoji)}
                  className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-slate-100 transition-transform active:scale-90"
                  aria-label={`Select emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
            {EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                onClick={() => onSelectEmoji(emoji)}
                className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-slate-100 transition-transform active:scale-90"
                aria-label={`Select emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
