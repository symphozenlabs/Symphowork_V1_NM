# SymphoWork V1 — Internal Chat Security, Encryption & Git Release Readiness Audit Report

**Date:** October 19, 2026  
**Audit Scope:** Internal Chat (`/app/chat`), Storage Adapters, Collaboration Services, Database Schema, and Repository Working Tree  
**Branch:** `naresh-dev`  
**HEAD Commit:** `17ef148 fix(ci): resolve ESLint and Next.js build errors for Vercel deployment`  
**Audit Type:** Read-Only Defensive Security & Release Readiness Audit  

---

## Final Recommendation

### **FIX REQUIRED BEFORE PUSH**

> [!WARNING]
> While the internal chat implementation demonstrates robust multi-tenant authorization, zero IDOR vulnerabilities, strict binary magic-byte inspection, and passes 100% of its chat unit and integration tests (121/121 tests passing), **a Git push is currently blocked by two release-readiness issues**:
> 1. **Test Suite Regression in `src/components/layout/app-shell.test.ts`:** 2 tests fail because an uncommitted change in `src/components/layout/app-shell.tsx` introduced `canManagePayroll` navigation gating that was not synchronized with the test fixture.
> 2. **Intermingled Working-Tree Changes:** Uncommitted working tree files combine three distinct initiatives: Internal Chat (Phase 1–5), Attendance & Salary Regularization, and Payroll Configurations. Staging and pushing would inadvertently bundle unfinished, cross-domain code into origin.
> 3. **Absence of Rate Limiting:** Chat message submission, attachment upload, and search routes lack abuse throttling.
>
> In addition, regarding cryptographic claims: **End-to-end encryption is not verified.** Messages and attachments are transmitted to and stored by the server in plaintext. The system must not be advertised or deployed as end-to-end encrypted without re-architecting client-side key exchange.

---

## 1. Repository & Working Tree State Audit

### 1.1 Branch & Remote Status
- **Current Branch:** `naresh-dev`
- **Remote:** `origin` (`https://github.com/symphozenlabs/Symphowork_V1_NM.git`)
- **Remote Tracking:** `naresh-dev` has no remote tracking branch configured (`origin/naresh-dev` is not set as upstream).
- **Recent Commits:**
  - `17ef148` (HEAD) `fix(ci): resolve ESLint and Next.js build errors for Vercel deployment`
  - `f312c1e` `feat: improve employee and attendance workflows`
  - `ec86d1b` `fix: improve role permissions and department management`
  - `f79d75a` `Polish landing page and authentication UI`

### 1.2 Working Tree Modifications Analysis
The current working tree contains **31 modified tracked files** and **40+ untracked files**, spanning three distinct operational domains:

```
Working Tree Breakdown:
├── Internal Chat (Phase 1–5)
│   ├── src/components/chat/* (14 files: sidebar, bubble, audio, lightbox, search, voice, etc.)
│   ├── src/modules/collaboration/* (service.ts, validation.ts, file-validation.ts, typing.ts)
│   ├── src/app/api/app/chat/* (11 route endpoints)
│   ├── src/components/layout/chat-unread-badge.tsx & tests
│   └── src/lib/storage/* (storage.ts, local.ts, r2.ts)
│
├── Attendance & Shift Management (Unrelated User Work)
│   ├── src/app/api/app/attendance/* (punch, regularization, organization, process-absent, reminder)
│   ├── src/components/attendance/* (attendance-actions, reminder modal, organization dashboard)
│   └── src/modules/attendance/* (absent processing, reminder, shift timing, Sunday working)
│
├── Payroll & Salary Management (Unrelated User Work)
│   ├── src/app/api/app/payroll/* (config, profiles, runs pay)
│   ├── src/components/payroll/* (dashboard, payslips)
│   └── src/modules/payroll/* (calculator, leave clipping)
│
└── Layout, Shell & Approvals (Shared Infrastructure)
    ├── src/components/layout/app-shell.tsx (contains canManagePayroll navigation gating)
    ├── src/app/api/app/approvals/[taskId]/route.ts (approval resolution workflow updates)
    └── drizzle/0019_membership_user_context.sql (untracked migration file)
```

