import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";

// Mock Radix Dialog portal for server-side static markup rendering
vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@radix-ui/react-dialog")>();
  return {
    ...actual,
    Portal: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

import { ConversationListItem } from "./conversation-list-item";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatHeader } from "./chat-header";
import { MessageBubble } from "./message-bubble";
import { MessageList } from "./message-list";
import { ChatInputBar } from "./chat-input-bar";
import { ChatThread } from "./chat-thread";
import { NewDirectChatDialog } from "./new-direct-chat-dialog";
import { NewGroupChatDialog } from "./new-group-chat-dialog";
import { MessageToTaskDialog } from "./message-to-task-dialog";
import { ChatProfileModal } from "./chat-profile-modal";
import { EmojiPicker } from "./emoji-picker";
import { AudioPlayer } from "./audio-player";
import { ChatSearchDialog } from "./chat-search-dialog";
import { ImageLightboxModal } from "./image-lightbox-modal";
import type { ConversationItem, MessageItem } from "./types";
import { formatConversationTime, formatMessageTime, formatDateDivider, getInitials } from "./utils";

describe("Phase 2 — WhatsApp/Messenger-Style Internal Chat UI Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockDirectConversation: ConversationItem = {
    conversation: {
      id: "conv-direct-101",
      type: "direct",
      name: null,
      updatedAt: "2026-10-19T09:30:00Z",
    },
    member: {
      id: "mem-1",
      role: "owner",
      employeeId: "emp-self",
      lastReadAt: "2026-10-19T09:00:00Z",
    },
    employee: {
      id: "emp-peer",
      displayName: "Priya Sharma",
      employeeId: "EMP-042",
      workEmail: "priya.sharma@example.com",
      status: "active",
      departmentName: "Engineering",
      designationTitle: "Senior Frontend Engineer",
    },
    recipient: {
      id: "emp-peer",
      displayName: "Priya Sharma",
      employeeId: "EMP-042",
      workEmail: "priya.sharma@example.com",
      status: "active",
      departmentName: "Engineering",
      designationTitle: "Senior Frontend Engineer",
    },
  };

  const mockGroupConversation: ConversationItem = {
    conversation: {
      id: "conv-group-202",
      type: "group",
      name: "Release Squad Q4",
      updatedAt: "2026-10-19T08:15:00Z",
    },
    member: {
      id: "mem-2",
      role: "member",
      employeeId: "emp-self",
      lastReadAt: "2026-10-19T08:00:00Z",
    },
    employee: {
      id: "emp-self",
      displayName: "Naresh M",
      employeeId: "EMP-001",
      workEmail: "naresh@example.com",
    },
    recipient: null,
  };

  const mockTextMessage: MessageItem = {
    id: "msg-001",
    conversationId: "conv-direct-101",
    senderEmployeeId: "emp-peer",
    content: "Hey, can you review the deployment checklist?",
    type: "text",
    replyToMessageId: null,
    clientIdempotencyKey: "client-key-1",
    createdAt: "2026-10-19T09:15:00Z",
    sender: {
      id: "emp-peer",
      displayName: "Priya Sharma",
      employeeId: "EMP-042",
    },
  };

  const mockOutgoingMessage: MessageItem = {
    id: "msg-002",
    conversationId: "conv-direct-101",
    senderEmployeeId: "emp-self",
    content: "Sure, looking at it right now.",
    type: "text",
    replyToMessageId: null,
    clientIdempotencyKey: "client-key-2",
    createdAt: "2026-10-19T09:16:00Z",
    sender: {
      id: "emp-self",
      displayName: "Naresh M",
      employeeId: "EMP-001",
    },
  };

  const mockTaskReferenceMessage: MessageItem = {
    id: "msg-003",
    conversationId: "conv-direct-101",
    senderEmployeeId: "emp-peer",
    content: "Migrate database connection pool to 20 connections",
    type: "task_reference",
    replyToMessageId: null,
    clientIdempotencyKey: "client-key-3",
    createdAt: "2026-10-19T09:20:00Z",
    sender: {
      id: "emp-peer",
      displayName: "Priya Sharma",
      employeeId: "EMP-042",
    },
  };

  /* ------------------------------------------------------------- */
  /* 1. Format Utilities                                            */
  /* ------------------------------------------------------------- */
  describe("1. Chat Formatting Utilities", () => {
    it("extracts 2-letter initials accurately from single or multi-word names", () => {
      expect(getInitials("Priya Sharma")).toBe("PS");
      expect(getInitials("Naresh")).toBe("NA");
      expect(getInitials("Robert Downey Junior")).toBe("RJ");
      expect(getInitials("")).toBe("?");
      expect(getInitials(null)).toBe("?");
    });

    it("formats message timestamp to 12-hour local time format", () => {
      const timeStr = formatMessageTime("2026-10-19T09:15:00Z");
      expect(timeStr).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)?/i);
    });

    it("handles invalid or null dates safely without throwing", () => {
      expect(formatConversationTime(null)).toBe("");
      expect(formatConversationTime("invalid-date")).toBe("");
      expect(formatMessageTime(null)).toBe("");
      expect(formatDateDivider(null)).toBe("");
    });
  });

  /* ------------------------------------------------------------- */
  /* 2. ConversationListItem Component                              */
  /* ------------------------------------------------------------- */
  describe("2. ConversationListItem", () => {
    it("renders direct conversation with recipient name, subtitle, and initials", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConversationListItem, {
          item: mockDirectConversation,
          isSelected: false,
          onClick: vi.fn(),
        })
      );

      expect(html).toContain("Priya Sharma");
      expect(html).toContain("Senior Frontend Engineer");
      expect(html).toContain("PS");
      expect(html).toContain('data-selected="false"');
    });

    it("renders group conversation with group title and team channel tag", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConversationListItem, {
          item: mockGroupConversation,
          isSelected: false,
          onClick: vi.fn(),
        })
      );

      expect(html).toContain("Release Squad Q4");
      expect(html).toContain("Team Channel");
    });

    it("renders active highlight and indicator bar when isSelected is true", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConversationListItem, {
          item: mockDirectConversation,
          isSelected: true,
          onClick: vi.fn(),
        })
      );

      expect(html).toContain('data-selected="true"');
      expect(html).toContain('aria-current="true"');
      expect(html).toContain("bg-primary/10");
    });
  });

  /* ------------------------------------------------------------- */
  /* 3. ConversationSidebar Component                               */
  /* ------------------------------------------------------------- */
  describe("3. ConversationSidebar", () => {
    it("renders conversation sidebar header with New Chat and New Group buttons", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConversationSidebar, {
          conversations: [mockDirectConversation, mockGroupConversation],
          selectedConversationId: null,
          loading: false,
          onSelectConversation: vi.fn(),
          onOpenNewDirect: vi.fn(),
          onOpenNewGroup: vi.fn(),
        })
      );

      expect(html).toContain("Messages");
      expect(html).toContain("New Chat");
      expect(html).toContain("New Group");
      expect(html).toContain("Search conversations…");
      expect(html).toContain("All (2)");
      expect(html).toContain("Direct");
      expect(html).toContain("Groups");
      expect(html).toContain("Priya Sharma");
      expect(html).toContain("Release Squad Q4");
    });

    it("renders loading skeleton placeholders when loading is true", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConversationSidebar, {
          conversations: [],
          selectedConversationId: null,
          loading: true,
          onSelectConversation: vi.fn(),
          onOpenNewDirect: vi.fn(),
          onOpenNewGroup: vi.fn(),
        })
      );

      expect(html).toContain("animate-pulse");
    });

    it("renders empty state with call-to-action button when 0 conversations exist", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConversationSidebar, {
          conversations: [],
          selectedConversationId: null,
          loading: false,
          onSelectConversation: vi.fn(),
          onOpenNewDirect: vi.fn(),
          onOpenNewGroup: vi.fn(),
        })
      );

      expect(html).toContain("No conversations yet");
      expect(html).toContain("Start a Conversation");
    });
  });

  /* ------------------------------------------------------------- */
  /* 4. ChatHeader Component                                        */
  /* ------------------------------------------------------------- */
  describe("4. ChatHeader", () => {
    it("renders direct chat recipient title, department, and initials", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatHeader, {
          conversation: mockDirectConversation,
          onBack: vi.fn(),
          onRefresh: vi.fn(),
          refreshing: false,
        })
      );

      expect(html).toContain("Priya Sharma");
      expect(html).toContain("Senior Frontend Engineer");
      expect(html).toContain("Engineering");
      expect(html).toContain("PS");
      expect(html).toContain("Back to conversations");
    });

    it("renders group conversation header with Group badge", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatHeader, {
          conversation: mockGroupConversation,
        })
      );

      expect(html).toContain("Release Squad Q4");
      expect(html).toContain("Team Channel");
      expect(html).toContain("Group");
    });

    it("returns null when conversation is null", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatHeader, {
          conversation: null,
        })
      );
      expect(html).toBe("");
    });
  });

  /* ------------------------------------------------------------- */
  /* 5. MessageBubble Component                                     */
  /* ------------------------------------------------------------- */
  describe("5. MessageBubble", () => {
    it("renders incoming message left-aligned with surface styling", () => {
      const html = renderToStaticMarkup(
        React.createElement(MessageBubble, {
          message: mockTextMessage,
          isOutgoing: false,
          isGroup: false,
          onConvertToTask: vi.fn(),
        })
      );

      expect(html).toContain("justify-start");
      expect(html).toContain("Hey, can you review the deployment checklist?");
      expect(html).toContain("Create task");
    });

    it("renders outgoing message right-aligned with primary styling", () => {
      const html = renderToStaticMarkup(
        React.createElement(MessageBubble, {
          message: mockOutgoingMessage,
          isOutgoing: true,
          isGroup: false,
          onConvertToTask: vi.fn(),
        })
      );

      expect(html).toContain("justify-end");
      expect(html).toContain("Sure, looking at it right now.");
      expect(html).toContain("bg-primary text-primary-foreground");
    });

    it("renders sender display name for incoming message in group channels", () => {
      const html = renderToStaticMarkup(
        React.createElement(MessageBubble, {
          message: mockTextMessage,
          isOutgoing: false,
          isGroup: true,
          onConvertToTask: vi.fn(),
        })
      );

      expect(html).toContain("Priya Sharma");
    });

    it("renders Converted to Task badge when message type is task_reference", () => {
      const html = renderToStaticMarkup(
        React.createElement(MessageBubble, {
          message: mockTaskReferenceMessage,
          isOutgoing: false,
          isGroup: false,
          onConvertToTask: vi.fn(),
        })
      );

      expect(html).toContain("Converted to Task");
      expect(html).toContain("Migrate database connection pool to 20 connections");
    });
  });

  /* ------------------------------------------------------------- */
  /* 6. MessageList Component                                       */
  /* ------------------------------------------------------------- */
  describe("6. MessageList", () => {
    it("renders empty state message when conversation has 0 messages", () => {
      const html = renderToStaticMarkup(
        React.createElement(MessageList, {
          messages: [],
          currentEmployeeId: "emp-self",
          isGroup: false,
          loadingOlder: false,
          hasMoreOlder: false,
          onLoadOlder: vi.fn(),
          onConvertToTask: vi.fn(),
        })
      );

      expect(html).toContain("No messages yet");
      expect(html).toContain("Start the conversation by sending a message below.");
    });

    it("renders messages list with Load older messages button when hasMoreOlder is true", () => {
      const html = renderToStaticMarkup(
        React.createElement(MessageList, {
          messages: [mockTextMessage, mockOutgoingMessage],
          currentEmployeeId: "emp-self",
          isGroup: false,
          loadingOlder: false,
          hasMoreOlder: true,
          onLoadOlder: vi.fn(),
          onConvertToTask: vi.fn(),
        })
      );

      expect(html).toContain("Load older messages");
      expect(html).toContain("Hey, can you review the deployment checklist?");
      expect(html).toContain("Sure, looking at it right now.");
    });
  });

  /* ------------------------------------------------------------- */
  /* 7. ChatInputBar Component                                      */
  /* ------------------------------------------------------------- */
  describe("7. ChatInputBar", () => {
    it("renders composer textarea and Send button", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatInputBar, {
          onSendMessage: vi.fn(),
          sending: false,
          disabled: false,
        })
      );

      expect(html).toContain("Write a message…");
      expect(html).toContain("Send message");
    });

    it("disables send button when disabled is true", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatInputBar, {
          onSendMessage: vi.fn(),
          sending: false,
          disabled: true,
        })
      );

      expect(html).toContain("disabled");
    });
  });

  /* ------------------------------------------------------------- */
  /* 8. ChatThread Component                                        */
  /* ------------------------------------------------------------- */
  describe("8. ChatThread", () => {
    it("renders placeholder illustration when no conversation is selected", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatThread, {
          conversation: null,
          messages: [],
          currentEmployeeId: "emp-self",
          loadingMessages: false,
          loadingOlder: false,
          hasMoreOlder: false,
          sending: false,
          refreshing: false,
          onLoadOlder: vi.fn(),
          onSendMessage: vi.fn(),
          onConvertToTask: vi.fn(),
        })
      );

      expect(html).toContain("Select a Conversation");
      expect(html).toContain("Tenant Isolated");
      expect(html).toContain("Instant Task Conversion");
    });

    it("renders full active thread (header, messages, and input) when conversation is selected", () => {
      const html = renderToStaticMarkup(
        React.createElement(ChatThread, {
          conversation: mockDirectConversation,
          messages: [mockTextMessage, mockOutgoingMessage],
          currentEmployeeId: "emp-self",
          loadingMessages: false,
          loadingOlder: false,
          hasMoreOlder: false,
          sending: false,
          refreshing: false,
          onLoadOlder: vi.fn(),
          onSendMessage: vi.fn(),
          onConvertToTask: vi.fn(),
        })
      );

      expect(html).toContain("Priya Sharma");
      expect(html).toContain("Hey, can you review the deployment checklist?");
      expect(html).toContain("Write a message…");
    });
  });

  /* ------------------------------------------------------------- */
  /* 9. Modal Dialogs                                               */
  /* ------------------------------------------------------------- */
  describe("9. Modal Dialogs", () => {
    describe("NewDirectChatDialog", () => {
      it("renders nothing when open is false", () => {
        const html = renderToStaticMarkup(
          React.createElement(NewDirectChatDialog, {
            open: false,
            onOpenChange: vi.fn(),
            onSelectRecipient: vi.fn(),
          })
        );
        expect(html).toBe("");
      });

      it("renders dialog with title, search input, and close button when open is true", () => {
        const html = renderToStaticMarkup(
          React.createElement(NewDirectChatDialog, {
            open: true,
            onOpenChange: vi.fn(),
            onSelectRecipient: vi.fn(),
          })
        );

        expect(html).toContain("New Direct Chat");
        expect(html).toContain("Search by name, department, or role…");
        expect(html).toContain("Cancel");
      });
    });

    describe("NewGroupChatDialog", () => {
      it("renders nothing when open is false", () => {
        const html = renderToStaticMarkup(
          React.createElement(NewGroupChatDialog, {
            open: false,
            onOpenChange: vi.fn(),
            onCreateGroup: vi.fn(),
          })
        );
        expect(html).toBe("");
      });

      it("renders channel naming input, member search, and submit button when open is true", () => {
        const html = renderToStaticMarkup(
          React.createElement(NewGroupChatDialog, {
            open: true,
            onOpenChange: vi.fn(),
            onCreateGroup: vi.fn(),
          })
        );

        expect(html).toContain("New Group Channel");
        expect(html).toContain("Channel Name *");
        expect(html).toContain("Add Members");
        expect(html).toContain("Create Channel");
      });
    });

    describe("MessageToTaskDialog", () => {
      it("renders nothing when message is null or open is false", () => {
        const html = renderToStaticMarkup(
          React.createElement(MessageToTaskDialog, {
            open: false,
            onOpenChange: vi.fn(),
            message: null,
            onTaskCreated: vi.fn(),
          })
        );
        expect(html).toBe("");
      });

      it("renders task conversion form pre-populated with message text", () => {
        const html = renderToStaticMarkup(
          React.createElement(MessageToTaskDialog, {
            open: true,
            onOpenChange: vi.fn(),
            message: mockTextMessage,
            onTaskCreated: vi.fn(),
          })
        );

        expect(html).toContain("Create Task from Message");
        expect(html).toContain("Task Title *");
        expect(html).toContain("Hey, can you review the deployment checklist?");
        expect(html).toContain("Create Task");
      });
    });
  });

  describe("Phase 3 — Delivery Receipts, Presence, Profile Modal & Typing Indicators", () => {
    describe("MessageBubble Delivery Statuses", () => {
      it("renders sending status (clock) on outgoing message", () => {
        const msg: MessageItem = {
          ...mockTextMessage,
          deliveryStatus: "sending",
        };
        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: msg,
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(html).toContain('title="Status: sending"');
        expect(html).toContain("lucide-clock");
      });

      it("renders sent status (single check) on outgoing message", () => {
        const msg: MessageItem = {
          ...mockTextMessage,
          deliveryStatus: "sent",
        };
        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: msg,
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(html).toContain('title="Status: sent"');
        expect(html).toContain("lucide-check");
      });

      it("renders delivered status (double check) on outgoing message", () => {
        const msg: MessageItem = {
          ...mockTextMessage,
          deliveryStatus: "delivered",
        };
        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: msg,
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(html).toContain('title="Status: delivered"');
        expect(html).toContain("lucide-check-check");
      });

      it("renders read status (accent double check) on outgoing message", () => {
        const msg: MessageItem = {
          ...mockTextMessage,
          deliveryStatus: "read",
        };
        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: msg,
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(html).toContain('title="Status: read"');
        expect(html).toContain("lucide-check-check");
        expect(html).toContain("text-sky-300");
      });

      it("renders failed status with error message and retry button on outgoing message", () => {
        const msg: MessageItem = {
          ...mockTextMessage,
          deliveryStatus: "failed",
          sendError: "Network connection lost",
        };
        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: msg,
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
            onRetrySend: vi.fn(),
          })
        );
        expect(html).toContain("Network connection lost");
        expect(html).toContain("Retry");
        expect(html).toContain("lucide-circle-alert");
      });

      it("never renders delivery ticks or retry buttons on incoming messages", () => {
        const msg: MessageItem = {
          ...mockTextMessage,
          deliveryStatus: "read",
        };
        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: msg,
            isOutgoing: false,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(html).not.toContain('title="Status: read"');
        expect(html).not.toContain("lucide-check-check");
        expect(html).not.toContain("Retry");
      });
    });

    describe("ConversationListItem Phase 3 Enhancements", () => {
      it("renders unread count badge when unreadCount > 0", () => {
        const conv: ConversationItem = {
          ...mockDirectConversation,
          unreadCount: 4,
        };
        const html = renderToStaticMarkup(
          React.createElement(ConversationListItem, {
            item: conv,
            isSelected: false,
            onClick: vi.fn(),
          })
        );
        expect(html).toContain('aria-label="4 unread messages"');
        expect(html).toContain("4");
      });

      it("renders presence status dot for direct conversations", () => {
        const conv: ConversationItem = {
          ...mockDirectConversation,
          recipient: {
            ...mockDirectConversation.recipient!,
            presence: { status: "online", lastSeenAt: new Date().toISOString() },
          },
        };
        const html = renderToStaticMarkup(
          React.createElement(ConversationListItem, {
            item: conv,
            isSelected: false,
            onClick: vi.fn(),
          })
        );
        expect(html).toContain('title="Status: online"');
        expect(html).toContain("bg-emerald-500");
      });

      it("renders latest message preview and does not render email address", () => {
        const conv: ConversationItem = {
          ...mockDirectConversation,
          lastMessage: {
            id: "msg-last",
            content: "Latest project update is ready",
            type: "text",
            createdAt: new Date().toISOString(),
            senderDisplayName: "Priya Sharma",
            senderEmployeeId: "emp-peer",
          },
        };
        const html = renderToStaticMarkup(
          React.createElement(ConversationListItem, {
            item: conv,
            isSelected: false,
            onClick: vi.fn(),
          })
        );
        expect(html).toContain("Latest project update is ready");
        expect(html).not.toContain("priya.sharma@example.com");
      });
    });

    describe("MessageList Phase 3 Enhancements", () => {
      it("renders New Messages unread divider", () => {
        const html = renderToStaticMarkup(
          React.createElement(MessageList, {
            messages: [mockTextMessage],
            currentEmployeeId: "emp-self",
            isGroup: false,
            loadingOlder: false,
            hasMoreOlder: false,
            unreadDividerMessageId: mockTextMessage.id,
            onLoadOlder: vi.fn(),
            onConvertToTask: vi.fn(),
          })
        );
        expect(html).toContain("New Messages");
      });

      it("renders ephemeral typing indicators banner when typers are active", () => {
        const html = renderToStaticMarkup(
          React.createElement(MessageList, {
            messages: [mockTextMessage],
            currentEmployeeId: "emp-self",
            isGroup: false,
            loadingOlder: false,
            hasMoreOlder: false,
            typers: ["Priya Sharma"],
            onLoadOlder: vi.fn(),
            onConvertToTask: vi.fn(),
          })
        );
        expect(html).toContain("Priya Sharma is typing…");
      });
    });

    describe("ChatHeader Phase 3 Enhancements", () => {
      it("renders online presence status and excludes email address", () => {
        const conv: ConversationItem = {
          ...mockDirectConversation,
          recipient: {
            ...mockDirectConversation.recipient!,
            presence: { status: "online", lastSeenAt: new Date().toISOString() },
          },
        };
        const html = renderToStaticMarkup(
          React.createElement(ChatHeader, {
            conversation: conv,
          })
        );
        expect(html).toContain("Online");
        expect(html).not.toContain("priya.sharma@example.com");
      });

      it("renders group member count", () => {
        const conv: ConversationItem = {
          ...mockGroupConversation,
          conversation: {
            ...mockGroupConversation.conversation,
            memberCount: 5,
          },
        };
        const html = renderToStaticMarkup(
          React.createElement(ChatHeader, {
            conversation: conv,
          })
        );
        expect(html).toContain("5 members • Team Channel");
      });
    });

    describe("ChatProfileModal", () => {
      it("renders safe coworker profile attributes and strictly excludes email, salary, and banking", () => {
        const html = renderToStaticMarkup(
          React.createElement(ChatProfileModal, {
            open: true,
            onOpenChange: vi.fn(),
            profile: {
              id: "emp-peer",
              displayName: "Priya Sharma",
              departmentName: "Engineering",
              designationTitle: "Senior Frontend Engineer",
              presence: { status: "online", lastSeenAt: new Date().toISOString() },
            },
          })
        );

        expect(html).toContain("Priya Sharma");
        expect(html).toContain("Senior Frontend Engineer");
        expect(html).toContain("Engineering");
        expect(html).toContain("Online");

        // Safety assertion: strictly NO sensitive administrative information
        expect(html).not.toContain("@");
        expect(html).not.toContain("salary");
        expect(html).not.toContain("bank");
        expect(html).not.toContain("contract");
      });
    });

    describe("Phase 4 — Delivery Status Indicators, Retry & Receipt Synchronization", () => {
      it("renders appropriate status indicators for sending, sent, delivered, and read", () => {
        const baseMsg: MessageItem = {
          ...mockTextMessage,
          senderEmployeeId: "emp-self",
          sender: { id: "emp-self", displayName: "You" },
        };

        // 1. Sending
        const sendingHtml = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: { ...baseMsg, deliveryStatus: "sending" },
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(sendingHtml).toContain('title="Status: sending"');
        expect(sendingHtml).toContain("animate-pulse");

        // 2. Sent (Single tick)
        const sentHtml = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: { ...baseMsg, deliveryStatus: "sent" },
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(sentHtml).toContain('title="Status: sent"');

        // 3. Delivered (Double white tick)
        const deliveredHtml = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: { ...baseMsg, deliveryStatus: "delivered" },
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(deliveredHtml).toContain('title="Status: delivered"');

        // 4. Read (Double blue tick)
        const readHtml = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: { ...baseMsg, deliveryStatus: "read" },
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );
        expect(readHtml).toContain('title="Status: read"');
        expect(readHtml).toContain("text-sky-300");
      });

      it("renders failed send state with error description and retry button", () => {
        const onRetrySend = vi.fn();
        const failedMsg: MessageItem = {
          ...mockTextMessage,
          senderEmployeeId: "emp-self",
          sender: { id: "emp-self", displayName: "You" },
          deliveryStatus: "failed",
          sendError: "Message send timed out. Please retry.",
        };

        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: failedMsg,
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
            onRetrySend,
          })
        );

        expect(html).toContain("Message send timed out. Please retry.");
        expect(html).toContain("Retry");
        expect(html).toContain("bg-rose-50");
      });
    });

    describe("8. Phase 5 — Media, Emojis, Reactions & Search UI Suite", () => {
      it("renders EmojiPicker with categorized tabs and emoji grid", () => {
        const onSelectEmoji = vi.fn();
        const html = renderToStaticMarkup(
          React.createElement(EmojiPicker, {
            onSelectEmoji,
          })
        );

        expect(html).toContain("Search emoji…");
        expect(html).toContain('title="Smileys"');
        expect(html).toContain('title="Gestures"');
        expect(html).toContain('title="Hearts &amp; Signs"');
        expect(html).toContain('title="Work &amp; Objects"');
        expect(html).toContain("😀");
        expect(html).toContain("😂");
        expect(html).toContain("😍");
      });

      it("renders MessageBubble with an Image attachment preview", () => {
        const imageMessage: MessageItem = {
          ...mockTextMessage,
          type: "file",
          content: "Site inspection photo",
          attachment: {
            id: "att-img-1",
            fileName: "site-photo.jpg",
            mimeType: "image/jpeg",
            fileSize: 2048576,
            category: "image",
          },
        };

        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: imageMessage,
            isOutgoing: false,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );

        expect(html).toContain("/api/app/chat/conversations/conv-direct-101/attachments/att-img-1");
        expect(html).toContain('alt="site-photo.jpg"');
        expect(html).toContain("Site inspection photo");
      });

      it("renders MessageBubble with a PDF Document attachment card", () => {
        const pdfMessage: MessageItem = {
          ...mockTextMessage,
          type: "file",
          content: "Signed contract copy",
          attachment: {
            id: "att-pdf-1",
            fileName: "Contract_Signed.pdf",
            mimeType: "application/pdf",
            fileSize: 3145728, // 3MB
            category: "document",
          },
        };

        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: pdfMessage,
            isOutgoing: true,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );

        expect(html).toContain("Contract_Signed.pdf");
        expect(html).toContain("3.00 MB • PDF Document");
        expect(html).toContain("Signed contract copy");
        expect(html).toContain('download="Contract_Signed.pdf"');
      });

      it("renders MessageBubble with Audio / Voice Message player", () => {
        const audioMessage: MessageItem = {
          ...mockTextMessage,
          type: "file",
          content: null,
          attachment: {
            id: "att-audio-1",
            fileName: "voice-message.webm",
            mimeType: "audio/webm",
            fileSize: 524288,
            category: "audio",
          },
        };

        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: audioMessage,
            isOutgoing: false,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );

        expect(html).toContain('aria-label="Audio scrubber"');
        expect(html).toContain('aria-label="Play voice message"');
        expect(html).toContain("1x");
      });

      it("renders MessageBubble with reaction badges and active highlight for reactedByMe", () => {
        const reactedMessage: MessageItem = {
          ...mockTextMessage,
          reactions: [
            {
              emoji: "👍",
              count: 3,
              reactedByMe: true,
              employeeNames: ["You", "Priya Sharma", "Amit Patel"],
            },
            {
              emoji: "❤️",
              count: 1,
              reactedByMe: false,
              employeeNames: ["Priya Sharma"],
            },
          ],
        };

        const html = renderToStaticMarkup(
          React.createElement(MessageBubble, {
            message: reactedMessage,
            isOutgoing: false,
            isGroup: false,
            onConvertToTask: vi.fn(),
          })
        );

        expect(html).toContain("👍");
        expect(html).toContain("3");
        expect(html).toContain("❤️");
        expect(html).toContain("1");
        expect(html).toContain('title="You, Priya Sharma, Amit Patel"');
        expect(html).toContain("bg-primary/10"); // reactedByMe active styling
      });

      it("renders ChatInputBar with attachment paperclip, emoji button, mic button, and send button", () => {
        const html = renderToStaticMarkup(
          React.createElement(ChatInputBar, {
            onSendMessage: vi.fn(),
            sending: false,
          })
        );

        expect(html).toContain('title="Attach image or document"');
        expect(html).toContain('title="Insert emoji"');
        expect(html).toContain('title="Record voice message"');
        expect(html).toContain('title="Send message"');
        expect(html).toContain('accept="image/jpeg,image/png,image/webp,application/pdf"');
      });

      it("renders ImageLightboxModal with download button and filename", () => {
        const html = renderToStaticMarkup(
          React.createElement(ImageLightboxModal, {
            src: "/api/app/chat/conversations/conv-1/attachments/att-1",
            alt: "photo.jpg",
            fileName: "photo.jpg",
            onClose: vi.fn(),
          })
        );

        expect(html).toContain('download="photo.jpg"');
        expect(html).toContain('alt="photo.jpg"');
        expect(html).toContain("photo.jpg");
      });

      it("renders ChatSearchDialog with search input and keyboard dismissal", () => {
        const html = renderToStaticMarkup(
          React.createElement(ChatSearchDialog, {
            open: true,
            onClose: vi.fn(),
            onNavigateToMessage: vi.fn(),
          })
        );

        expect(html).toContain("Search across all conversations…");
        expect(html).toContain("ESC");
      });

      it("renders AudioPlayer with play button and speed controls", () => {
        const html = renderToStaticMarkup(
          React.createElement(AudioPlayer, {
            src: "/api/app/chat/conversations/conv-1/attachments/att-voice-1",
            isOutgoing: true,
          })
        );

        expect(html).toContain("1x");
        expect(html).toContain("Play voice message");
      });
    });
  });
});

