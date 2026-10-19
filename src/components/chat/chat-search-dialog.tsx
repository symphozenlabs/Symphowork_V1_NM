"use client";

import React, { useEffect, useState } from "react";
import { Search, X, MessageSquare, Users, Loader2, ArrowRight } from "lucide-react";
import type { ChatMessageSearchResult } from "./types";
import { formatMessageTime } from "./utils";

interface ChatSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onNavigateToMessage: (conversationId: string, messageId: string) => void;
}

export function ChatSearchDialog({
  open,
  onClose,
  onNavigateToMessage,
}: ChatSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatMessageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce query
  useEffect(() => {
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
  }, [open, query]);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const highlightSnippet = (snippet: string, targetQuery: string) => {
    if (!targetQuery.trim()) return snippet;
    const parts = snippet.split(new RegExp(`(${targetQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === targetQuery.trim().toLowerCase() ? (
        <mark key={index} className="bg-amber-200 text-amber-950 font-bold rounded-xs px-0.5">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Messages"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-border bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-3.5 border-b border-border bg-surface">
          <Search className="size-5 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search across all conversations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
            autoFocus
          />
          {loading && <Loader2 className="size-4 animate-spin text-muted shrink-0" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full text-muted hover:text-foreground hover:bg-slate-100"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-2">
          {query.trim().length > 0 && query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-muted">
              Type at least 2 characters to search
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <div className="py-12 text-center space-y-1">
              <p className="text-sm font-semibold text-slate-700">No messages found</p>
              <p className="text-xs text-muted">
                No matching messages found for &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                {results.length} result{results.length === 1 ? "" : "s"} found
              </div>

              {results.map((item) => {
                const isGroup = item.conversationType === "group";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigateToMessage(item.conversationId, item.id);
                      onClose();
                    }}
                    className="w-full text-left rounded-xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 flex flex-col gap-1 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isGroup ? (
                          <Users className="size-3.5 text-primary shrink-0" />
                        ) : (
                          <MessageSquare className="size-3.5 text-muted shrink-0" />
                        )}
                        <span className="font-bold text-foreground truncate">
                          {item.conversationName}
                        </span>
                        <span className="text-[11px] text-muted">
                          • {item.senderDisplayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted shrink-0 ml-2">
                        <span>{formatMessageTime(item.createdAt)}</span>
                        <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {highlightSnippet(item.snippet || item.content, query)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
