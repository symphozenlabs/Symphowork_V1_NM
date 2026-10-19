"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const CHAT_UNREAD_EVENT = "symphowork:chat-unread-count";

export function dispatchChatUnreadCount(count: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(CHAT_UNREAD_EVENT, { detail: { count } })
    );
  }
}

export function useChatUnreadCount(initialCount: number = 0): number {
  const [unreadCount, setUnreadCount] = useState<number>(initialCount);
  const pathname = usePathname();

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/app/chat/unread-count");
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success && typeof data.count === "number") {
          setUnreadCount(data.count);
        }
      }
    } catch {
      // Silently ignore background network errors
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial fetch
    void fetchCount();

    // 2. Listen to custom event dispatched by ChatWorkspace or other components
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ count: number }>;
      if (isMounted && typeof customEvent.detail?.count === "number") {
        setUnreadCount(customEvent.detail.count);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(CHAT_UNREAD_EVENT, handleCustomEvent);
    }

    // 3. Re-validate on tab visibility change
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        void fetchCount();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // 4. Background polling interval (15s when visible, stops when on /app/chat to avoid duplicate polling)
    let intervalId: NodeJS.Timeout | null = null;
    const isChatPage = pathname?.startsWith("/app/chat");

    if (!isChatPage) {
      intervalId = setInterval(() => {
        if (typeof document !== "undefined" && !document.hidden) {
          void fetchCount();
        }
      }, 15000);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(CHAT_UNREAD_EVENT, handleCustomEvent);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchCount, pathname]);

  return unreadCount;
}

export function ChatUnreadBadge({ count, className }: { count?: number; className?: string }) {
  const hookCount = useChatUnreadCount();
  const unreadCount = count !== undefined ? count : hookCount;

  if (unreadCount <= 0) {
    return null;
  }

  const displayCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <span
      data-testid="chat-unread-badge"
      aria-label={`${unreadCount} unread conversations`}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white shadow-2xs",
        className
      )}
    >
      {displayCount}
    </span>
  );
}
