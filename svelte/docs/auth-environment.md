# Authentication and environment requirements

This document describes the Svelte relay/session design after relocation into `svelte/`. No secret files or values are included. The backend and database must be independently authorized and supplied at runtime. Automated checks in this release are synthetic; real login and organization-data loading have not been reverified from the published tree.

## Architecture

Next.js remains the authoritative API backend for authentication and business mutations. SvelteKit relays `/api/...` calls to that backend and reads session, membership, organization, role, and selected page data through Drizzle/PostgreSQL. This mixed architecture requires SvelteKit's `DATABASE_URL` and the backend's `DATABASE_URL` to address the same approved data source for session continuity. A relay origin alone is insufficient. Do not create an empty database to make the sign-in form pass.

The relay forwards the application session cookie to the backend, returns backend status and payloads, does not retry requests, and rejects cross-origin mutations. Protected routes resolve the session against the database on each request. No process-global session cache or client generic GET cache/deduplication is used.

## Required configuration names

| Variable | Consumer | Purpose |
|---|---|---|
| `LEGACY_BACKEND_ORIGIN` | Svelte `src/lib/server/legacy.ts` and proxy policy | Origin of the separately running authoritative Next.js backend. Server-only; no credentials or path component. |
| `DATABASE_URL` (Svelte runtime) | Svelte `src/lib/server/database.ts` | Session/context resolution and direct reads. Must use the same approved schema/data as the backend. |
| `DATABASE_URL` (Next.js runtime) | Original `src/db/client.ts` | Backend authentication and business operations. Supply independently and securely. |
| `APP_URL` (Next.js runtime) | Original auth/email link generation | Public Svelte origin for verification, invitation, and recovery links. |
| `HOST`, `PORT`, `ORIGIN`, `NODE_ENV` | Respective Svelte/Next runtime | Listener and deployment semantics; configure to match actual proxy/HTTPS topology. |
| Provider configuration | Existing backend-owned provider composition | Email, storage, malware scanning, AI, billing, and queue operations. Not copied into Svelte. |

The implementation accepts `DATABASE_URL` from the protected process environment. It also supports the explicitly configured optional `SYMPHOWORK_REFERENCE_ENV_FILE`, which reads only `DATABASE_URL` from an absolute protected file at runtime; that path is not auto-discovered. Never point it at an unapproved or production environment file. No `.env` or credentials file is included in this directory.

## Safe startup

1. Obtain explicit approval and configuration for a development database with the existing compatible schema and authorized test users. Confirm whether it is remote, tunneled, or local. Loopback by itself does not prove that a tunnel is safe.
2. Make the authoritative Next.js backend available through an approved isolated runtime or managed development service. Do not start `next dev` in the original working checkout if generated writes there are prohibited. The backend launcher previously used in the Svelte workspace is not part of this release.
3. Inject the approved backend `DATABASE_URL` and `APP_URL` through the backend operator's secret mechanism. Start the backend with its documented project command and confirm the actual loopback/service listener from its startup output.
4. From the `svelte/` directory, securely supply the matching `DATABASE_URL` and the confirmed `LEGACY_BACKEND_ORIGIN`, then run `pnpm run dev`. Vite normally listens on port 5173; use startup output to confirm. Keep the same browser hostname for the frontend so its host-only session cookie is consistent.
5. Use only authorized test credentials. Verify login, a protected page, refresh continuity, logout, and denied access after logout. Start with read-only data checks. Do not create, edit, or delete tenant records without separate approval.
6. Stop only the processes started for the test. Do not run migrations, seeds, resets, or provider workflows as part of startup.

If `LEGACY_BACKEND_ORIGIN` is absent or invalid, the relay fails safely. If the session database is missing, login is rejected before forwarding so the app cannot create a session it cannot read. A configured but unavailable backend/database must be diagnosed without exposing values or driver error details. Passing type checks/builds does not verify real login or data connectivity.

## Current verification boundary

The current automated suite passed against fixture/mocked responses with backend and database disabled. Historical review records may describe a prior authorized run in the original workspace; that is not evidence that the relocated tree has a working live configuration today. No live authentication, current organization-data read, successful business mutation, tenant/RLS isolation, private-file authorization, visual comparison, or performance improvement was verified for this release.