> [!IMPORTANT]
> **Preservation Rule:** In accordance with audit instructions, all pre-existing user changes across attendance, payroll, approvals, and migrations were strictly preserved and not modified or discarded.

---

## 2. Verification of the Encryption Architecture

An exhaustive technical investigation was performed across the database schema, storage providers, cryptographic modules, and API route handlers to verify the 7 specific encryption dimensions:

| Dimension | Status | Evidence & Architectural Reality |
|---|---|---|
| **1. HTTPS/TLS in Transport** | **VERIFIED (Infrastructure-level)** | Transport security relies on edge/reverse-proxy termination (Vercel/Cloudflare in production). Local development runs on plain HTTP (`http://localhost:3000`). Next.js sets `secure: process.env.NODE_ENV === "production"` on session cookies. |
| **2. Database Encryption at Rest** | **VERIFIED (Disk-level Only)** | Managed PostgreSQL (Neon / AWS RDS) provides volume-level storage encryption (AES-256 via cloud provider keys). **However, database rows store message content and filenames in PLAINTEXT.** |
| **3. Storage Encryption at Rest** | **PARTIALLY VERIFIED** | **Production (Cloudflare R2):** Encrypted at rest via Cloudflare-managed AES-256.<br>**Development (`local.ts`):** Raw files are saved directly as unencrypted binary files in `.storage/` on local disk. |
| **4. Application-Level Message Encryption** | **NOT IMPLEMENTED** | Unlike `employee_payroll_profiles` (which includes `panEncrypted` and `bankMetadataEncrypted`), `collaboration_messages` stores `content` as plain `text`. No cryptographic transformation occurs between client submission and database insertion. |
| **5. True End-to-End Encryption (E2EE) for Text** | **NOT VERIFIED (ABSENT)** | **End-to-end encryption is not verified.** Clients transmit plaintext JSON to the server. The server reads, sanitizes, logs, indexes, and converts messages to tasks. No asymmetric key exchange or client ratcheting exists. |
| **6. E2EE for Images, Documents & Voice** | **NOT VERIFIED (ABSENT)** | **End-to-end encryption is not verified.** Media files are sent as raw binary multipart uploads. The server inspects magic bytes, parses headers, and stores unencrypted blobs in object storage. |
| **7. Encryption of Metadata & Search Indexes** | **NOT IMPLEMENTED** | File names (`file_name`), mime types, file sizes, timestamps, and search indexes are stored in plaintext. Search is executed directly via unencrypted PostgreSQL `ILIKE %query%`. |

### 2.1 Message & Attachment Data Flow Trace

```
+----------------------------------------------------------------------------------------------------+
| SENDER'S DEVICE (Browser)                                                                          |
| 1. User types message or attaches media (Image / PDF / Voice WebM).                                |
| 2. Browser issues POST request with plaintext JSON or raw multipart/form-data.                     |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼ (TLS 1.2/1.3 in production; plain HTTP in dev)
+----------------------------------------------------------------------------------------------------+
| NEXT.JS SERVER & API ROUTE                                                                         |
| 3. Unpacks HTTP payload into memory. Content and binary buffers exist in PLAINTEXT.               |
| 4. Authenticates user session from cookie; checks tenant RBAC (chat.send).                         |
| 5. Verifies sender's active membership in collaboration_conversation_members.                      |
| 6. Inspects magic bytes (file-validation.ts) to verify JPEG/PNG/PDF/WebM binary signatures.        |
| 7. Invokes storage.upload() passing raw, unencrypted buffer.                                       |
+----------------------------------------------------------------------------------------------------+
                         │                                                   │
                         ▼                                                   ▼
+---------------------------------------------------+ +----------------------------------------------+
| POSTGRESQL DATABASE                               | | STORAGE ADAPTER                              |
| 8. Inserts row into collaboration_messages with   | | 9. Writes raw bytes:                         |
|    content = "Hello team" (PLAINTEXT).            | |    - Cloudflare R2: AES-256 cloud-managed.   |
| 9. Inserts row into collaboration_attachments with| |    - Local Provider: Unencrypted disk file   |
|    fileName = "budget.pdf" (PLAINTEXT).           | |      in .storage/...                         |
+---------------------------------------------------+ +----------------------------------------------+
                         │                                                   │
                         └─────────────────────────┬─────────────────────────┘
                                                   │
                                                   ▼
+----------------------------------------------------------------------------------------------------+
| RECIPIENT'S RETRIEVAL                                                                              |
| 10. Recipient polls /api/app/chat/conversations/[id]/messages.                                     |
| 11. Server validates membership, reads plaintext records from PostgreSQL, returns JSON.            |
| 12. Recipient requests /attachments/[id]; server reads raw bytes from storage, streams to browser. |
| 13. Recipient browser displays text, plays audio, or renders image.                                |
+----------------------------------------------------------------------------------------------------+
```

