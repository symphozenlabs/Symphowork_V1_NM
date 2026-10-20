<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import ConversationSidebar from "$lib/components/chat/ConversationSidebar.svelte";
import ChatThread from "$lib/components/chat/ChatThread.svelte";
import NewDirectChatDialog from "$lib/components/chat/NewDirectChatDialog.svelte";
import NewGroupChatDialog from "$lib/components/chat/NewGroupChatDialog.svelte";
import MessageToTaskDialog from "$lib/components/chat/MessageToTaskDialog.svelte";
import ChatProfileModal from "$lib/components/chat/ChatProfileModal.svelte";
import ChatSearchDialog from "$lib/components/chat/ChatSearchDialog.svelte";
import type { ConversationItem, MessageItem } from "$lib/components/chat/types";
import type { ProfileDetails } from "$lib/components/chat/types";
import { dispatchChatUnreadCount } from "$lib/components/chat/unread-event";

import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
const searchParams=$derived(routePage.url.searchParams);
const initialConvId=$derived(searchParams.get("conversationId"));
let conversations=$state<ConversationItem[]>(untrack(()=>([])));
const setConversations=(next:typeof conversations|((previous:typeof conversations)=>typeof conversations))=>{conversations=typeof next==="function"?(next as (previous:typeof conversations)=>typeof conversations)(conversations):next;};
let selectedConversationId=$state<string | null>(untrack(()=>(initialConvId)));
const setSelectedConversationId=(next:typeof selectedConversationId|((previous:typeof selectedConversationId)=>typeof selectedConversationId))=>{selectedConversationId=typeof next==="function"?(next as (previous:typeof selectedConversationId)=>typeof selectedConversationId)(selectedConversationId):next;};
let currentEmployeeId=$state<string>(untrack(()=>("")));
const setCurrentEmployeeId=(next:typeof currentEmployeeId|((previous:typeof currentEmployeeId)=>typeof currentEmployeeId))=>{currentEmployeeId=typeof next==="function"?(next as (previous:typeof currentEmployeeId)=>typeof currentEmployeeId)(currentEmployeeId):next;};
$effect(()=>{conversations;return untrack(() => {
    const unreadConvs = conversations.filter((c) => (c.unreadCount ?? 0) > 0).length;
    dispatchChatUnreadCount(unreadConvs);
  });});
