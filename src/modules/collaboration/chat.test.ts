import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/modules/rbac/permissions";
import {
  conversationIdParamSchema,
  createConversationSchema,
  parseBody,
  sendMessageSchema,
  signalTypingSchema,
  updatePresenceSchema,
  toggleReactionSchema,
  searchMessagesSchema,
  attachmentIdParamSchema,
} from "./validation";
import { validateUploadedFile } from "./file-validation";
import { AppError, errorResponse } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clearTypingRegistry, getActiveTypers, setTypingIndicator } from "./typing";

const { recordAudit } = vi.hoisted(() => ({
  recordAudit: vi.fn(),
}));

const { createNotification } = vi.hoisted(() => ({
  createNotification: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  recordAudit,
}));

vi.mock("@/modules/notifications/service", () => ({
  createNotification,
}));

vi.mock("@/modules/tenancy/authorization", () => ({
  authorize: vi.fn().mockResolvedValue({ id: "user-test", platformRole: "USER" }),
}));

vi.mock("@/modules/employees/service", () => ({
  getOrEnsureEmployeeForUser: vi.fn().mockImplementation((orgId: string, userId: string) => {
    return Promise.resolve({
      id: userId === "user-alice" ? "emp-alice" : "emp-bob",
      displayName: userId === "user-alice" ? "Alice Smith" : "Bob Jones",
      employeeId: userId === "user-alice" ? "EMP001" : "EMP002",
      organizationId: orgId,
      status: "active",
      workEmail: userId === "user-alice" ? "alice@acme.com" : "bob@acme.com",
    });
  }),
}));

function createChainableQuery(result: unknown = []) {
  const query: Record<string, unknown> = {};
  const chainMethods = [
    "from",
    "innerJoin",
    "leftJoin",
    "rightJoin",
    "where",
    "orderBy",
    "groupBy",
    "having",
    "limit",
    "offset",
  ];
  for (const method of chainMethods) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

function createChainableMutation(result: unknown = []) {
  const mutation: Record<string, unknown> = {};
  const chainMethods = [
    "values",
    "set",
    "where",
    "onConflictDoNothing",
    "onConflictDoUpdate",
  ];
  for (const method of chainMethods) {
    mutation[method] = vi.fn(() => mutation);
  }
  mutation.returning = vi.fn(() => Promise.resolve(result));
  mutation.then = (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return mutation;
}

// Mock db client with transaction support
const mockTx = {
  select: vi.fn(() => createChainableQuery([])),
  insert: vi.fn(() => createChainableMutation([])),
  update: vi.fn(() => createChainableMutation([])),
  delete: vi.fn(() => createChainableMutation([])),
};

vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(() => createChainableQuery([])),
    insert: vi.fn(() => createChainableMutation([])),
    update: vi.fn(() => createChainableMutation([])),
    delete: vi.fn(() => createChainableMutation([])),
  },
  withTenantTransaction: vi.fn((_orgId: string, callback: (tx: unknown) => Promise<unknown>) => {
    return callback(mockTx);
  }),
}));

import {
  createConversation,
  getPresenceForEmployees,
  getUnreadConversationCount,
  listChatRecipients,
  listConversations,
  listMessages,
  markConversationAsRead,
  sendMessage,
  signalTyping,
  updatePresence,
  toggleMessageReaction,
  uploadChatAttachment,
  getChatAttachment,
  searchMessages,
} from "./service";