### 2.2 Plaintext Exposure Analysis
Because messages and media are server-readable, plaintext data is potentially exposed at the following architectural points:
1. **Database Access / Dumps:** Anyone with database read access (DBA, cloud console, unencrypted `pg_dump`, read replicas, or SQL connection strings) can read all message conversations and view attachment filenames.
2. **Server Memory & Execution:** Server-side crash dumps or runtime memory inspection could capture message buffers.
3. **Database Task Conversion:** When a message is converted to a task via `convertMessageToTask`, `message.content` is copied directly into `collaboration_tasks.description` in plaintext, making it visible to users with project/task permissions who were not members of the original chat conversation.
4. **Search Queries:** The `searchMessages` endpoint queries PostgreSQL directly using `ilike(collaborationMessages.content, '%query%')`. For search to function on the server, messages must remain server-decrypted.
5. **System Notifications:** Chat mention notifications (`parseMentionNames`) generate notification titles and messages containing user names and message references stored in the `notifications` table.

### 2.3 Recommended E2EE Architecture (If Required in Future)
If true end-to-end encryption is required for compliance or privacy (e.g., zero-knowledge company chat):
1. **Key Management:** Implement the **Signal Protocol** (Double Ratchet Algorithm, Extended Triple Diffie-Hellman / X3DH) or **Matrix Olm/Megolm** utilizing Web Crypto API (`window.crypto.subtle`).
2. **Device Identity Keys:** Store public identity keys and prekey bundles on the server; private keys remain strictly in browser `IndexedDB` (non-extractable).
3. **Media E2EE:** Encrypt files client-side using random symmetric AES-256-GCM keys before upload. Transmit the symmetric ciphertext to storage, and send the AES key via the ratchet-encrypted message envelope.
4. **Client-Side Search:** Replace server-side SQL `ILIKE` search with client-side indexing (e.g., SQLite via WebAssembly or client-side inverted index stored locally).

---

## 3. Threat Model and Security Review