let messages=$state<MessageItem[]>(untrack(()=>([])));
const setMessages=(next:typeof messages|((previous:typeof messages)=>typeof messages))=>{messages=typeof next==="function"?(next as (previous:typeof messages)=>typeof messages)(messages):next;};
let typers=$state<string[]>(untrack(()=>([])));
const setTypers=(next:typeof typers|((previous:typeof typers)=>typeof typers))=>{typers=typeof next==="function"?(next as (previous:typeof typers)=>typeof typers)(typers):next;};
let unreadDividerMessageId=$state<string | null>(untrack(()=>(null)));
const setUnreadDividerMessageId=(next:typeof unreadDividerMessageId|((previous:typeof unreadDividerMessageId)=>typeof unreadDividerMessageId))=>{unreadDividerMessageId=typeof next==="function"?(next as (previous:typeof unreadDividerMessageId)=>typeof unreadDividerMessageId)(unreadDividerMessageId):next;};
let loadingConversations=$state(untrack(()=>(true)));
const setLoadingConversations=(next:typeof loadingConversations|((previous:typeof loadingConversations)=>typeof loadingConversations))=>{loadingConversations=typeof next==="function"?(next as (previous:typeof loadingConversations)=>typeof loadingConversations)(loadingConversations):next;};
let loadingMessages=$state(untrack(()=>(false)));
const setLoadingMessages=(next:typeof loadingMessages|((previous:typeof loadingMessages)=>typeof loadingMessages))=>{loadingMessages=typeof next==="function"?(next as (previous:typeof loadingMessages)=>typeof loadingMessages)(loadingMessages):next;};
let loadingOlder=$state(untrack(()=>(false)));
const setLoadingOlder=(next:typeof loadingOlder|((previous:typeof loadingOlder)=>typeof loadingOlder))=>{loadingOlder=typeof next==="function"?(next as (previous:typeof loadingOlder)=>typeof loadingOlder)(loadingOlder):next;};
let hasMoreOlder=$state(untrack(()=>(false)));
const setHasMoreOlder=(next:typeof hasMoreOlder|((previous:typeof hasMoreOlder)=>typeof hasMoreOlder))=>{hasMoreOlder=typeof next==="function"?(next as (previous:typeof hasMoreOlder)=>typeof hasMoreOlder)(hasMoreOlder):next;};
let sending=$state(untrack(()=>(false)));
const setSending=(next:typeof sending|((previous:typeof sending)=>typeof sending))=>{sending=typeof next==="function"?(next as (previous:typeof sending)=>typeof sending)(sending):next;};
let refreshing=$state(untrack(()=>(false)));
const setRefreshing=(next:typeof refreshing|((previous:typeof refreshing)=>typeof refreshing))=>{refreshing=typeof next==="function"?(next as (previous:typeof refreshing)=>typeof refreshing)(refreshing):next;};
let error=$state<string | null>(untrack(()=>(null)));
const setError=(next:typeof error|((previous:typeof error)=>typeof error))=>{error=typeof next==="function"?(next as (previous:typeof error)=>typeof error)(error):next;};
let notice=$state<string | null>(untrack(()=>(null)));
const setNotice=(next:typeof notice|((previous:typeof notice)=>typeof notice))=>{notice=typeof next==="function"?(next as (previous:typeof notice)=>typeof notice)(notice):next;};
let newDirectOpen=$state(untrack(()=>(false)));
const setNewDirectOpen=(next:typeof newDirectOpen|((previous:typeof newDirectOpen)=>typeof newDirectOpen))=>{newDirectOpen=typeof next==="function"?(next as (previous:typeof newDirectOpen)=>typeof newDirectOpen)(newDirectOpen):next;};
let newGroupOpen=$state(untrack(()=>(false)));
const setNewGroupOpen=(next:typeof newGroupOpen|((previous:typeof newGroupOpen)=>typeof newGroupOpen))=>{newGroupOpen=typeof next==="function"?(next as (previous:typeof newGroupOpen)=>typeof newGroupOpen)(newGroupOpen):next;};
let convertMessage=$state<MessageItem | null>(untrack(()=>(null)));
const setConvertMessage=(next:typeof convertMessage|((previous:typeof convertMessage)=>typeof convertMessage))=>{convertMessage=typeof next==="function"?(next as (previous:typeof convertMessage)=>typeof convertMessage)(convertMessage):next;};
let selectedProfile=$state<ProfileDetails | null>(untrack(()=>(null)));
const setSelectedProfile=(next:typeof selectedProfile|((previous:typeof selectedProfile)=>typeof selectedProfile))=>{selectedProfile=typeof next==="function"?(next as (previous:typeof selectedProfile)=>typeof selectedProfile)(selectedProfile):next;};
let searchDialogOpen=$state(untrack(()=>(false)));
const setSearchDialogOpen=(next:typeof searchDialogOpen|((previous:typeof searchDialogOpen)=>typeof searchDialogOpen))=>{searchDialogOpen=typeof next==="function"?(next as (previous:typeof searchDialogOpen)=>typeof searchDialogOpen)(searchDialogOpen):next;};
$effect(()=>{return untrack(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchDialogOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });});
let isPollingMessagesRef=$state({current:false});
let isPollingSidebarRef=$state({current:false});
let messagesRef=$state({current:[] as MessageItem[]});
$effect(()=>{const value=messages;untrack(()=>{messagesRef.current=value;});});
$effect(()=>{return untrack(() => {
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
  });});
const loadConversations=$derived.by(()=>{initialConvId;return async (preserveSelectedId = true) => {
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
  };});
$effect(()=>{loadConversations;return untrack(() => {
    void loadConversations();
  });});
const markAsRead=$derived.by(()=>{return async (convId: string) => {
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
  };});
const loadInitialMessages=$derived.by(()=>{currentEmployeeId;markAsRead;return async (convId: string) => {
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
  };});
