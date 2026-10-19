"use client";

import React, { useMemo, useState } from "react";
import { Search, UserPlus, Users, MessageSquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ConversationItem, ConversationType } from "./types";
import { ConversationListItem } from "./conversation-list-item";

interface ConversationSidebarProps {
  conversations: ConversationItem[];
  selectedConversationId: string | null;
  loading: boolean;
  currentEmployeeId?: string;
  onSelectConversation: (id: string) => void;
  onOpenNewDirect: () => void;
  onOpenNewGroup: () => void;
  onOpenGlobalSearch?: () => void;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  loading,
  currentEmployeeId,
  onSelectConversation,
  onOpenNewDirect,
  onOpenNewGroup,
  onOpenGlobalSearch,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | ConversationType>("all");

  // Sorted and filtered conversations
  const filteredConversations = useMemo(() => {
    // 1. Sort by latest message createdAt, fallback to conversation updatedAt
    const sorted = [...conversations].sort((a, b) => {
      const timeA = new Date(a.lastMessage?.createdAt || a.conversation.updatedAt).getTime();
      const timeB = new Date(b.lastMessage?.createdAt || b.conversation.updatedAt).getTime();
      return timeB - timeA;
    });

    return sorted.filter((item) => {
      // 2. Type filter
      if (filterType !== "all" && item.conversation.type !== filterType) {
        return false;
      }

      // 3. Search query filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const groupName = item.conversation.name?.toLowerCase() ?? "";
      const recipientName = item.recipient?.displayName?.toLowerCase() ?? "";
      const employeeName = item.employee?.displayName?.toLowerCase() ?? "";
      const dept = item.recipient?.departmentName?.toLowerCase() ?? "";
      const designation = item.recipient?.designationTitle?.toLowerCase() ?? "";
      const lastMsgContent = item.lastMessage?.content?.toLowerCase() ?? "";

      return (
        groupName.includes(q) ||
        recipientName.includes(q) ||
        employeeName.includes(q) ||
        dept.includes(q) ||
        designation.includes(q) ||
        lastMsgContent.includes(q)
      );
    });
  }, [conversations, filterType, searchQuery]);

  // Total unread count
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0);
  }, [conversations]);

  return (
    <aside className="flex h-full flex-col border-r border-border bg-surface/50">
      {/* Top Header / Action Bar */}
      <div className="border-b border-border/80 p-4 space-y-3 bg-surface">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Messages
            </h2>
            {totalUnreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white shadow-xs">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenNewDirect}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40"
              title="Start a new direct chat"
            >
              <UserPlus className="size-3.5" />
              <span>New Chat</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenNewGroup}
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold text-slate-700 border-border hover:bg-slate-100"
              title="Create a new group channel"
            >
              <Users className="size-3.5" />
              <span>New Group</span>
            </Button>
          </div>
        </div>

        {/* Search Bar & Global Search Button */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <Input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-8 text-xs bg-slate-50/80 border-slate-200/80 focus:bg-white transition-all"
              aria-label="Search conversations"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted hover:text-foreground hover:bg-slate-200/60 transition-colors"
                aria-label="Clear filter"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {onOpenGlobalSearch && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenGlobalSearch}
              className="h-9 px-2.5 text-xs text-slate-600 border-border hover:bg-slate-100 hover:text-primary shrink-0"
              title="Search all messages (Ctrl+K)"
              aria-label="Search all messages"
            >
              <Search className="size-3.5 mr-1" />
              <span className="hidden sm:inline">Search all</span>
            </Button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-0.5" role="tablist" aria-label="Conversation filters">
          <button
            type="button"
            role="tab"
            aria-selected={filterType === "all"}
            onClick={() => setFilterType("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              filterType === "all"
                ? "bg-primary text-white font-semibold shadow-2xs"
                : "text-muted hover:bg-slate-100 hover:text-foreground"
            )}
          >
            All ({conversations.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterType === "direct"}
            onClick={() => setFilterType("direct")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              filterType === "direct"
                ? "bg-primary text-white font-semibold shadow-2xs"
                : "text-muted hover:bg-slate-100 hover:text-foreground"
            )}
          >
            Direct
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filterType === "group"}
            onClick={() => setFilterType("group")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              filterType === "group"
                ? "bg-primary text-white font-semibold shadow-2xs"
                : "text-muted hover:bg-slate-100 hover:text-foreground"
            )}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1" role="list">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse p-2">
                <div className="size-11 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquarePlus className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {searchQuery ? "No conversations match your search" : "No conversations yet"}
              </p>
              <p className="mt-1 text-xs text-muted max-w-[220px] mx-auto leading-relaxed">
                {searchQuery
                  ? "Try searching for a coworker by name, title, or department."
                  : "Start a direct message with a colleague or create a team group."}
              </p>
            </div>
            {!searchQuery && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onOpenNewDirect}
                className="mt-2 text-xs"
              >
                Start a Conversation
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((item) => (
            <ConversationListItem
              key={item.conversation.id}
              item={item}
              isSelected={item.conversation.id === selectedConversationId}
              currentEmployeeId={currentEmployeeId}
              onClick={() => onSelectConversation(item.conversation.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