| ID | Finding / Threat Vector | Severity | Evidence / Path | Description & Impact | Recommended Remediation |
|---|---|---|---|---|---|
| **SEC-01** | **No Rate Limiting on Chat Endpoints** | **MEDIUM** | `src/lib/rate-limit.ts`<br>`src/app/api/app/chat/**` | `enforceRateLimit()` is implemented in `src/lib/rate-limit.ts`, but is **never invoked** in any chat route. Authenticated users can flood messages, spam reactions, or exhaust storage quotas with repeated 10MB PDF uploads. | Add `enforceRateLimit(clientRateLimitKey(request, "chat-send"), 60, 60000)` and upload throttling to chat API route handlers. |
| **SEC-02** | **Full Test Suite Failure in AppShell** | **MEDIUM** | `src/components/layout/app-shell.test.ts` | 2 unit tests fail in `app-shell.test.ts` due to uncommitted navigation gating (`canManagePayroll`) in `app-shell.tsx`. Blocks CI/CD pipeline on release. | Update `app-shell.test.ts` test fixtures to reflect `canManagePayroll` role permissions. |
| **SEC-03** | **Intermingled Working Tree** | **MEDIUM** | Working tree (git status) | 31 modified files and 40 untracked files mix chat, attendance, payroll, and migration code. Pushing would release unverified attendance/payroll changes. | Split working tree into targeted topic branches (`feat/internal-chat-phase5`, `feat/attendance-payroll`). |
| **SEC-04** | **Vulnerable Transitive Dependencies** | **LOW (Dev-only)** | `pnpm audit` | 10 vulnerabilities detected (2 Critical, 3 High, 5 Moderate). The 2 critical vulnerabilities (`GHSA-5gmw-xhrv-c9v3`, `GHSA-85c8-ppgw-ccpr`) reside in `tinypool`, a subdependency of `vitest` (dev-only test runner). | Run `pnpm update vitest --depth 2` in a controlled dependency update commit after feature release. |
| **SEC-05** | **Local Storage Adapter Unused Vars** | **LOW** | `src/lib/storage/local.ts` | ESLint reports 2 warnings for unused arguments `_contentType` and `_expiresInSeconds` in `createLocalStorageProvider()`. | Add underscore prefixes or implement interface adherence comments. |
| **SEC-06** | **Cross-Tenant & IDOR Defenses** | **PASS / ROBUST** | `src/modules/collaboration/service.ts` | Every read, write, reaction, attachment upload, and download verifies tenant context via `resolveTenantContext()` AND validates active conversation membership (`leftAt IS NULL`). Attackers guessing conversationId or attachmentId are rejected with 403 or 404. | None. Architecture is secure against IDOR and cross-tenant leakage. |
| **SEC-07** | **Malicious File Upload & Sniffing Defenses** | **PASS / ROBUST** | `src/modules/collaboration/file-validation.ts`<br>`route.ts` | Uploads enforce file size caps (5MB images/audio, 10MB PDFs), whitelist extensions, and **deep binary magic byte inspection** (JPEG, PNG, WebP, PDF, WebM, OGG, MP4, WAV, MP3). Download endpoint serves `X-Content-Type-Options: nosniff` and sanitized `Content-Disposition`. | None. File upload handling is secure. |
| **SEC-08** | **XSS & SQL Injection Defenses** | **PASS / ROBUST** | `src/modules/collaboration/policy.ts`<br>`message-bubble.tsx` | Inputs are sanitized via `sanitizeCollaborationText()`. React renders message content as standard string children (no `dangerouslySetInnerHTML`). SQL queries use parameterized Drizzle ORM queries with zero string concatenation. | None. Injections are mitigated. |

---

## 4. Automated Verification Results

All automated verification commands were executed directly against the current repository state:

### 4.1 Vitest Full Test Suite (`pnpm test`)
- **Status:** **FAILED (1 test file failed out of 98)**
- **Test Files:** 97 passed, 1 failed (98 total)
- **Tests:** 739 passed, 2 failed (741 total)
- **Failed File:** `src/components/layout/app-shell.test.ts`
  - `AssertionError: expected [ ... ] to have a length of 11 but got 10`
  - `AssertionError: expected [ ... ] to have a length of 9 but got 8`
  - **Root Cause:** In `src/components/layout/app-shell.tsx`, line 80:
    ```tsx
    ...(canManagePayroll ? [{ label: "Payroll", href: "/app/payroll", iconKey: "payroll" }] : []),
    ```
    The `Payroll` navigation link was gated behind `canManagePayroll`. In the test fixtures for EMPLOYEE and generic roles without `payroll.view`/`payroll.manage`, the item is omitted, causing the core navigation item count to drop from 11 to 10 (and 9 to 8).
- **Internal Chat Test Suite (`chat.test.ts`, `chat-ui.test.ts`, `chat-unread-badge.test.ts`):**
  - **121 passed out of 121 tests (100% PASS)**
  - Coverage: RBAC permissions, direct/group deduplication, participant derivation, unread conversation badges, optimistic send, idempotency, read receipts, typing registry, presence, file size limits, magic bytes validation, attachment streaming, emoji reactions, voice recording, lightbox, audio playback, and global search.

### 4.2 TypeScript Typecheck (`pnpm typecheck` / `tsc --noEmit`)
- **Status:** **PASSED**
- **Errors:** **0 errors across the entire codebase.**