$effect(()=>{selectedConversationId;loadInitialMessages;return untrack(() => {
    if (selectedConversationId) {
      void loadInitialMessages(selectedConversationId);
    } else {
      setMessages([]);
      setTypers([]);
      setUnreadDividerMessageId(null);
    }
  });});
const pollActiveThread=$derived.by(()=>{selectedConversationId;currentEmployeeId;markAsRead;return async () => {
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
  };});
const pollSidebar=$derived.by(()=>{return async () => {
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
  };});
$effect(()=>{selectedConversationId;pollActiveThread;pollSidebar;markAsRead;return untrack(() => {
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
  });});
const handleLoadOlder=$derived.by(()=>{selectedConversationId;messages;loadingOlder;return async () => {
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
  };});
const executeSendMessageRequest=$derived.by(()=>{return async (convId: string, content: string, idempotencyKey: string): Promise<MessageItem> => {
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
    };});
const checkIfMessagePersisted=$derived.by(()=>{return async (convId: string, idempotencyKey: string): Promise<MessageItem | null> => {
      try {
        const res = await fetch(`/api/app/chat/conversations/${convId}/messages?limit=10`);
        if (!res.ok) return null;
        const data = await res.json().catch(() => ({}));
        const msgs: MessageItem[] = data.messages ?? [];
        return msgs.find((m) => m.clientIdempotencyKey === idempotencyKey) ?? null;
      } catch {
        return null;
      }
    };});
const handleSendMessage=$derived.by(()=>{selectedConversationId;currentEmployeeId;executeSendMessageRequest;checkIfMessagePersisted;pollSidebar;return async (content: string) => {
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
    };});
const attachmentAttempts = new Map<string,{file:File;caption?:string;conversationId:string}>();
const attachmentKeys = new WeakMap<File,{key:string;conversationId:string}>();
const handleSendAttachment=$derived.by(()=>{selectedConversationId;currentEmployeeId;pollSidebar;return async (file: File, caption?: string) => {
      if (!selectedConversationId) throw new Error("Select a conversation before uploading.");

      const previous = attachmentKeys.get(file);
      const idempotencyKey = previous?.conversationId === selectedConversationId ? previous.key : crypto.randomUUID();
      attachmentKeys.set(file,{key:idempotencyKey,conversationId:selectedConversationId});
      attachmentAttempts.set(idempotencyKey,{file,caption,conversationId:selectedConversationId});
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

      setMessages((prev) => [...prev.filter(m=>m.clientIdempotencyKey!==idempotencyKey), optimisticMsg]);
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
        if (!res.ok || data.success === false || !data.message) {
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

        attachmentAttempts.delete(idempotencyKey);
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
        throw new Error(errMsg);
      } finally {
        setSending(false);
      }
    };});
const handleToggleReaction=$derived.by(()=>{selectedConversationId;pollActiveThread;return async (messageId: string, emoji: string) => {
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
    };});
const handleNavigateToMessage=$derived.by(()=>{return (convId: string, messageId: string) => {
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
    };});
const handleRetrySend=$derived.by(()=>{selectedConversationId;handleSendAttachment;executeSendMessageRequest;checkIfMessagePersisted;pollSidebar;return async (failedMsg: MessageItem) => {
      if (!selectedConversationId) return;
      if (failedMsg.type === "file") {
        const attempt = attachmentAttempts.get(failedMsg.clientIdempotencyKey ?? "");
        if (!attempt || attempt.conversationId !== selectedConversationId) {setError("Select the original file again to retry this attachment.");return;}
        try {await handleSendAttachment(attempt.file,attempt.caption);} catch (cause) {setError(cause instanceof Error ? cause.message : "Upload failed.");}
        return;
      }
      if (!failedMsg.content) return;

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
    };});
const handleTyping=$derived.by(()=>{selectedConversationId;return async (isTyping: boolean) => {
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
    };});
const handleRefresh=$derived.by(()=>{selectedConversationId;refreshing;loadInitialMessages;loadConversations;return async () => {
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
  };});
