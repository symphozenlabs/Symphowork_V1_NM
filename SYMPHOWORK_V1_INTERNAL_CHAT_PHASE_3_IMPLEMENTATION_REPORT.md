# SymphoWork V1 — Internal Chat Phase 3 Implementation Report

## Executive Summary

Phase 3 of the **SymphoWork V1 Internal Chat** has been successfully implemented and verified with automated test suites (`vitest` 73/73 tests passing, TypeScript `tsc --noEmit` clean, ESLint clean).

This phase evolves the dedicated WhatsApp/Messenger-style UI delivered in Phase 2 into a responsive, near-real-time internal company communication system with delivery and read receipts, online/offline presence, ephemeral typing indicators, unread dividers, safe coworker profile popovers, and complete email privacy across all chat surfaces.

---

## 1. Architectural Highlights & Zero-Migration Approach

| Capability | Architecture / Mechanism | Schema / Storage Impact |
| :--- | :--- | :--- |
| **Near-Real-Time Updates** | Adaptive conditional polling (3s thread delta poll, 8s sidebar, 20s hidden tab) | No DDL changes; leverages existing `collaboration_messages` indexes and `after` timestamp filters. |
| **Delivery Receipts** | Derived status: `sending` (optimistic), `sent` (persisted), `delivered` (counterparty `presence.lastSeenAt >= msg.createdAt`), `read` (`member.lastReadAt >= msg.createdAt`), `failed` (recoverable) | Uses existing columns: `collaboration_presence.last_seen_at`, `collaboration_conversation_members.last_read_at`. |
| **Presence Tracking** | Lightweight heartbeat (`POST /api/app/chat/presence`) every 25s when tab is visible; online if seen within 60s, away if within 120s, offline otherwise | Uses existing `collaboration_presence` table with composite key `(organization_id, employee_id)`. |
| **Ephemeral Typing Indicators** | In-memory registry (`src/modules/collaboration/typing.ts`) with 4.5s TTL per typer; zero database writes | Pure in-memory Map with automated TTL expiration; O(1) performance. |
| **Unread Tracking & Divider** | Accurate per-conversation unread count; subtle "New Messages" divider placed right before the first unread incoming message | Uses existing `collaboration_conversation_members.last_read_at` compared to message timestamps. |
| **Safe Profile Popover** | Clickable avatar and sender names open coworker profile dialog showing only Display Name, Job Title, Department, and Presence | Strictly non-administrative: excludes salary, banking, tax, contracts, phone, and personal email. |
| **Complete Email Privacy** | Removed `workEmail` from all ordinary chat interfaces, search placeholders, member checklists, and fallback subtitle strings | Display Name, Designation, and Department are used exclusively. |
| **Send Reliability & Idempotency** | Immediate input clear + optimistic bubble; 15s timeout with `AbortController`; retry preserving `clientIdempotencyKey` | Prevents stuck spinners, prevents duplicate persists on retries, and avoids blocking composer. |

---

## 2. Source Code Changes

### A. Backend Services & Ephemeral Registry

1. **`src/modules/collaboration/typing.ts` (NEW)**
   - Ephemeral in-memory typing indicator tracker with automatic 4.5s TTL expiration.
   - `setTypingIndicator(conversationId, employeeId, displayName, isTyping)`.
   - `getActiveTypers(conversationId, excludeEmployeeId)`: filters expired typers and excludes the viewing user.
   - `clearTypingRegistry()`: clean teardown for testing.

2. **`src/modules/collaboration/service.ts`**
   - **`listConversations`**:
     - Joins `departments` and `designations` (omitting `workEmail`).
     - Computes accurate `unreadCount` (`senderEmployeeId != actor.id && createdAt > member.lastReadAt`).
     - Extracts `lastMessage` preview (`id`, `content`, `type`, `createdAt`, `senderDisplayName`).
     - Fetches counterparty presence status and `memberCount` for group channels.
   - **`listMessages`**:
     - Supports `after?: Date` for efficient delta polling.
     - Supports `markRead?: boolean` (prevents background polling from falsely marking messages as read).
     - Computes `deliveryStatus` (`read`, `delivered`, `sent`) by checking counterparty's `lastReadAt` and `lastSeenAt`.
     - Returns `messages`, active `typers`, `recipientPresence`, `memberLastReadAt`, and `otherMemberLastReadAt`.
   - **`markConversationAsRead`**:
     - Dedicated transaction updating `collaborationConversationMembers.lastReadAt = now()` with conversation membership check.
   - **`updatePresence`**:
     - Upserts `collaborationPresence` with `lastSeenAt = now()`.
   - **`getPresenceForEmployees`**:
     - Derives `online` (< 60s), `away` (< 120s), or `offline` across employee IDs.
   - **`signalTyping`**:
     - Verifies conversation membership and registers typing state in `typing.ts`.

3. **`src/modules/collaboration/validation.ts`**
   - Added `signalTypingSchema`: `z.object({ isTyping: z.boolean() })`.
   - Added `updatePresenceSchema`: `z.object({ status: z.enum(["online", "away", "busy", "offline"]).default("online") })`.

---

### B. API Route Handlers

1. **`POST /api/app/chat/conversations/[conversationId]/read` (NEW)**
   - Marks the conversation read for the requesting tenant actor.
   - Path: `src/app/api/app/chat/conversations/[conversationId]/read/route.ts`.

2. **`POST /api/app/chat/conversations/[conversationId]/typing` (NEW)**
   - Signals active or inactive typing state in the specified conversation.
   - Path: `src/app/api/app/chat/conversations/[conversationId]/typing/route.ts`.