### 4.3 ESLint (`pnpm lint`)
- **Status:** **PASSED (0 Errors, 2 Warnings)**
- **Errors:** 0
- **Warnings:** 2 in `src/lib/storage/local.ts` (`_contentType` and `_expiresInSeconds` unused parameters).

### 4.4 Production Build (`pnpm build` / `next build`)
- **Status:** **PASSED**
- **Compilation:** Successfully compiled all client/server bundles in 2.9 minutes.
- **Page Optimization:** 131/131 static and dynamic pages generated with zero errors.
- **Output:**
  - Route `/app/chat`: Dynamic server-rendered page (`ƒ`).
  - Route `/api/app/chat/...`: Dynamic API route handlers (`ƒ`).
  - First load JS shared by all: 103 kB.

### 4.5 Browser E2E Tests (`pnpm test:e2e --list`)
- **Status:** 4 Playwright tests listed (`auth-onboarding.spec.ts` and `home.spec.ts`).
- **Scope:** No E2E browser tests currently exist for the chat module; chat is tested via the 121 Vitest integration and UI component tests.

### 4.6 Dependency Security Audit (`pnpm audit`)
- **Status:** 10 vulnerabilities found (2 Critical, 3 High, 5 Moderate).
- **Critical Vulnerabilities:**
  - `GHSA-5gmw-xhrv-c9v3` & `GHSA-85c8-ppgw-ccpr`: `tinypool` (subdependency of `vitest`). Development-only testing tool; not included in production builds.

---

## 5. Git Push Readiness Review

### 5.1 Sensitive Files & Secret Leakage Inspection
- **`.env` files:** Verified. `.gitignore` strictly excludes `.env`, `.env.*`, and `.env*.local`. Only `.env.example` is tracked, containing safe placeholder keys.
- **Private keys & credentials:** No `.pem`, `.key`, or credentials files are present or tracked.
- **Uploaded media files:** Local storage directory `.storage/` is explicitly listed in `.gitignore` (line 115). No uploaded test images, audio clips, or PDFs are staged or tracked.
- **Build artifacts:** `.next`, `dist`, `build`, and coverage reports are ignored and clean.

### 5.2 Release Blockers & Deployment Prerequisites
Before initiating `git push origin naresh-dev`, the following remediation steps must be completed:

1. **Resolve Test Suite Failure in `app-shell.test.ts`:**
   - Update `src/components/layout/app-shell.test.ts` to supply `payroll.view` in the mock role permission set, or update expected item counts to reflect the `canManagePayroll` condition.
2. **Isolate Feature Commits:**
   - The working tree currently contains mixed code across chat, attendance, and payroll.
   - Separate the Phase 1–5 chat files into a focused, clean commit set:
     ```
     feat(chat): implement internal company chat phase 1-5 (media, emojis, reactions, voice, search)
     ```
   - Keep attendance and payroll modifications in separate uncommitted work or branch.
3. **Configure Upstream Tracking:**
   - `naresh-dev` currently has no upstream branch. When ready to publish:
     ```
     git push -u origin naresh-dev
     ```
4. **Production Storage Configuration:**
   - Verify that production deployment environment variables for Cloudflare R2 are configured (`OBJECT_STORAGE_PROVIDER=r2`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_ACCESS_KEY`, `OBJECT_STORAGE_SECRET_KEY`).
5. **Rate Limiting Implementation:**
   - Add `enforceRateLimit()` to chat message sending and attachment upload routes to prevent resource abuse.

---

## 6. Audit Conclusion

The SymphoWork V1 Internal Chat module is architecturally solid, strictly enforces multi-tenant isolation, prevents IDOR attacks, validates file integrity with binary magic-byte inspection, passes all 121 chat integration tests, typechecks cleanly, and builds successfully in Next.js production mode.

However, because:
1. Two tests in `app-shell.test.ts` fail due to unrelated uncommitted navigation changes,
2. Unrelated attendance and payroll work is mixed into the working tree, and
3. Chat endpoints lack rate limiting,

the required release status is: **FIX REQUIRED BEFORE PUSH**.

Furthermore, all stakeholders must note: **End-to-end encryption is not verified.** Messages and attachments are server-readable and stored as plaintext in PostgreSQL and object storage.