const handleCreateDirect=$derived.by(()=>{loadConversations;return async (recipientId: string) => {
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
    };});
const handleCreateGroup=$derived.by(()=>{loadConversations;return async (name: string, employeeIds: string[]) => {
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
    };});
const handleTaskCreated=$derived.by(()=>{return (_taskId: string, messageId: string) => {
    setNotice("Task successfully created from conversation message.");
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, type: "task_reference" as const } : m
      )
    );
  };});
const selectedConversation=$derived.by(() => {
    return conversations.find((c) => c.conversation.id === selectedConversationId) ?? null;
  });

import { cn } from '$lib/utils';</script>
<div class="space-y-3">
      
      {#if error}<div class="flex items-center justify-between rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs text-danger shadow-xs">
          <div class="flex items-center gap-2">
            <SvgIcon name="AlertCircle" class="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onclick={() => setError(null)} class="font-semibold underline hover:opacity-80 cursor-pointer">
            Dismiss
          </button>
        </div>{/if}

      {#if notice}<div class="flex items-center justify-between rounded-xl border border-success/30 bg-success/5 p-3 text-xs text-success shadow-xs">
          <div class="flex items-center gap-2">
            <SvgIcon name="CheckCircle2" class="size-4 shrink-0" />
            <span>{notice}</span>
          </div>
          <button type="button" onclick={() => setNotice(null)} class="font-semibold underline hover:opacity-80 cursor-pointer">
            Dismiss
          </button>
        </div>{/if}

      
      <div class="relative h-[calc(100vh-14.5rem)] min-h-[560px] max-h-[850px] w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_4px_24px_rgba(11,25,48,0.04)]">
        <div class="flex h-full w-full">
          
          <div class={cn(
              "h-full w-full flex-col md:flex md:w-[320px] lg:w-[360px] shrink-0",
              selectedConversationId ? "hidden md:flex" : "flex"
            )}>
            <ConversationSidebar conversations={conversations} selectedConversationId={selectedConversationId} loading={loadingConversations} currentEmployeeId={currentEmployeeId} onSelectConversation={(id) => setSelectedConversationId(id)} onOpenNewDirect={() => setNewDirectOpen(true)} onOpenNewGroup={() => setNewGroupOpen(true)} onOpenGlobalSearch={() => setSearchDialogOpen(true)} />
          </div>

          
          <div class={cn(
              "h-full flex-1 flex-col",
              selectedConversationId ? "flex" : "hidden md:flex"
            )}>
            <ChatThread conversation={selectedConversation} messages={messages} currentEmployeeId={currentEmployeeId} loadingMessages={loadingMessages} loadingOlder={loadingOlder} hasMoreOlder={hasMoreOlder} sending={sending} refreshing={refreshing} typers={typers} unreadDividerMessageId={unreadDividerMessageId} onBack={() => setSelectedConversationId(null)} onRefresh={handleRefresh} onLoadOlder={handleLoadOlder} onSendMessage={handleSendMessage} onSendAttachment={handleSendAttachment} onConvertToTask={(msg) => setConvertMessage(msg)} onTyping={handleTyping} onRetrySend={handleRetrySend} onOpenProfile={(profile) => setSelectedProfile(profile)} onToggleReaction={handleToggleReaction} onOpenGlobalSearch={() => setSearchDialogOpen(true)} />
          </div>
        </div>
      </div>

      
      <NewDirectChatDialog open={newDirectOpen} onOpenChange={setNewDirectOpen} onSelectRecipient={handleCreateDirect} />

      <NewGroupChatDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} onCreateGroup={handleCreateGroup} />

      <MessageToTaskDialog open={Boolean(convertMessage)} onOpenChange={(open) => {
          if (!open) setConvertMessage(null);
        }} message={convertMessage} onTaskCreated={handleTaskCreated} />

      <ChatProfileModal open={Boolean(selectedProfile)} onOpenChange={(open) => {
          if (!open) setSelectedProfile(null);
        }} profile={selectedProfile} />

      <ChatSearchDialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} onNavigateToMessage={handleNavigateToMessage} />
    </div>