3. **`POST & GET /api/app/chat/presence` (NEW)**
   - `POST`: Presence heartbeat keeping the actor online.
   - `GET`: Batch lookup of employee presence states (`?employeeIds=id1,id2`).
   - Path: `src/app/api/app/chat/presence/route.ts`.

4. **`GET & POST /api/app/chat/conversations/[conversationId]/messages` (MODIFIED)**
   - Parses optional `after` and `markRead` query parameters.
   - Returns backward-compatible `messages: MessageItem[]` along with `typers`, `recipientPresence`, and read timestamps.
   - Path: `src/app/api/app/chat/conversations/[conversationId]/messages/route.ts`.

---

### C. Dedicated Frontend Components (`src/components/chat/`)

1. **`chat-profile-modal.tsx` (NEW)**
   - Accessible modal dialog triggered by clicking a coworker's avatar or name.
   - Shows: Avatar with deterministic color, Display Name, Job Title, Department, and Presence status with colored dot.
   - Privacy: Strictly excludes salary, banking, tax, contracts, phone, and personal email.

2. **`types.ts` (MODIFIED)**
   - Added `deliveryStatus` (`sending`, `sent`, `delivered`, `read`, `failed`).
   - Added `sendError`, `unreadCount`, `lastMessage`, and `presence` structures.

3. **`utils.ts` (MODIFIED)**
   - Added `formatPresenceStatus(presence)` formatting helper ("Online", "Away", "Offline • Last seen 10:45 AM").

4. **`conversation-list-item.tsx` (MODIFIED)**
   - Displays real-time presence indicator dot on avatar for direct chats.
   - Displays dynamic message preview (e.g. "You: ...", "Bob: ...") instead of static text.
   - Displays unread counter badge when `unreadCount > 0`.
   - Removed all email fallbacks.

5. **`conversation-sidebar.tsx` (MODIFIED)**
   - Sorts conversations dynamically by recent activity (`lastMessage?.createdAt || conversation.updatedAt`).
   - Total unread message badge in sidebar header.
   - Removed email from search filters and empty-state recommendations.

6. **`chat-header.tsx` (MODIFIED)**
   - Direct chats: displays online/offline presence subtitle; clicking avatar/name opens coworker profile modal.
   - Group channels: displays member count (e.g. "5 members • Team Channel").
   - Removed email fallback.

7. **`message-bubble.tsx` (MODIFIED)**
   - Outgoing messages render delivery ticks:
     - `sending`: clock icon
     - `sent`: single check icon
     - `delivered`: double check icon
     - `read`: double check icon with accent sky-300 color
     - `failed`: red alert icon + error message + "Retry" button
   - Incoming messages never display outgoing ticks or retry actions.
   - Group incoming messages: sender name is clickable to view profile.

8. **`message-list.tsx` (MODIFIED)**
   - "New Messages" accent divider inserted between read history and unread messages.
   - Ephemeral typing indicator banner rendered at bottom with animated bouncing dots.
   - Seamless pass-through of `onRetrySend` and `onOpenProfile`.

9. **`chat-input-bar.tsx` (MODIFIED)**
   - Throttled typing indicator signaling while typing.
   - Immediate clearance on send or blur.
   - Enter sends; Shift+Enter inserts newline.

10. **`new-direct-chat-dialog.tsx` & `new-group-chat-dialog.tsx` (MODIFIED)**
    - Removed all email addresses from search placeholders, recipient subtitle fallbacks, and member checklists.

11. **`chat-workspace.tsx` (MODIFIED)**
    - **Optimistic Send**: Appends optimistic message with `temp-` id and `deliveryStatus: "sending"`. Uses 15s timeout via `AbortController`. Reconciles on success with returned persisted message.
    - **Failure Recovery**: On network or server failure, message bubble switches to `deliveryStatus: "failed"` with a retry button that preserves `clientIdempotencyKey`. Textarea is never stuck.
    - **Adaptive Polling**:
      - Visible tab: 3s thread delta poll (`/messages?after=...`), 8s sidebar poll, 25s presence heartbeat.
      - Hidden tab: slows down to 20s/25s.
      - Switched automatically on `visibilitychange`.
      - `isPollingRef` prevents overlapping background requests.
    - **Read Receipt Dispatch**: Automatically calls `POST .../read` on viewing and clears unread badge.
    - **Profile Modal Management**: Centralized `selectedProfile` state.

---

## 3. Automated Verification & Quality Assurance

### Vitest Test Suites
```bash
$ vitest run "src/modules/collaboration/chat.test.ts" "src/components/chat/chat-ui.test.ts"

 ✓ src/components/chat/chat-ui.test.ts (42 tests)
 ✓ src/modules/collaboration/chat.test.ts (31 tests)

 Test Files  2 passed (2)
      Tests  73 passed (73)
   Duration  6.57s
```

### TypeScript Compilation (`tsc --noEmit`)
```bash
$ tsc --noEmit
# Exited with code 0 (zero errors across the entire codebase)
```

### ESLint Check
```bash
$ eslint src/components/chat/ src/app/api/app/chat/ src/modules/collaboration/
# Exited with code 0 (clean, 0 errors, 0 warnings)
```

---

## 4. Preservation of Existing Features

- `src/components/collaboration/workspace.tsx`: Intact and unmodified.
- `/app/work` and Projects & Tasks functionality: Intact and unmodified.
- Unrelated working tree files (attendance, payroll, workflows): Preserved without overwrites or discards.