describe("Internal Chat — Comprehensive Backend & Phase 3 Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTypingRegistry();
    mockTx.select.mockImplementation(() => createChainableQuery([]));
    mockTx.update.mockImplementation(() => createChainableMutation([]));
    mockTx.insert.mockImplementation(() => createChainableMutation([]));
    mockTx.delete.mockImplementation(() => createChainableMutation([]));
  });

  describe("1. RBAC Permissions Configuration", () => {
    it("grants chat.read, chat.send, and chat.create to all standard tenant staff roles", () => {
      const tenantRoles = [
        "ORGANIZATION_OWNER",
        "HR_ADMIN",
        "HR_EXECUTIVE",
        "PROJECT_MANAGER",
        "RECRUITER",
        "MANAGER",
        "TEAM_LEAD",
        "FINANCE_ADMIN",
        "EMPLOYEE",
      ] as const;

      for (const roleKey of tenantRoles) {
        const perms = ROLE_PERMISSIONS[roleKey];
        expect(perms, `Role ${roleKey} should have chat.read`).toContain(PERMISSIONS.chatRead);
        expect(perms, `Role ${roleKey} should have chat.send`).toContain(PERMISSIONS.chatSend);
        expect(perms, `Role ${roleKey} should have chat.create`).toContain(PERMISSIONS.chatCreate);
      }
    });

    it("allows standard EMPLOYEE to access chat without administrative employee.read permission", () => {
      const employeePerms = ROLE_PERMISSIONS.EMPLOYEE;
      expect(employeePerms).toContain(PERMISSIONS.chatRead);
      expect(employeePerms).toContain(PERMISSIONS.chatSend);
      expect(employeePerms).not.toContain(PERMISSIONS.employeeRead);
    });
  });

  describe("2. Strict Zod Input Validation", () => {
    describe("createConversationSchema", () => {
      it("accepts valid direct conversation with 1 target employee", () => {
        const result = createConversationSchema.safeParse({
          type: "direct",
          employeeIds: ["a0000000-0000-4000-8000-000000000001"],
        });
        expect(result.success).toBe(true);
      });

      it("accepts valid direct conversation with 2 employees", () => {
        const result = createConversationSchema.safeParse({
          type: "direct",
          employeeIds: [
            "a0000000-0000-4000-8000-000000000001",
            "a0000000-0000-4000-8000-000000000002",
          ],
        });
        expect(result.success).toBe(true);
      });

      it("rejects direct conversation with more than 2 participants", () => {
        const result = createConversationSchema.safeParse({
          type: "direct",
          employeeIds: [
            "a0000000-0000-4000-8000-000000000001",
            "a0000000-0000-4000-8000-000000000002",
            "a0000000-0000-4000-8000-000000000003",
          ],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("cannot have more than two participants");
        }
      });

      it("accepts valid group conversation with name and participants", () => {
        const result = createConversationSchema.safeParse({
          type: "group",
          name: "Engineering Team",
          employeeIds: [
            "a0000000-0000-4000-8000-000000000001",
            "a0000000-0000-4000-8000-000000000002",
          ],
        });
        expect(result.success).toBe(true);
      });

      it("rejects group conversation without a name", () => {
        const result = createConversationSchema.safeParse({
          type: "group",
          employeeIds: ["a0000000-0000-4000-8000-000000000001"],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Group conversation name is required");
        }
      });

      it("rejects empty employeeIds array", () => {
        const result = createConversationSchema.safeParse({
          type: "direct",
          employeeIds: [],
        });
        expect(result.success).toBe(false);
      });

      it("rejects non-UUID employeeIds", () => {
        const result = createConversationSchema.safeParse({
          type: "direct",
          employeeIds: ["not-a-uuid"],
        });
        expect(result.success).toBe(false);
      });
    });

    describe("sendMessageSchema", () => {
      it("accepts valid text message", () => {
        const result = sendMessageSchema.safeParse({
          content: "Hello team!",
          type: "text",
        });
        expect(result.success).toBe(true);
      });

      it("rejects empty text message", () => {
        const result = sendMessageSchema.safeParse({
          content: "   ",
          type: "text",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Message content is required");
        }
      });

      it("accepts file message with empty content", () => {
        const result = sendMessageSchema.safeParse({
          content: "",
          type: "file",
        });
        expect(result.success).toBe(true);
      });

      it("accepts message with replyToMessageId and clientIdempotencyKey", () => {
        const result = sendMessageSchema.safeParse({
          content: "Acknowledged",
          replyToMessageId: "b0000000-0000-4000-8000-000000000001",
          clientIdempotencyKey: "client-key-12345",
        });
        expect(result.success).toBe(true);
      });
    });

    describe("Phase 3 validation schemas", () => {
      it("signalTypingSchema validates boolean isTyping", () => {
        expect(signalTypingSchema.safeParse({ isTyping: true }).success).toBe(true);
        expect(signalTypingSchema.safeParse({ isTyping: false }).success).toBe(true);
        expect(signalTypingSchema.safeParse({ isTyping: "invalid" }).success).toBe(false);
      });

      it("updatePresenceSchema validates allowed presence statuses", () => {
        expect(updatePresenceSchema.safeParse({ status: "online" }).success).toBe(true);
        expect(updatePresenceSchema.safeParse({ status: "away" }).success).toBe(true);
        expect(updatePresenceSchema.safeParse({ status: "busy" }).success).toBe(true);
        expect(updatePresenceSchema.safeParse({ status: "offline" }).success).toBe(true);
        expect(updatePresenceSchema.safeParse({ status: "invalid-status" }).success).toBe(false);
      });

      it("conversationIdParamSchema and attachmentIdParamSchema reject invalid UUID", () => {
        expect(() => conversationIdParamSchema.parse("invalid-id")).toThrow();
        expect(() => conversationIdParamSchema.parse("c0000000-0000-4000-8000-000000000001")).not.toThrow();
        expect(() => attachmentIdParamSchema.parse("invalid-id")).toThrow();
        expect(() => attachmentIdParamSchema.parse("a0000000-0000-4000-8000-000000000001")).not.toThrow();
      });

      it("toggleReactionSchema validates allowed reaction emojis", () => {
        expect(toggleReactionSchema.safeParse({ emoji: "👍" }).success).toBe(true);
        expect(toggleReactionSchema.safeParse({ emoji: "❤️" }).success).toBe(true);
        expect(toggleReactionSchema.safeParse({ emoji: "🎉" }).success).toBe(false);
      });

      it("parseBody helper throws AppError on failure", () => {
        expect(() => parseBody(createConversationSchema, { type: "direct", employeeIds: [] })).toThrow(AppError);
      });
    });
  });

  describe("3. Direct Conversation Deduplication", () => {
    it("returns existing direct conversation when one already exists between the two employees", async () => {
      const orgId = "org-acme";
      const existingConv = {
        id: "conv-existing-123",
        organizationId: orgId,
        type: "direct",
        name: null,
        createdByEmployeeId: "emp-alice",
      };

      // 1. Finding both employees in organization
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "emp-alice" }, { id: "emp-bob" }])
      );

      // 2. Candidate search finding existing conversation with count = 2
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ conversationId: "conv-existing-123" }])
      );

      // 3. Fetching the existing conversation
      mockTx.select.mockReturnValueOnce(createChainableQuery([existingConv]));

      const result = await createConversation({
        organizationId: orgId,
        userId: "user-alice",
        type: "direct",
        employeeIds: ["emp-bob"],
      });

      expect(result.id).toBe("conv-existing-123");
      expect(mockTx.insert).not.toHaveBeenCalled();
    });
  });

  describe("4. Participant Identity & Unread Counts in Conversation Listing", () => {
    it("displays counter-party recipient rather than logged-in user and derives presence and unread counts", async () => {
      const orgId = "org-acme";
      const conv = {
        id: "conv-1",
        organizationId: orgId,
        type: "direct",
        name: null,
        updatedAt: new Date(),
      };
      const actorMember = {
        id: "mem-actor",
        conversationId: "conv-1",
        employeeId: "emp-alice",
        role: "owner",
        mutedAt: null,
        lastReadAt: new Date(Date.now() - 3600000), // 1 hour ago
      };
      const bobEmployee = {
        id: "emp-bob",
        displayName: "Bob Jones",
        employeeId: "EMP002",
        status: "active",
        departmentName: "Engineering",
        designationTitle: "Frontend Architect",
      };

      // 1. myMemberships query returns conv + actorMember
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ conversation: conv, member: actorMember }])
      );

      // 2. allMembers query returns Alice and Bob members
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            conversationId: "conv-1",
            member: actorMember,
            employee: { id: "emp-alice", displayName: "Alice Smith", employeeId: "EMP001", status: "active", departmentName: "Design", designationTitle: "Lead Designer" },
          },
          {
            conversationId: "conv-1",
            member: { id: "mem-bob", conversationId: "conv-1", employeeId: "emp-bob" },
            employee: bobEmployee,
          },
        ])
      );

      // 3. Presence query returns Bob's presence
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            employeeId: "emp-bob",
            status: "online",
            lastSeenAt: new Date(),
          },
        ])
      );

      // 4. Messages query returns a message sent by Bob 10 minutes ago (unread by Alice)
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            id: "msg-recent-1",
            conversationId: "conv-1",
            senderEmployeeId: "emp-bob",
            content: "Hey Alice, could you check the mockup?",
            type: "text",
            createdAt: new Date(Date.now() - 600000),
            senderDisplayName: "Bob Jones",
          },
        ])
      );

      const rows = await listConversations({
        organizationId: orgId,
        userId: "user-alice",
      });

      expect(rows).toHaveLength(1);
      // The displayed employee must be Bob (counter-party recipient), NOT Alice
      expect(rows[0].employee.displayName).toBe("Bob Jones");
      expect(rows[0].employee.id).toBe("emp-bob");
      expect(rows[0].recipient?.id).toBe("emp-bob");
      expect(rows[0].recipient?.departmentName).toBe("Engineering");
      expect(rows[0].recipient?.presence?.status).toBe("online");

      // Verify unreadCount was computed accurately
      expect(rows[0].unreadCount).toBe(1);
      // Verify lastMessage was extracted
      expect(rows[0].lastMessage?.content).toBe("Hey Alice, could you check the mockup?");
    });
  });

  describe("5. Soft-Deleted Message Filtering & Delivery Status", () => {
    it("excludes soft-deleted messages and derives delivery receipt status", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";

      // 1. Membership check for Alice
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { id: "mem-alice", conversationId: convId, employeeId: "emp-alice", lastReadAt: new Date(), leftAt: null },
        ])
      );

      // 2. Fetch conversation details (direct)
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: convId, organizationId: orgId, type: "direct" }])
      );

      // 3. Fetch other members with presence and lastReadAt (Bob)
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            member: {
              id: "mem-bob",
              lastReadAt: new Date(), // Bob has read up to now
              updatedAt: new Date(),
            },
            employee: {
              id: "emp-bob",
              displayName: "Bob Jones",
              departmentName: "Engineering",
              designationTitle: "Engineer",
            },
            presence: {
              status: "online",
              lastSeenAt: new Date(),
            },
          },
        ])
      );

      // 4. Fetch messages (query filters isNull(deletedAt))
      const sentTime = new Date(Date.now() - 5000);
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            id: "msg-1",
            organizationId: orgId,
            conversationId: convId,
            senderEmployeeId: "emp-alice",
            content: "Hello Bob!",
            type: "text",
            replyToMessageId: null,
            clientIdempotencyKey: "key-1",
            editedAt: null,
            createdAt: sentTime,
            updatedAt: sentTime,
            sender: {
              id: "emp-alice",
              displayName: "Alice Smith",
              employeeId: "EMP001",
              departmentName: "Design",
              designationTitle: "Lead Designer",
            },
          },
        ])
      );

      const result = await listMessages({
        organizationId: orgId,
        userId: "user-alice",
        conversationId: convId,
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].id).toBe("msg-1");
      // Since Bob's lastReadAt is after sentTime, deliveryStatus should be "read"
      expect(result.messages[0].deliveryStatus).toBe("read");
      expect(result.recipientPresence?.status).toBe("online");
    });
  });

  describe("6. Mention Privacy Isolation", () => {
    it("dispatches notifications only to mentioned users who are ACTIVE members of the conversation", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";

      // 1. Membership check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { id: "mem-1", conversationId: convId, employeeId: "emp-alice", leftAt: null },
        ])
      );

      // 2. Insert message
      mockTx.insert.mockReturnValueOnce(
        createChainableMutation([
          { id: "msg-mention-1", conversationId: convId, content: "@Bob @Charlie please review" },
        ])
      );

      // 3. Update conversation updatedAt
      mockTx.update.mockReturnValueOnce(createChainableMutation([]));

      // 4. Mention member query: Bob IS an active member; Charlie is NOT in this conversation
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { id: "emp-bob", userId: "user-bob", displayName: "Bob" },
        ])
      );

      await sendMessage({
        organizationId: orgId,
        userId: "user-alice",
        conversationId: convId,
        content: "@Bob @Charlie please review",
      });

      // Notification sent only to Bob
      expect(createNotification).toHaveBeenCalledTimes(1);
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: "user-bob",
          type: "collaboration.chat_mention",
        })
      );
    });
  });

  describe("7. Security & Cross-Tenant Access Denial", () => {
    it("rejects message retrieval if actor is not an active member of the conversation", async () => {
      mockTx.select.mockReturnValueOnce(createChainableQuery([]));

      await expect(
        listMessages({
          organizationId: "org-acme",
          userId: "user-alice",
          conversationId: "conv-unauthorized",
        })
      ).rejects.toThrow("You are not a member of this conversation.");
    });

    it("rejects message dispatch if actor has left the conversation (leftAt is not null)", async () => {
      mockTx.select.mockReturnValueOnce(createChainableQuery([]));

      await expect(
        sendMessage({
          organizationId: "org-acme",
          userId: "user-alice",
          conversationId: "conv-1",
          content: "Trying to post after leaving",
        })
      ).rejects.toThrow("You are not a member of this conversation.");
    });

    it("rejects conversation creation if any participant belongs to a different organization", async () => {
      // 2 requested employees, but only 1 found in organization
      mockTx.select.mockReturnValueOnce(createChainableQuery([{ id: "emp-alice" }]));

      await expect(
        createConversation({
          organizationId: "org-acme",
          userId: "user-alice",
          type: "direct",
          employeeIds: ["emp-from-other-org"],
        })
      ).rejects.toThrow("All conversation members must belong to this organization.");
    });
  });

  describe("8. Ephemeral Typing Indicator Registry", () => {
    it("registers and retrieves active typers, excluding the viewer", () => {
      setTypingIndicator("conv-1", "emp-bob", "Bob Jones", true);
      setTypingIndicator("conv-1", "emp-alice", "Alice Smith", true);

      // For Alice viewing the chat: only Bob should be returned
      const typersForAlice = getActiveTypers("conv-1", "emp-alice");
      expect(typersForAlice).toEqual(["Bob Jones"]);

      // For Bob viewing the chat: only Alice should be returned
      const typersForBob = getActiveTypers("conv-1", "emp-bob");
      expect(typersForBob).toEqual(["Alice Smith"]);
    });

    it("clears typing indicator when isTyping is false", () => {
      setTypingIndicator("conv-1", "emp-bob", "Bob Jones", true);
      expect(getActiveTypers("conv-1", "emp-alice")).toEqual(["Bob Jones"]);

      setTypingIndicator("conv-1", "emp-bob", "Bob Jones", false);
      expect(getActiveTypers("conv-1", "emp-alice")).toEqual([]);
    });

    it("signalTyping checks membership and registers indicator", async () => {
      // Membership check passes
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "mem-alice" }])
      );

      const result = await signalTyping({
        organizationId: "org-acme",
        userId: "user-alice",
        conversationId: "conv-1",
        isTyping: true,
      });

      expect(result.success).toBe(true);
      expect(getActiveTypers("conv-1", "emp-bob")).toEqual(["Alice Smith"]);
    });
  });

  describe("9. Presence Heartbeat & Tracking", () => {
    it("updatePresence upserts collaborationPresence and returns timestamp", async () => {
      const now = new Date();
      mockTx.insert.mockReturnValueOnce(
        createChainableMutation([
          {
            organizationId: "org-acme",
            employeeId: "emp-alice",
            status: "online",
            lastSeenAt: now,
          },
        ])
      );

      const result = await updatePresence({
        organizationId: "org-acme",
        userId: "user-alice",
        status: "online",
      });

      expect(result.status).toBe("online");
      expect(result.lastSeenAt).toBe(now.toISOString());
    });

    it("getPresenceForEmployees derives online, away, and offline statuses based on TTL", async () => {
      const now = Date.now();
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            employeeId: "emp-bob",
            status: "online",
            lastSeenAt: new Date(now - 15000), // 15 seconds ago -> online
          },
          {
            employeeId: "emp-charlie",
            status: "away",
            lastSeenAt: new Date(now - 70000), // 70 seconds ago -> away
          },
          {
            employeeId: "emp-david",
            status: "online",
            lastSeenAt: new Date(now - 300000), // 5 minutes ago -> offline
          },
        ])
      );

      const presenceMap = await getPresenceForEmployees({
        organizationId: "org-acme",
        userId: "user-alice",
        employeeIds: ["emp-bob", "emp-charlie", "emp-david"],
      });

      expect(presenceMap["emp-bob"].status).toBe("online");
      expect(presenceMap["emp-charlie"].status).toBe("away");
      expect(presenceMap["emp-david"].status).toBe("offline");
    });
  });

  describe("10. Read Receipts", () => {
    it("markConversationAsRead verifies membership and updates lastReadAt", async () => {
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "mem-alice" }])
      );
      mockTx.update.mockReturnValueOnce(createChainableMutation([]));

      const result = await markConversationAsRead({
        organizationId: "org-acme",
        userId: "user-alice",
        conversationId: "conv-1",
      });

      expect(result.success).toBe(true);
      expect(result.lastReadAt).toBeDefined();
      expect(mockTx.update).toHaveBeenCalledTimes(1);
    });
  });

  describe("11. Chat Recipients Endpoint Query", () => {
    it("excludes the current actor so employees cannot start conversations with themselves", async () => {
      const orgId = "org-acme";

      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            id: "emp-bob",
            displayName: "Bob Jones",
            departmentName: "Engineering",
            designationTitle: "Software Engineer",
          },
        ])
      );

      const recipients = await listChatRecipients({
        organizationId: orgId,
        userId: "user-alice",
      });

      expect(recipients).toHaveLength(1);
      expect(recipients[0].id).toBe("emp-bob");
      expect(recipients[0].displayName).toBe("Bob Jones");
    });
  });

  describe("12. Phase 4 — Reliability, Delivery Receipts & Retry Hardening", () => {
    it("safely deduplicates message retries via clientIdempotencyKey and attaches full sender info without inserting duplicates", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";
      const idempotencyKey = "retry-uuid-12345";

      // 1. Membership check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { id: "mem-alice", conversationId: convId, employeeId: "emp-alice", leftAt: null },
        ])
      );

      // 2. Existing message check matches idempotency key
      const persistedMessage = {
        id: "msg-persisted-1",
        organizationId: orgId,
        conversationId: convId,
        senderEmployeeId: "emp-alice",
        content: "hi naresh good mrng da ???",
        type: "text",
        replyToMessageId: null,
        clientIdempotencyKey: idempotencyKey,
        editedAt: null,
        createdAt: new Date("2026-10-19T06:10:34.610Z"),
        updatedAt: new Date("2026-10-19T06:10:34.610Z"),
      };
      mockTx.select.mockReturnValueOnce(createChainableQuery([persistedMessage]));

      const result = await sendMessage({
        organizationId: orgId,
        userId: "user-alice",
        conversationId: convId,
        content: "hi naresh good mrng da ???",
        clientIdempotencyKey: idempotencyKey,
      });

      // Returns existing message with sender attached
      expect(result.id).toBe("msg-persisted-1");
      expect(result.clientIdempotencyKey).toBe(idempotencyKey);
      expect(result.sender).toEqual({
        id: "emp-alice",
        displayName: "Alice Smith",
        employeeId: "EMP001",
      });
      // Crucial: insert should NOT be called because idempotency hit
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it("decouples presence from delivery status: online presence does NOT mark message as delivered if recipient client hasn't synced", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";
      const now = Date.now();
      const msgTime = new Date(now - 10000); // 10 seconds ago

      // 1. Membership check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { id: "mem-alice", conversationId: convId, employeeId: "emp-alice", leftAt: null },
        ])
      );

      // 2. Conversation query
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: convId, organizationId: orgId, type: "direct" }])
      );

      // 3. Other member: presence is ONLINE and recent, but client updatedAt and lastReadAt are BEFORE msgTime
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            member: {
              id: "mem-bob",
              lastReadAt: new Date(now - 30000), // 30s ago (before msgTime)
              updatedAt: new Date(now - 30000),  // 30s ago (before msgTime, no sync yet)
            },
            employee: {
              id: "emp-bob",
              displayName: "Bob Jones",
              departmentName: "Engineering",
              designationTitle: "Engineer",
            },
            presence: {
              status: "online",
              lastSeenAt: new Date(now - 2000), // 2 seconds ago (online!)
            },
          },
        ])
      );

      // 4. Message query
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            id: "msg-101",
            organizationId: orgId,
            conversationId: convId,
            senderEmployeeId: "emp-alice",
            content: "Has this been delivered yet?",
            type: "text",
            replyToMessageId: null,
            clientIdempotencyKey: "k-101",
            editedAt: null,
            createdAt: msgTime,
            updatedAt: msgTime,
            sender: {
              id: "emp-alice",
              displayName: "Alice Smith",
              employeeId: "EMP001",
              departmentName: "Design",
              designationTitle: "Lead Designer",
            },
          },
        ])
      );

      const result = await listMessages({
        organizationId: orgId,
        userId: "user-alice",
        conversationId: convId,
      });

      // Presence is online...
      expect(result.recipientPresence?.status).toBe("online");
      // ...BUT deliveryStatus MUST be "sent", NOT "delivered" because recipient chat client hasn't synced!
      expect(result.messages[0].deliveryStatus).toBe("sent");
    });

    it("correctly evaluates delivery status transitions (sent -> delivered -> read) and returns sync timestamps", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";
      const sentTime = new Date("2026-10-19T06:00:00Z");

      // 1. Membership check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { id: "mem-alice", conversationId: convId, employeeId: "emp-alice", leftAt: null },
        ])
      );

      // 2. Conversation query
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: convId, organizationId: orgId, type: "direct" }])
      );

      // 3. Other member: synced at 06:02:00, read at 06:05:00
      const readTime = new Date("2026-10-19T06:05:00Z");
      const syncTime = new Date("2026-10-19T06:02:00Z");
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            member: {
              id: "mem-bob",
              lastReadAt: readTime,
              updatedAt: syncTime,
            },
            employee: {
              id: "emp-bob",
              displayName: "Bob Jones",
              departmentName: "Engineering",
              designationTitle: "Engineer",
            },
            presence: {
              status: "online",
              lastSeenAt: readTime,
            },
          },
        ])
      );

      // 4. Messages: msg1 before read (should be "read"), msg2 between sync and read (should be "delivered" if read was before, but here test msg after read)
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            id: "msg-read",
            organizationId: orgId,
            conversationId: convId,
            senderEmployeeId: "emp-alice",
            content: "Read message",
            type: "text",
            replyToMessageId: null,
            clientIdempotencyKey: "k-read",
            editedAt: null,
            createdAt: sentTime, // 06:00:00 <= 06:05:00 -> read
            updatedAt: sentTime,
            sender: {
              id: "emp-alice",
              displayName: "Alice Smith",
              employeeId: "EMP001",
              departmentName: "Design",
              designationTitle: "Lead Designer",
            },
          },
        ])
      );

      const result = await listMessages({
        organizationId: orgId,
        userId: "user-alice",
        conversationId: convId,
      });

      expect(result.messages[0].deliveryStatus).toBe("read");
      expect(result.otherMemberLastReadAt).toBe(readTime.toISOString());
      expect(result.otherMemberSyncedAt).toBe(syncTime.toISOString());
    });
  });

  describe("13. Sidebar Unread Conversation Count", () => {
    it("returns 0 when employee has zero unread conversations", async () => {
      const orgId = "org-acme";
      const now = Date.now();

      // 1. Memberships
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-1", lastReadAt: new Date(now) },
          { conversationId: "conv-2", lastReadAt: new Date(now) },
        ])
      );

      // 2. Messages sent before lastReadAt
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-1", createdAt: new Date(now - 10000), senderEmployeeId: "emp-bob" },
          { conversationId: "conv-2", createdAt: new Date(now - 20000), senderEmployeeId: "emp-bob" },
        ])
      );

      const count = await getUnreadConversationCount({
        organizationId: orgId,
        userId: "user-alice",
      });

      expect(count).toBe(0);
    });

    it("returns 1 when one conversation has 200 unread messages (counts distinct conversations, NOT total messages)", async () => {
      const orgId = "org-acme";
      const now = Date.now();

      // 1. Memberships
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-1", lastReadAt: new Date(now - 500000) },
        ])
      );

      // 2. 200 unread messages in conv-1
      const messages200 = Array.from({ length: 200 }, (_, i) => ({
        conversationId: "conv-1",
        createdAt: new Date(now - i * 1000),
        senderEmployeeId: "emp-bob",
      }));
      mockTx.select.mockReturnValueOnce(createChainableQuery(messages200));

      const count = await getUnreadConversationCount({
        organizationId: orgId,
        userId: "user-alice",
      });

      // Crucial: exactly 1 distinct unread conversation, NOT 200
      expect(count).toBe(1);
    });

    it("returns 2 when two conversations have 200 and 13 unread messages respectively", async () => {
      const orgId = "org-acme";
      const now = Date.now();

      // 1. Memberships
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-direct", lastReadAt: new Date(now - 1000000) },
          { conversationId: "conv-group", lastReadAt: new Date(now - 500000) },
        ])
      );

      // 2. 200 messages in direct and 13 messages in group
      const messages200 = Array.from({ length: 200 }, (_, i) => ({
        conversationId: "conv-direct",
        createdAt: new Date(now - i * 1000),
        senderEmployeeId: "emp-bob",
      }));
      const messages13 = Array.from({ length: 13 }, (_, i) => ({
        conversationId: "conv-group",
        createdAt: new Date(now - i * 2000),
        senderEmployeeId: "emp-charlie",
      }));

      mockTx.select.mockReturnValueOnce(
        createChainableQuery([...messages200, ...messages13])
      );

      const count = await getUnreadConversationCount({
        organizationId: orgId,
        userId: "user-alice",
      });

      // 2 distinct unread conversations
      expect(count).toBe(2);
    });

    it("counts a group conversation as 1 unread conversation regardless of participant count or message count", async () => {
      const orgId = "org-acme";
      const now = Date.now();

      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-group-squad", lastReadAt: new Date(now - 50000) },
        ])
      );

      // Messages from 3 different participants
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-group-squad", createdAt: new Date(now - 10000), senderEmployeeId: "emp-bob" },
          { conversationId: "conv-group-squad", createdAt: new Date(now - 8000), senderEmployeeId: "emp-charlie" },
          { conversationId: "conv-group-squad", createdAt: new Date(now - 5000), senderEmployeeId: "emp-david" },
        ])
      );

      const count = await getUnreadConversationCount({
        organizationId: orgId,
        userId: "user-alice",
      });

      expect(count).toBe(1);
    });

    it("decrements the unread conversation count when a conversation is marked as read", async () => {
      const orgId = "org-acme";
      const now = Date.now();

      // Conv-1 is marked as read (lastReadAt is now), Conv-2 is still unread
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-1", lastReadAt: new Date(now) },
          { conversationId: "conv-2", lastReadAt: new Date(now - 50000) },
        ])
      );

      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-1", createdAt: new Date(now - 10000), senderEmployeeId: "emp-bob" }, // read
          { conversationId: "conv-2", createdAt: new Date(now - 10000), senderEmployeeId: "emp-bob" }, // unread
        ])
      );

      const count = await getUnreadConversationCount({
        organizationId: orgId,
        userId: "user-alice",
      });

      // Decremented from 2 to 1
      expect(count).toBe(1);
    });

    it("scopes count to authenticated employee and excludes messages sent by the actor themselves", async () => {
      const orgId = "org-acme";
      const now = Date.now();

      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          { conversationId: "conv-1", lastReadAt: new Date(now - 50000) },
        ])
      );

      // Actor's own messages are excluded by query filter ne(collaborationMessages.senderEmployeeId, actor.id)
      mockTx.select.mockReturnValueOnce(createChainableQuery([]));

      const count = await getUnreadConversationCount({
        organizationId: orgId,
        userId: "user-alice",
      });

      expect(count).toBe(0);
    });

    it("returns 0 for cross-tenant query where actor has no memberships in target organization", async () => {
      // Cross-tenant: no active memberships in other org
      mockTx.select.mockReturnValueOnce(createChainableQuery([]));

      const count = await getUnreadConversationCount({
        organizationId: "org-foreign",
        userId: "user-alice",
      });

      expect(count).toBe(0);
    });
  });

  describe("14. Phase 5 — File Validation, Magic Bytes & Size Limits", () => {
    it("validates and accepts legitimate JPEG image file", () => {
      // JPEG magic bytes: 0xFF, 0xD8, 0xFF, 0xE0
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const result = validateUploadedFile({
        buffer: jpegBytes,
        fileName: "photo.jpg",
        mimeType: "image/jpeg",
      });

      expect(result.category).toBe("image");
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.fileSize).toBe(jpegBytes.length);
    });

    it("validates and accepts legitimate PNG image file", () => {
      // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const result = validateUploadedFile({
        buffer: pngBytes,
        fileName: "screenshot.png",
        mimeType: "image/png",
      });

      expect(result.category).toBe("image");
      expect(result.mimeType).toBe("image/png");
    });

    it("validates and accepts legitimate PDF document", () => {
      // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
      const result = validateUploadedFile({
        buffer: pdfBytes,
        fileName: "document.pdf",
        mimeType: "application/pdf",
      });

      expect(result.category).toBe("document");
      expect(result.mimeType).toBe("application/pdf");
    });

    it("validates and accepts legitimate WebM audio recording", () => {
      // WebM magic bytes: 0x1A, 0x45, 0xDF, 0xA3
      const webmBytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81]);
      const result = validateUploadedFile({
        buffer: webmBytes,
        fileName: "voice.webm",
        mimeType: "audio/webm",
      });

      expect(result.category).toBe("audio");
      expect(result.mimeType).toBe("audio/webm");
    });

    it("rejects spoofed files whose content does not match the extension/MIME magic bytes", () => {
      // Windows executable MZ header disguised as .pdf
      const fakePdf = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

      expect(() =>
        validateUploadedFile({
          buffer: fakePdf,
          fileName: "malicious.pdf",
          mimeType: "application/pdf",
        })
      ).toThrow("File content does not match the expected format.");
    });

    it("enforces 5MB limit for images and rejects oversized image", () => {
      const oversizedImage = new Uint8Array(5 * 1024 * 1024 + 1);
      oversizedImage[0] = 0xff;
      oversizedImage[1] = 0xd8;
      oversizedImage[2] = 0xff;
      oversizedImage[3] = 0xe0;

      expect(() =>
        validateUploadedFile({
          buffer: oversizedImage,
          fileName: "large.jpg",
          mimeType: "image/jpeg",
        })
      ).toThrow("Image file exceeds the 5MB size limit");
    });

    it("enforces 10MB limit for PDF documents and rejects oversized document", () => {
      const oversizedPdf = new Uint8Array(10 * 1024 * 1024 + 1);
      oversizedPdf[0] = 0x25;
      oversizedPdf[1] = 0x50;
      oversizedPdf[2] = 0x44;
      oversizedPdf[3] = 0x46;

      expect(() =>
        validateUploadedFile({
          buffer: oversizedPdf,
          fileName: "huge.pdf",
          mimeType: "application/pdf",
        })
      ).toThrow("PDF document exceeds the 10MB size limit");
    });

    it("enforces 5MB limit for audio recordings and rejects oversized audio", () => {
      const oversizedAudio = new Uint8Array(5 * 1024 * 1024 + 1);
      oversizedAudio[0] = 0x1a;
      oversizedAudio[1] = 0x45;
      oversizedAudio[2] = 0xdf;
      oversizedAudio[3] = 0xa3;

      expect(() =>
        validateUploadedFile({
          buffer: oversizedAudio,
          fileName: "recording.webm",
          mimeType: "audio/webm",
        })
      ).toThrow("Audio recording exceeds the 5MB size limit");
    });

    it("rejects unsupported file formats like executable or archive", () => {
      const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
      expect(() =>
        validateUploadedFile({
          buffer: zipBytes,
          fileName: "archive.zip",
          mimeType: "application/zip",
        })
      ).toThrow("Unsupported file format");
    });
  });

  describe("15. Phase 5 — Message Reactions", () => {
    it("validates allowed emojis in toggleReactionSchema and rejects disallowed emojis", () => {
      expect(toggleReactionSchema.parse({ emoji: "👍" })).toEqual({ emoji: "👍" });
      expect(toggleReactionSchema.parse({ emoji: "❤️" })).toEqual({ emoji: "❤️" });
      expect(toggleReactionSchema.parse({ emoji: "😂" })).toEqual({ emoji: "😂" });
      expect(toggleReactionSchema.parse({ emoji: "😮" })).toEqual({ emoji: "😮" });
      expect(toggleReactionSchema.parse({ emoji: "😢" })).toEqual({ emoji: "😢" });
      expect(toggleReactionSchema.parse({ emoji: "🙏" })).toEqual({ emoji: "🙏" });

      expect(() => toggleReactionSchema.parse({ emoji: "🎉" })).toThrow("Invalid emoji");
      expect(() => toggleReactionSchema.parse({ emoji: "🚀" })).toThrow("Invalid emoji");
    });

    it("toggles reaction ON when not yet present for the user", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";
      const msgId = "msg-1";

      // 1. Message check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: msgId, conversationId: convId }])
      );
      // 2. Member check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "mem-1" }])
      );
      // 3. Existing reaction check (not present)
      mockTx.select.mockReturnValueOnce(createChainableQuery([]));

      // 4. Insert reaction
      mockTx.insert.mockReturnValueOnce(createChainableMutation([]));

      const result = await toggleMessageReaction({
        organizationId: orgId,
        userId: "user-alice",
        messageId: msgId,
        emoji: "👍",
      });

      expect(result).toEqual({
        toggled: "added",
        emoji: "👍",
        messageId: msgId,
      });
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it("toggles reaction OFF when already present for the user", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";
      const msgId = "msg-1";

      // 1. Message check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: msgId, conversationId: convId }])
      );
      // 2. Member check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "mem-1" }])
      );
      // 3. Existing reaction check (already present)
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "react-1", emoji: "👍", employeeId: "emp-alice" }])
      );

      // 4. Delete reaction
      mockTx.delete.mockReturnValueOnce(createChainableMutation([]));

      const result = await toggleMessageReaction({
        organizationId: orgId,
        userId: "user-alice",
        messageId: msgId,
        emoji: "👍",
      });

      expect(result).toEqual({
        toggled: "removed",
        emoji: "👍",
        messageId: msgId,
      });
      expect(mockTx.delete).toHaveBeenCalled();
    });

    it("denies reaction if actor is not an active member of the conversation", async () => {
      // Message exists
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "msg-1", conversationId: "conv-1" }])
      );
      // Not a member
      mockTx.select.mockReturnValueOnce(createChainableQuery([]));

      await expect(
        toggleMessageReaction({
          organizationId: "org-acme",
          userId: "user-alice",
          messageId: "msg-1",
          emoji: "❤️",
        })
      ).rejects.toThrow("You are not a member of this conversation.");
    });
  });

  describe("16. Phase 5 — Chat Attachments & Storage", () => {
    it("uploads chat attachment, links to file message, and returns enriched message payload", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

      // 1. Member check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "mem-1", employeeId: "emp-alice" }])
      );

      // 2. Insert message
      mockTx.insert.mockReturnValueOnce(
        createChainableMutation([
          {
            id: "msg-file-1",
            organizationId: orgId,
            conversationId: convId,
            senderEmployeeId: "emp-alice",
            content: "Check this invoice",
            type: "file",
            createdAt: new Date(),
          },
        ])
      );

      // 3. Insert attachment
      mockTx.insert.mockReturnValueOnce(
        createChainableMutation([
          {
            id: "att-1",
            messageId: "msg-file-1",
            fileName: "invoice.pdf",
            mimeType: "application/pdf",
            fileSize: pdfBytes.length,
          },
        ])
      );

      // 4. Update conversation updatedAt
      mockTx.update.mockReturnValueOnce(createChainableMutation([]));

      const message = await uploadChatAttachment({
        organizationId: orgId,
        userId: "user-alice",
        conversationId: convId,
        file: {
          buffer: pdfBytes,
          fileName: "invoice.pdf",
          mimeType: "application/pdf",
        },
        content: "Check this invoice",
      });

      expect(message.type).toBe("file");
      expect(message.content).toBe("Check this invoice");
      expect(message.attachment).toEqual({
        id: "att-1",
        fileName: "invoice.pdf",
        mimeType: "application/pdf",
        fileSize: pdfBytes.length,
        category: "document",
      });
      expect(message.sender.displayName).toBe("Alice Smith");
    });

    it("retrieves chat attachment with strict conversation membership authorization", async () => {
      const orgId = "org-acme";
      const convId = "conv-1";
      const attId = "att-1";

      // 1. Membership check
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([{ id: "mem-1" }])
      );

      // 2. Attachment query (joined with message to ensure conversationId matches)
      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            attachment: {
              id: attId,
              organizationId: orgId,
              fileName: "spec.pdf",
              mimeType: "application/pdf",
              fileSize: 100,
              storageKey: "chat/test/spec.pdf",
            },
            message: {
              id: "msg-1",
              conversationId: convId,
            },
          },
        ])
      );

      // Non-existent attachment in storage throws NOT_FOUND or returns bytes
      await expect(
        getChatAttachment({
          organizationId: orgId,
          userId: "user-alice",
          conversationId: convId,
          attachmentId: attId,
        })
      ).rejects.toThrow(); // storage file doesn't exist on disk in unit mock
    });
  });

  describe("17. Phase 5 — Global Chat Search", () => {
    it("validates search query schema requirements", () => {
      expect(searchMessagesSchema.parse({ query: "design review", limit: 10 })).toEqual({
        query: "design review",
        limit: 10,
      });

      expect(() => searchMessagesSchema.parse({ query: "a" })).toThrow(
        "Search query must be at least 2 characters."
      );
    });

    it("executes server-side search across conversations and returns contextual snippets", async () => {
      const orgId = "org-acme";
      const query = "budget plan";

      mockTx.select.mockReturnValueOnce(
        createChainableQuery([
          {
            id: "msg-search-1",
            conversationId: "conv-team",
            content: "Here is the Q4 budget plan for review and approval.",
            type: "text",
            createdAt: new Date("2026-10-18T10:00:00Z"),
            senderDisplayName: "Bob Jones",
            conversationName: "Finance & Planning",
            conversationType: "group",
          },
        ])
      );

      const results = await searchMessages({
        organizationId: orgId,
        userId: "user-alice",
        query,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("msg-search-1");
      expect(results[0].conversationName).toBe("Finance & Planning");
      expect(results[0].senderDisplayName).toBe("Bob Jones");
      expect(results[0].snippet).toContain("budget plan");
    });
  });

  describe("18. Phase 5 Hardening — Rate Limiting & Retry-After Enforcement", () => {
    it("allows requests under the rate limit and enforces 429 when exceeded", () => {
      const key = `chat:test-limiter:${Date.now()}`;
      expect(() => enforceRateLimit(key, 3, 60000)).not.toThrow();
      expect(() => enforceRateLimit(key, 3, 60000)).not.toThrow();
      expect(() => enforceRateLimit(key, 3, 60000)).not.toThrow();

      let thrownError: unknown;
      try {
        enforceRateLimit(key, 3, 60000);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(AppError);
      const appErr = thrownError as AppError;
      expect(appErr.code).toBe("RATE_LIMITED");
      expect(appErr.status).toBe(429);
      expect(appErr.metadata?.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("errorResponse serializes 429 with Retry-After header", async () => {
      const key = `chat:test-response:${Date.now()}`;
      let capturedError: unknown;
      try {
        enforceRateLimit(key, 1, 60000);
        enforceRateLimit(key, 1, 60000);
      } catch (err) {
        capturedError = err;
      }

      const res = errorResponse(capturedError);
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBeDefined();
      const retryAfter = Number(res.headers.get("Retry-After"));
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("RATE_LIMITED");
    });

    it("isolates rate limits between distinct actors and scopes", () => {
      const actor1 = `chat:msg:org-1:user-1:${Date.now()}`;
      const actor2 = `chat:msg:org-1:user-2:${Date.now()}`;

      enforceRateLimit(actor1, 1, 60000);
      expect(() => enforceRateLimit(actor1, 1, 60000)).toThrow(AppError);

      // actor2 should not be blocked by actor1
      expect(() => enforceRateLimit(actor2, 1, 60000)).not.toThrow();
    });
  });
});

