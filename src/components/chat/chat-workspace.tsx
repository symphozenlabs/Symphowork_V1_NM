"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationItem, MessageItem } from "./types";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatThread } from "./chat-thread";
import { NewDirectChatDialog } from "./new-direct-chat-dialog";
import { NewGroupChatDialog } from "./new-group-chat-dialog";
import { MessageToTaskDialog } from "./message-to-task-dialog";
import { ChatProfileModal, type ProfileDetails } from "./chat-profile-modal";
import { ChatSearchDialog } from "./chat-search-dialog";
import { dispatchChatUnreadCount } from "@/components/layout/chat-unread-badge";

export function ChatWorkspace() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConvId);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>("");

  // Synchronize unread conversation count with sidebar navigation in real-time
  useEffect(() => {
    const unreadConvs = conversations.filter((c) => (c.unreadCount ?? 0) > 0).length;
    dispatchChatUnreadCount(unreadConvs);
  }, [conversations]);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [typers, setTypers] = useState<string[]>([]);
  const [unreadDividerMessageId, setUnreadDividerMessageId] = useState<string | null>(null);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Dialog & Modal states
  const [newDirectOpen, setNewDirectOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [convertMessage, setConvertMessage] = useState<MessageItem | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDetails | null>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // Ctrl+K / Cmd+K global search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchDialogOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Polling lock refs to avoid overlapping requests
  const isPollingMessagesRef = useRef(false);
  const isPollingSidebarRef = useRef(false);
  const messagesRef = useRef<MessageItem[]>(messages);
  messagesRef.current = messages;

  // 1. Load current user's employee identity
  useEffect(() => {
    let isCancelled = false;
    async function fetchMe() {
      try {
        const res = await fetch("/api/app/me/employee");
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.employee?.id) {
            setCurrentEmployeeId(data.employee.id);
          }
        }
      } catch {
        // Fallback: derived from conversation memberships
      }
    }
    void fetchMe();
    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Load conversations
  const loadConversations = useCallback(async (preserveSelectedId = true) => {
    try {
      const res = await fetch("/api/app/chat/conversations");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Could not load conversations.");
      }
      const loaded: ConversationItem[] = data.conversations ?? [];
      setConversations(loaded);

      // Derive current employee ID if not yet available
      if (loaded.length > 0 && loaded[0]?.member?.employeeId) {
        setCurrentEmployeeId((prev) => prev || loaded[0].member.employeeId);
      }

      // If URL had initial conversation ID or we want to preserve selected
      if (initialConvId && loaded.some((c) => c.conversation.id === initialConvId)) {
        setSelectedConversationId(initialConvId);
      } else if (!preserveSelectedId && loaded.length > 0) {
        setSelectedConversationId((prev) => prev ?? loaded[0].conversation.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  }, [initialConvId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // 3. Mark conversation as read
  const markAsRead = useCallback(async (convId: string) => {
    if (!convId || typeof document === "undefined" || document.hidden) return;
    try {
      await fetch(`/api/app/chat/conversations/${convId}/read`, {
        method: "POST",
      });
      // Clear unread count locally for responsive UX
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation.id === convId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch {
      // Ignore background read receipt network failure
    }
  }, []);

  // 4. Initial load of messages when selectedConversationId changes
  const loadInitialMessages = useCallback(async (convId: string) => {
    if (!convId) return;
    setLoadingMessages(true);
    setError(null);
    setTypers([]);
    setUnreadDividerMessageId(null);

    try {
      const res = await fetch(`/api/app/chat/conversations/${convId}/messages?limit=50`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Could not load messages.");
      }

      const msgs: MessageItem[] = data.messages ?? [];
      setMessages(msgs);
      setHasMoreOlder(msgs.length >= 50);
      if (data.typers) {
        setTypers(data.typers);
      }

      // Find first unread message to show "New Messages" divider
      if (data.memberLastReadAt) {
        const lastReadTime = new Date(data.memberLastReadAt).getTime();
        const firstUnread = msgs.find(
          (m) =>
            m.senderEmployeeId !== currentEmployeeId &&
            new Date(m.createdAt).getTime() > lastReadTime
        );
        if (firstUnread) {
          setUnreadDividerMessageId(firstUnread.id);
        }
      }

      // Mark as read immediately on genuine viewing
      void markAsRead(convId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, [currentEmployeeId, markAsRead]);

  useEffect(() => {
    if (selectedConversationId) {
      void loadInitialMessages(selectedConversationId);
    } else {
      setMessages([]);
      setTypers([]);
      setUnreadDividerMessageId(null);
    }
  }, [selectedConversationId, loadInitialMessages]);

  // 5. Delta poll active thread
  const pollActiveThread = useCallback(async () => {
    if (!selectedConversationId || isPollingMessagesRef.current) return;
    isPollingMessagesRef.current = true;

    try {
      const currentMsgs = messagesRef.current;
      // Find the most recent persisted message's createdAt
      const lastPersisted = [...currentMsgs]
        .reverse()
        .find((m) => !m.id.startsWith("temp-"));
      const afterParam = lastPersisted?.createdAt
        ? `&after=${encodeURIComponent(lastPersisted.createdAt)}`
        : "";

      const res = await fetch(
        `/api/app/chat/conversations/${selectedConversationId}/messages?limit=50${afterParam}`
      );
      if (!res.ok) return;

      const data = await res.json().catch(() => ({}));
      if (data.typers) {
        setTypers(data.typers);
      }

      const newMsgs: MessageItem[] = data.messages ?? [];
      const otherReadTime = data.otherMemberLastReadAt ? new Date(data.otherMemberLastReadAt).getTime() : null;
      const otherSyncTime = data.otherMemberSyncedAt ? new Date(data.otherMemberSyncedAt).getTime() : null;

      setMessages((prev) => {
        let changed = false;
        const map = new Map<string, MessageItem>();

        // 1. Process existing messages and update delivery receipts if other member read/synced
        for (const m of prev) {
          let updatedMsg = m;
          const isOutgoing = m.senderEmployeeId === currentEmployeeId || m.sender?.id === currentEmployeeId;

          if (isOutgoing && !m.id.startsWith("temp-") && m.deliveryStatus !== "failed") {
            const msgTime = new Date(m.createdAt).getTime();
            if (otherReadTime && msgTime <= otherReadTime) {
              if (m.deliveryStatus !== "read") {
                updatedMsg = { ...m, deliveryStatus: "read" };
                changed = true;
              }
            } else if (otherSyncTime && msgTime <= otherSyncTime) {
              if (m.deliveryStatus !== "read" && m.deliveryStatus !== "delivered") {
                updatedMsg = { ...m, deliveryStatus: "delivered" };
                changed = true;
              }
            }
          }
          map.set(updatedMsg.id, updatedMsg);
        }

        // 2. Merge or replace new messages
        if (newMsgs.length > 0) {
          changed = true;
          for (const nm of newMsgs) {
            // If an optimistic message matches the client idempotency key, reconcile it
            if (nm.clientIdempotencyKey) {
              for (const [id, m] of map.entries()) {
                if (m.clientIdempotencyKey === nm.clientIdempotencyKey) {
                  map.delete(id);
                }
              }
            }
            map.set(nm.id, nm);
          }
        }

        if (!changed) {
          return prev;
        }

        return Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      // Mark as read since user is actively in the conversation and there are incoming messages
      if (newMsgs.length > 0 && typeof document !== "undefined" && !document.hidden) {
        void markAsRead(selectedConversationId);
      }

      // Update recipient presence if returned
      if (data.recipientPresence) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.conversation.id === selectedConversationId && c.recipient) {
              return {
                ...c,
                recipient: {
                  ...c.recipient,
                  presence: data.recipientPresence,
                },
              };
            }
            return c;
          })
        );
      }
    } catch {
      // Ignore background poll errors
    } finally {
      isPollingMessagesRef.current = false;
    }
  }, [selectedConversationId, currentEmployeeId, markAsRead]);

  // 6. Delta poll sidebar conversations
  const pollSidebar = useCallback(async () => {
    if (isPollingSidebarRef.current) return;
    isPollingSidebarRef.current = true;
    try {
      const res = await fetch("/api/app/chat/conversations");
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.conversations) {
          setConversations(data.conversations);
        }
      }
    } catch {
      // Ignore background poll errors
    } finally {
      isPollingSidebarRef.current = false;
    }
  }, []);

  // 7. Adaptive Polling & Presence Heartbeat Loop
  useEffect(() => {
    let threadTimer: NodeJS.Timeout | null = null;
    let sidebarTimer: NodeJS.Timeout | null = null;
    let presenceTimer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    // Helper to send presence heartbeat
    const sendPresence = async (status: "online" | "away" = "online") => {
      try {
        await fetch("/api/app/chat/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } catch {
        // Ignore heartbeat error
      }
    };

    const scheduleIntervals = () => {
      if (isCancelled) return;
      if (threadTimer) clearInterval(threadTimer);
      if (sidebarTimer) clearInterval(sidebarTimer);
      if (presenceTimer) clearInterval(presenceTimer);

      const isHidden = typeof document !== "undefined" && document.hidden;
      const threadInterval = isHidden ? 20000 : 3000;
      const sidebarInterval = isHidden ? 25000 : 8000;
      const presenceInterval = 25000;

      // Start thread polling if conversation is selected
      if (selectedConversationId) {
        threadTimer = setInterval(() => {
          void pollActiveThread();
        }, threadInterval);
      }

      // Start sidebar polling
      sidebarTimer = setInterval(() => {
        void pollSidebar();
      }, sidebarInterval);

      // Presence heartbeat when visible
      if (!isHidden) {
        void sendPresence("online");
        presenceTimer = setInterval(() => {
          void sendPresence("online");
        }, presenceInterval);
      }
    };

    scheduleIntervals();

    const handleVisibilityChange = () => {
      scheduleIntervals();
      if (typeof document !== "undefined" && !document.hidden && selectedConversationId) {
        void pollActiveThread();
        void pollSidebar();
        void markAsRead(selectedConversationId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (threadTimer) clearInterval(threadTimer);
      if (sidebarTimer) clearInterval(sidebarTimer);
      if (presenceTimer) clearInterval(presenceTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedConversationId, pollActiveThread, pollSidebar, markAsRead]);

  // 8. Load older messages (pagination)
  const handleLoadOlder = useCallback(async () => {
    if (!selectedConversationId || messages.length === 0 || loadingOlder) return;

    const oldest = messages.find((m) => !m.id.startsWith("temp-"));
    if (!oldest?.createdAt) return;

    setLoadingOlder(true);
    try {
      const url = `/api/app/chat/conversations/${selectedConversationId}/messages?limit=50&before=${encodeURIComponent(
        oldest.createdAt
      )}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to load older messages.");
      }
      const olderMsgs: MessageItem[] = data.messages ?? [];
      if (olderMsgs.length < 50) {
        setHasMoreOlder(false);
      }
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredOlder = olderMsgs.filter((m) => !existingIds.has(m.id));
        return [...filteredOlder, ...prev];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load older messages.");
    } finally {
      setLoadingOlder(false);
    }
  }, [selectedConversationId, messages, loadingOlder]);

  // 9. Dispatch a message over HTTP with 25s timeout
  const executeSendMessageRequest = useCallback(
    async (convId: string, content: string, idempotencyKey: string): Promise<MessageItem> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const res = await fetch(`/api/app/chat/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            content,
            type: "text",
            clientIdempotencyKey: idempotencyKey,
          }),
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error?.message ?? `Send failed with HTTP ${res.status}`);
        }
        return data.message;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw new Error("Message send timed out. Please retry.");
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    []
  );

  // Helper to check if a message with an idempotency key was actually persisted
  const checkIfMessagePersisted = useCallback(
    async (convId: string, idempotencyKey: string): Promise<MessageItem | null> => {
      try {
        const res = await fetch(`/api/app/chat/conversations/${convId}/messages?limit=10`);
        if (!res.ok) return null;
        const data = await res.json().catch(() => ({}));
        const msgs: MessageItem[] = data.messages ?? [];
        return msgs.find((m) => m.clientIdempotencyKey === idempotencyKey) ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  // 10. Send message with optimistic update
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversationId || !content.trim()) return;

      const idempotencyKey = crypto.randomUUID();
      const tempId = `temp-${idempotencyKey}`;
      const now = new Date().toISOString();

      // Create optimistic message
      const optimisticMsg: MessageItem = {
        id: tempId,
        conversationId: selectedConversationId,
        senderEmployeeId: currentEmployeeId,
        content,
        type: "text",
        clientIdempotencyKey: idempotencyKey,
        createdAt: now,
        deliveryStatus: "sending",
        sender: {
          id: currentEmployeeId,
          displayName: "You",
        },
      };

      // Append immediately
      setMessages((prev) => [...prev, optimisticMsg]);
      setSending(true);
      setError(null);

      try {
        const persisted = await executeSendMessageRequest(
          selectedConversationId,
          content,
          idempotencyKey
        );

        // Reconcile optimistic message with persisted message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId || m.clientIdempotencyKey === idempotencyKey
              ? { ...persisted, deliveryStatus: "sent" }
              : m
          )
        );

        // Update sidebar in background
        void pollSidebar();
      } catch (err) {
        // If aborted or network dropped, verify if the server actually persisted the message
        const alreadyPersisted = await checkIfMessagePersisted(selectedConversationId, idempotencyKey);
        if (alreadyPersisted) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId || m.clientIdempotencyKey === idempotencyKey
                ? { ...alreadyPersisted, deliveryStatus: alreadyPersisted.deliveryStatus ?? "sent" }
                : m
            )
          );
          void pollSidebar();
          return;
        }

        const errMsg = err instanceof Error ? err.message : "Failed to send message.";
        // Mark optimistic message as failed with retry action
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId || m.clientIdempotencyKey === idempotencyKey
              ? { ...m, deliveryStatus: "failed", sendError: errMsg }
              : m
          )
        );
      } finally {
        setSending(false);
      }
    },
    [selectedConversationId, currentEmployeeId, executeSendMessageRequest, checkIfMessagePersisted, pollSidebar]
  );

  // 11. Send file attachment (image, pdf, voice message)
  const handleSendAttachment = useCallback(
    async (file: File, caption?: string) => {
      if (!selectedConversationId) return;

      const idempotencyKey = crypto.randomUUID();
      const tempId = `temp-${idempotencyKey}`;
      const now = new Date().toISOString();

      let category: "image" | "document" | "audio" = "document";
      if (file.type.startsWith("image/")) category = "image";
      else if (file.type.startsWith("audio/") || file.name.endsWith(".webm") || file.name.endsWith(".ogg")) category = "audio";

      const optimisticMsg: MessageItem = {
        id: tempId,
        conversationId: selectedConversationId,
        senderEmployeeId: currentEmployeeId,
        content: caption || null,
        type: "file",
        clientIdempotencyKey: idempotencyKey,
        createdAt: now,
        deliveryStatus: "sending",
        sender: {
          id: currentEmployeeId,
          displayName: "You",
        },
        attachment: {
          id: `temp-att-${idempotencyKey}`,
          fileName: file.name,
          mimeType: file.type || (category === "audio" ? "audio/webm" : "application/octet-stream"),
          fileSize: file.size,
          category,
        },
        reactions: [],
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setSending(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (caption) formData.append("content", caption);
        formData.append("clientIdempotencyKey", idempotencyKey);

        const res = await fetch(
          `/api/app/chat/conversations/${selectedConversationId}/attachments`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error?.message ?? `Upload failed with HTTP ${res.status}`);
        }

        const persisted: MessageItem = data.message;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId || m.clientIdempotencyKey === idempotencyKey
              ? { ...persisted, deliveryStatus: "sent" }
              : m
          )
        );

        void pollSidebar();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to upload attachment.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId || m.clientIdempotencyKey === idempotencyKey
              ? { ...m, deliveryStatus: "failed", sendError: errMsg }
              : m
          )
        );
      } finally {
        setSending(false);
      }
    },
    [selectedConversationId, currentEmployeeId, pollSidebar]
  );

  // 12. Toggle reaction on message
  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!selectedConversationId) return;

      // Optimistically toggle reaction locally
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;

          const currentReactions = m.reactions ?? [];
          const existingGroup = currentReactions.find((r) => r.emoji === emoji);

          let nextReactions: typeof currentReactions;
          if (existingGroup && existingGroup.reactedByMe) {
            if (existingGroup.count <= 1) {
              nextReactions = currentReactions.filter((r) => r.emoji !== emoji);
            } else {
              nextReactions = currentReactions.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      reactedByMe: false,
                      employeeNames: r.employeeNames.filter((name) => name !== "You"),
                    }
                  : r
              );
            }
          } else if (existingGroup && !existingGroup.reactedByMe) {
            nextReactions = currentReactions.map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count + 1,
                    reactedByMe: true,
                    employeeNames: [...r.employeeNames, "You"],
                  }
                : r
            );
          } else {
            nextReactions = [
              ...currentReactions,
              {
                emoji,
                count: 1,
                reactedByMe: true,
                employeeNames: ["You"],
              },
            ];
          }

          return {
            ...m,
            reactions: nextReactions,
          };
        })
      );

      try {
        const res = await fetch(
          `/api/app/chat/conversations/${selectedConversationId}/messages/${messageId}/reactions`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ emoji }),
          }
        );
        if (!res.ok) {
          void pollActiveThread();
        }
      } catch {
        void pollActiveThread();
      }
    },
    [selectedConversationId, pollActiveThread]
  );

  // 13. Navigate to message from search result
  const handleNavigateToMessage = useCallback(
    (convId: string, messageId: string) => {
      setSelectedConversationId(convId);
      setSearchDialogOpen(false);

      setTimeout(() => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary", "rounded-2xl");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-primary", "rounded-2xl");
          }, 3000);
        }
      }, 500);
    },
    []
  );

  // 11. Retry failed message
  const handleRetrySend = useCallback(
    async (failedMsg: MessageItem) => {
      if (!selectedConversationId || !failedMsg.content) return;

      const idempotencyKey = failedMsg.clientIdempotencyKey || crypto.randomUUID();

      // Reset to sending state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id
            ? { ...m, deliveryStatus: "sending", sendError: null }
            : m
        )
      );

      try {
        const persisted = await executeSendMessageRequest(
          selectedConversationId,
          failedMsg.content,
          idempotencyKey
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === failedMsg.id || m.clientIdempotencyKey === idempotencyKey
              ? { ...persisted, deliveryStatus: "sent" }
              : m
          )
        );

        void pollSidebar();
      } catch (err) {
        const alreadyPersisted = await checkIfMessagePersisted(selectedConversationId, idempotencyKey);
        if (alreadyPersisted) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === failedMsg.id || m.clientIdempotencyKey === idempotencyKey
                ? { ...alreadyPersisted, deliveryStatus: alreadyPersisted.deliveryStatus ?? "sent" }
                : m
            )
          );
          void pollSidebar();
          return;
        }

        const errMsg = err instanceof Error ? err.message : "Failed to send message.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === failedMsg.id
              ? { ...m, deliveryStatus: "failed", sendError: errMsg }
              : m
          )
        );
      }
    },
    [selectedConversationId, executeSendMessageRequest, checkIfMessagePersisted, pollSidebar]
  );

  // 12. Signal typing state
  const handleTyping = useCallback(
    async (isTyping: boolean) => {
      if (!selectedConversationId) return;
      try {
        await fetch(`/api/app/chat/conversations/${selectedConversationId}/typing`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ isTyping }),
        });
      } catch {
        // Ignore typing signal errors
      }
    },
    [selectedConversationId]
  );

  // 13. Manual refresh
  const handleRefresh = useCallback(async () => {
    if (!selectedConversationId || refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        loadInitialMessages(selectedConversationId),
        loadConversations(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [selectedConversationId, refreshing, loadInitialMessages, loadConversations]);

  // 14. Create direct conversation
  const handleCreateDirect = useCallback(
    async (recipientId: string) => {
      setError(null);
      const res = await fetch("/api/app/chat/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          employeeIds: [recipientId],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to start direct conversation.");
      }

      const created = data.conversation;
      await loadConversations();
      if (created?.id) {
        setSelectedConversationId(created.id);
      }
    },
    [loadConversations]
  );

  // 15. Create group conversation
  const handleCreateGroup = useCallback(
    async (name: string, employeeIds: string[]) => {
      setError(null);
      const res = await fetch("/api/app/chat/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "group",
          name,
          employeeIds,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to create group conversation.");
      }

      const created = data.conversation;
      setNotice(`Group channel "${name}" created.`);
      await loadConversations();
      if (created?.id) {
        setSelectedConversationId(created.id);
      }
    },
    [loadConversations]
  );

  // 16. Handle task converted
  const handleTaskCreated = useCallback((_taskId: string, messageId: string) => {
    setNotice("Task successfully created from conversation message.");
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, type: "task_reference" as const } : m
      )
    );
  }, []);

  // Selected conversation item
  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.conversation.id === selectedConversationId) ?? null;
  }, [conversations, selectedConversationId]);

  return (
    <div className="space-y-3">
      {/* Notifications / Alerts */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs text-danger shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-semibold underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/5 p-3 text-xs text-success shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-semibold underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Pane Messenger Box */}
      <div className="relative h-[calc(100vh-14.5rem)] min-h-[560px] max-h-[850px] w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_24px_rgba(11,25,48,0.04)]">
        <div className="flex h-full w-full">
          {/* Left Pane: Conversation Sidebar */}
          <div
            className={cn(
              "h-full w-full flex-col md:flex md:w-[320px] lg:w-[360px] shrink-0",
              selectedConversationId ? "hidden md:flex" : "flex"
            )}
          >
            <ConversationSidebar
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              loading={loadingConversations}
              currentEmployeeId={currentEmployeeId}
              onSelectConversation={(id) => setSelectedConversationId(id)}
              onOpenNewDirect={() => setNewDirectOpen(true)}
              onOpenNewGroup={() => setNewGroupOpen(true)}
              onOpenGlobalSearch={() => setSearchDialogOpen(true)}
            />
          </div>

          {/* Right Pane: Active Chat Thread */}
          <div
            className={cn(
              "h-full flex-1 flex-col",
              selectedConversationId ? "flex" : "hidden md:flex"
            )}
          >
            <ChatThread
              conversation={selectedConversation}
              messages={messages}
              currentEmployeeId={currentEmployeeId}
              loadingMessages={loadingMessages}
              loadingOlder={loadingOlder}
              hasMoreOlder={hasMoreOlder}
              sending={sending}
              refreshing={refreshing}
              typers={typers}
              unreadDividerMessageId={unreadDividerMessageId}
              onBack={() => setSelectedConversationId(null)}
              onRefresh={handleRefresh}
              onLoadOlder={handleLoadOlder}
              onSendMessage={handleSendMessage}
              onSendAttachment={handleSendAttachment}
              onConvertToTask={(msg) => setConvertMessage(msg)}
              onTyping={handleTyping}
              onRetrySend={handleRetrySend}
              onOpenProfile={(profile) => setSelectedProfile(profile)}
              onToggleReaction={handleToggleReaction}
              onOpenGlobalSearch={() => setSearchDialogOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <NewDirectChatDialog
        open={newDirectOpen}
        onOpenChange={setNewDirectOpen}
        onSelectRecipient={handleCreateDirect}
      />

      <NewGroupChatDialog
        open={newGroupOpen}
        onOpenChange={setNewGroupOpen}
        onCreateGroup={handleCreateGroup}
      />

      <MessageToTaskDialog
        open={Boolean(convertMessage)}
        onOpenChange={(open) => {
          if (!open) setConvertMessage(null);
        }}
        message={convertMessage}
        onTaskCreated={handleTaskCreated}
      />

      <ChatProfileModal
        open={Boolean(selectedProfile)}
        onOpenChange={(open) => {
          if (!open) setSelectedProfile(null);
        }}
        profile={selectedProfile}
      />

      <ChatSearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onNavigateToMessage={handleNavigateToMessage}
      />
    </div>
  );
}
