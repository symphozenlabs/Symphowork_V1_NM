# Authentication and environment requirements

## Current architecture correction — 2026-11-01

The active target serves SvelteKit pages and same-origin API handlers from one process on port 5173. Current `src/routes/api/**/+server.ts` adapters invoke migrated handlers in-process through `svelteEndpoint`. `LEGACY_BACKEND_ORIGIN` is not required or consumed by the active runtime. Do not follow the historical two-server/Next.js startup steps or copy a reference-workspace environment file. `DATABASE_URL`, when used, is consumed server-side by the SvelteKit database client and must authenticate directly as `sympowork_app`; the currently configured owner-role URL is rejected by the runtime guard. No live database identity or authenticated acceptance was performed in the current closure run. Earlier login/session claims below describe historical evidence and are not current-tree acceptance.

Status: **bounded real login/session/read verification passed after explicit user authorization on 2026-10-20**. The current authorized-review section at the end and review-runbook.md supersede earlier blocked-run notes. Existing remote data was read; only authentication/session/audit writes were exercised. Credentials and database configuration were read privately at runtime, never displayed or copied into reports. Full migration/security/provider acceptance remains incomplete.

## Request and session path

1. `src/lib/components/auth/AuthForm.svelte` submits JSON to same-origin `/api/auth/login` or `/api/platform/auth/login`. The legacy APIs validate input, rate-limit, check credentials and return a user plus the HttpOnly session cookie. Password-policy checks mirror `src/modules/identity/auth.ts` in the reference; the backend remains authoritative.
2. `src/routes/api/[...path]/+server.ts` calls `src/lib/server/legacy.ts`. The relay accepts only inventoried methods/paths, forwards the session cookie alone, streams request/response bodies once, preserves upstream status and relevant upload/download headers, and makes no automatic retries. Cross-origin mutations are rejected. No application mutation or provider job has been reimplemented locally.
3. The relay validates the configured origin. Missing/invalid origin gives a safe `503 BACKEND_NOT_CONFIGURED`. Unreachable backend gives `502 BACKEND_UNAVAILABLE`. A login POST with a configured origin but no session database now fails **before forwarding** with `503 SESSION_DATABASE_NOT_CONFIGURED`, preventing creation of a session the target cannot read.
4. The original `src/modules/identity/auth.ts` creates an opaque session with a SHA-256 token hash and a 14-day database expiry. `setSessionCookie` uses `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production. The target strips an upstream Domain attribute to scope the cookie to its own host; it preserves security attributes and logout expiration.
5. Protected-page requests call `src/lib/server/context.ts`. They hash the cookie, read active/unexpired sessions and active users, resolve membership/organization/role, and enforce route guards. `src/lib/server/database.ts` opens its pool lazily, not at import/build. Invalid/expired sessions redirect to login; missing/unavailable session DB fails safely with a generic 503. Public/login routes do not require session resolution.

Synthetic tests verify forwarding, cookie attributes, subsequent session-cookie forwarding, logout expiration, multipart bytes, binary ranges, failure contracts and no retries. They do **not** prove real session continuity, credential validation, backend RBAC or tenant isolation.

## Required settings and service owners

| Variable or configuration | Consumer | Provided by | Required for |
|---|---|---|---|
| `LEGACY_BACKEND_ORIGIN` | Target `src/lib/server/legacy.ts` and `proxy-policy.ts` | Operator of the approved legacy backend | API relay, including login. Must be an origin with no credentials/path/query/fragment; HTTPS except explicit loopback HTTP; cannot point to the target itself. |
| `DATABASE_URL` (target) | Target `src/lib/server/database.ts`; login readiness check in `legacy.ts` | Administrator of an explicitly authorized isolated database | Session/context resolution and direct read loaders. Must read the same fixture schema and session records used by the backend. A separate empty database cannot establish continuity. No migration/seed is supplied or run. |
| `DATABASE_URL` (legacy backend) | Reference `src/db/client.ts` | Backend database administrator | Backend auth and business operations. The source contains a local fallback; do not rely on it or start a configured backend without validating the intended fixture environment. |
| `APP_URL` (legacy backend) | Reference `src/lib/email.ts`; auth register/recovery/verification endpoints | Deployment operator | Links for invitations/reset/verification. For the migrated experience, links must resolve to the approved Svelte public origin. This is not the relay backend origin. |
| `ORIGIN` | Adapter-node runtime | Target deployment operator | Canonical externally visible target origin behind deployment/proxy. Keep browser mutation origin and proxy forwarding consistent. |
| `HOST`, `PORT` | Adapter-node runtime / development CLI options | Local/deployment operator | Listener address/port; not credentials and not substitutes for backend/session configuration. |
| `NODE_ENV` | Both runtimes; legacy cookie/storage behavior | Runtime command/deployment | Production security semantics, including Secure cookies. Use an HTTPS topology compatible with the actual browser cookie policy; never strip Secure to make login appear to work. |
| `OBJECT_STORAGE_PROVIDER` | Reference `src/lib/storage.ts` | Legacy backend storage administrator | Approved local or R2 storage. Production has no implicit storage fallback. Local storage location/configuration belongs to the backend, not the Svelte target. |
| `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_ACCESS_KEY`, `OBJECT_STORAGE_SECRET_KEY` | Reference `src/lib/storage/r2.ts` | R2/object-storage administrator | Private upload/download storage when R2 is selected. These settings are not copied to client-side code or the target. |
| Configured email provider | Reference `configureEmailProvider` in `src/lib/email.ts` | Backend composition/bootstrap | Sending invitation, reset and verification mail. `APP_URL` alone does not configure delivery. An unconfigured provider reports `not_configured`. No SMTP/Resend environment variable is invented here. |
| Configured malware scanner | Reference `configureMalwareScanner` in `src/lib/malware.ts` | Backend security/provider composition | Admission of documents, receipts and resumes. Missing scanner returns 503; no scanning bypass or fake clean status is supplied. |
| Resume parser/AI, billing, queues and other provider configuration | Existing reference services and injected providers | Backend provider/platform operator | Their respective workflows. Presence of interfaces or provider-config UI does not prove bootstrap/provider connectivity. |

`docs/application-audit.json` contains a source-derived list of every environment identifier and its source consumers, without values. Debug/test-only identifiers in that list are not production login requirements. There is no public `VITE_` credential requirement. Do not paste `.env` content into this report or commit real configuration.

## Safe local verification procedure

1. Run `npm run check`, `npm run test`, and the synthetic browser suite: `pnpm.cmd exec playwright test --config playwright.workflows.config.ts`. The separate test harness has no production login bypass or backend connection; media is synthetic. For production smoke tests, run `npm run build`, then `npm run test:e2e`. Do not run a build concurrently with a dev server.
2. With no backend/session configuration, start only the target with `npm run dev`. Public/login pages should render; login must report the explicit configuration error. Do not publish a pretend successful login or use made-up credentials.
3. For **real integration**, an operator must first identify an already-provisioned, explicitly authorized isolated backend and its fixture database, with valid existing fixture accounts. Keep the original reference workspace unchanged; do not start it against unknown/default services, run bootstrap commands, or seed/migrate/reset anything. Obtain endpoint/database configuration through the approved secret channel, not chat or a committed file.
4. Configure the target's trusted backend origin and shared fixture read database. Configure the backend's public link origin and approved providers separately. Confirm matching schema, cookie transport/HTTPS and fixture account roles with the operator. Do not print connection strings, passwords, cookies or token-bearing links.
5. In a local browser, sign in with the authorized fixture account. Verify the success response, actual browser cookie attributes, target protected-page resolution, reload/session continuity and logout followed by denied protected navigation. Inspect cookies locally without logging/exporting their values. Check bad password, inactive user, expired/revoked session and unavailable DB/backend behavior with existing approved fixtures; do not mutate production state to create them.
6. Repeat approved business workflows with two distinct fixture tenants and permitted/denied roles, including private file access. UI hiding and a synthetic role object do not establish authorization or RLS. Record sanitized results and matching screenshots only. Provider, financial and background-job tests require their own approved fixture boundaries.

Until those steps are actually performed and recorded, login, RLS/tenant isolation, private files and provider integration remain **unverified**.

## 2026-10-20: backend configuration diagnosis and safe setup

Confirmed from source and configuration metadata: the reference uses Next.js API routes plus PostgreSQL/Drizzle. The target has no local environment files and neither required target connection setting was present. The relay therefore returns BACKEND_NOT_CONFIGURED before attempting login. A page rendering successfully does not establish backend connectivity. No running reference Node listener was found during local process inspection. No network probe was sent.

The reference database configuration is remote (its value is intentionally omitted). The user explicitly declined live access and will supply a separate authorized local backend. The reference runtime was not started, its database was not contacted, and no target configuration was activated. Existing data has not been read, copied, changed, or verified.

Supply `LEGACY_BACKEND_ORIGIN` for that approved running backend and `DATABASE_URL` for the same approved database that backend uses. The optional new `SYMPHOWORK_REFERENCE_ENV_FILE` accepts an explicitly supplied absolute path to a protected configuration file; it reads only DATABASE_URL at runtime and does not copy settings or mutate process.env. This is not automatic discovery and must not point at the remote reference configuration under the current authorization. Direct DATABASE_URL takes precedence. Invalid reference files fail with a sanitized error. `.env.example` contains names and comments only.

Run `node scripts/check-integration.mjs` from the target to check local configuration presence without printing values or sending network requests. Exit 2 means not ready; exit 0 only confirms presence/format, not availability or authorization. Restart the target after supplying authorized configuration. The checker uses development environment-file precedence; production should receive settings through its runtime environment/secret manager.

Once the authorized backend is supplied: use an explicitly authorized test account to sign in through the Svelte origin, refresh a protected page, navigate role-specific dashboards, then log out and verify the expired cookie cannot reopen a protected page. Check read-only organization/employee views first. Any organization/profile/attendance/payroll write needs separate live-mutation authorization. Use two fixture tenants and restricted database roles for isolation/private-file tests; none of those security properties have been established by the current synthetic suite.

## Safe local startup runbook — inspected 2026-10-20

**STOPPED: no approved database configuration is available. Do not run the startup commands below yet.** They are a procedure for the operator after approval, not a record of services started or login verified.

### Current evidence and approval boundary

- Reference configuration filenames: `.env.example` and `.env.local`. The example contains a loopback database example; this does not prove a database exists. The active local file points to a non-loopback database. Its values were neither printed nor copied.
- Target configuration filename: `.env.example` only; no active target connection configuration was found during the preceding inspection. No settings were activated by this runbook update.
- Windows service inspection found no PostgreSQL or Docker service; process inspection found no PostgreSQL process and no reference Node listener. This does not rule out WSL, a manually managed container, a tunnel, or an approved development service elsewhere. No such approved service/configuration has been supplied.
- TCP listener inspection found ports 3000 and 5173 free at inspection time. Neither is a running application endpoint. Both source configs have no port override. The installed Next CLI supports `--hostname`/`--port` and defaults to 3000; installed Vite supports `--host`, `--port`, and `--strictPort`.
- Remote database reachability, VPN/private-network requirements, TLS requirements, database permissions and authorization for local backend use cannot be inferred from a connection string or source code. No DNS/TCP/database probe was made. The data owner must confirm these facts and explicitly authorize the environment before any remote connection.

### Prerequisites the operator must supply

1. Identify an existing, approved development database containing the authorized application data and compatible schema. Obtain the connection configuration from the administrator/approved secret manager. Do not create an empty replacement, restore a dump, seed, migrate, push schema or bootstrap accounts as part of this procedure.
2. Obtain explicit permission for local Next.js and Svelte access to that database, including the necessary network/VPN/tunnel and TLS setup. Loopback alone is not proof of safety: a local tunnel may reach production. Both applications must resolve sessions and organization data against the same approved database. Appropriate existing database roles and transaction-context/RLS configuration must be supplied; do not grant privileges or disable RLS to make access work.
3. Obtain an approved existing test account and authorization for authentication's writes. Login creates a session and audit entry; failed login can also write an audit entry, and logout deletes the session. Therefore real login is not a purely read-only database test. No login is authorized or attempted by this documentation-only preparation.
4. Review provider/bootstrap behavior and supply only approved development provider settings. The original `.env.local` remains in place and Next will still load settings not overridden by the process environment. Overriding DATABASE_URL alone does not establish that every provider is safe. Do not enable mail/storage/AI/queue/billing operations from that file implicitly.

### Configuration names and secure delivery

- **Both processes: `DATABASE_URL`.** Required by reference `src/db/client.ts` and target `src/lib/server/database.ts`. Supply the approved connection using the operator's secret manager/inherited process environment in each terminal. Explicit nonempty process settings take precedence over Next's dotenv values. Never paste the connection into a command, terminal history, chat, log, or tracked file. Do not use the reference's fallback connection or example as evidence of an existing database.
- **Target: `LEGACY_BACKEND_ORIGIN`.** Supply the confirmed loopback backend origin only after successful startup and listener verification below. This is an origin, not an API path or the frontend's public link URL. No credentials, query or fragment are allowed. Keep it server-only.
- **Target optional: `SYMPHOWORK_REFERENCE_ENV_FILE`.** An absolute path to a separate operator-approved protected file can provide DATABASE_URL when direct DATABASE_URL is absent. Do not point this at the original remote `.env.local` under current authorization. This is optional; do not configure both approaches unnecessarily. Never copy the original environment file.
- **Backend link workflows: `APP_URL`.** Supplies the approved Svelte public origin for invitation/verification/reset links; it is not the backend listener setting. It is not required to validate an existing password/session. `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_APP_NAME` are public application metadata, not database/auth credentials.
- **Runtime:** `NODE_ENV` is set by the development commands. Do not force production cookie semantics onto plain HTTP or weaken Secure cookies. `HOST`, `PORT`, and adapter `ORIGIN` are deployment/runtime settings; the explicit development CLI flags below select local listeners without editing either manifest.
- No `AUTH_SECRET` read was found in the inspected password/session implementation: it uses password hashing and opaque database-backed session tokens. Presence in an example is not evidence that it is needed for this login path. Do not invent a value.
- Email, object storage and other optional provider configuration names and consumers are listed in the table above and `application-audit.json`. They require separate approved configuration before exercising those workflows; they are not substitutes for DATABASE_URL and do not need to be copied into the target for password login.

Use separate terminals with secret injection scoped to those processes. A target-only ignored `.env.local` containing operator-approved settings is an alternative if local policy permits protected secret files; enter values privately and verify file permissions/ignore rules. No such file was created. Never use shell transcripts or print process environments. Close the terminals after use to release inherited secrets.

### Startup sequence, only after prerequisites are satisfied

1. Have the operator make the approved existing database/network available. Check its identity and access with an approved read-only diagnostic before application startup, without logging the connection or returned personal data. No such diagnostic has been run here.
2. In a terminal with the **approved backend environment already securely injected**, guard against a missing DATABASE_URL and start the existing installed Next.js CLI through its unchanged script:

   ```powershell
   Set-Location -LiteralPath 'C:\Users\nares\Symphowork_V1_NM'
   if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) { throw 'Approved DATABASE_URL must be supplied before startup.' }
   npm run dev -- --hostname 127.0.0.1 --port 3000
   ```

   The guard checks presence only; the operator must have separately verified authorization and destination. It cannot establish safety. Do not install/regenerate dependencies. Next development normally creates generated `.next` cache files; application sources and configuration files must remain unchanged. If even generated writes in the reference checkout are prohibited, do not launch there; arrange a separately approved runtime checkout first.
3. Confirm Next reports Ready and inspect the actual loopback listener belonging to that process. Port 3000 is an explicit proposed choice, not a discovered existing service. If it is occupied or startup fails, stop and investigate; do not point the relay at an unrelated listener. Do not probe `/api/health` before database authorization: that endpoint accesses the database.
4. In the separate target terminal, securely supply the matching approved DATABASE_URL (or its approved protected-file reference) and LEGACY_BACKEND_ORIGIN matching that confirmed listener. Use the same loopback hostname consistently when opening the frontend to avoid host-only cookie confusion. Run the local-only diagnostic:

   ```powershell
   Set-Location -LiteralPath 'C:\Users\nares\Symphowork_Svelte_V1'
   node scripts/check-integration.mjs
   if ($LASTEXITCODE -ne 0) { throw 'Integration configuration is not ready.' }
   npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
   ```

   The diagnostic reports names/booleans only and sends no requests. Passing it does not verify availability, authorization, schema or credentials. Vite exits if 5173 is occupied. Confirm the actual startup output before using that listener; do not run a build concurrently.
5. Open the login screen on the confirmed Svelte listener. Configuration-name errors should disappear only after both required settings are available. A connection error or database error must be investigated without exposing driver details; never fabricate a successful session.
6. With separately authorized test credentials/authentication writes, verify sign-in, protected-page navigation, refresh/session continuity, read-only organization data, logout, then denied protected navigation. Do not log/export cookies or token-bearing URLs. Do not test organization edits, payroll, invitations or provider actions without separate authorization. Existing-data identity, role restrictions and tenant/private-file isolation require actual authorized tests; none is confirmed by starting the servers.
7. Stop each owned dev server using Ctrl+C and close its secret-bearing terminal. Do not kill unrelated processes or modify the original files.

**Remaining blockers:** administrator-confirmed approved data source and local access permission; secure matching database configuration; any required approved network setup; approved existing test credentials plus authorization for session/audit writes; provider review before backend activation. No services, databases or providers were contacted or started in this preparation. No login, session continuity or existing-data test was performed.

## Urgent review preparation: executable local-only guard

See `docs/review-runbook.md` and `scripts/start-local-review.mjs`. The launcher loads target environment files only, refuses missing/remote database configuration and invalid/self backend origins, and defaults to offline configuration validation. `--start` launches only target Vite on explicit loopback port 5173 with strict-port behavior. No backend or database was started; current configuration is missing and the launcher exits before spawning a process.

The current request prohibits *all* writes to the reference workspace. This supersedes the earlier direct reference dev command in this document: Next dev generates cache/possibly generated TypeScript files, so an independently approved backend runtime checkout is required before launching the backend. Never copy original secrets or provider configuration into it. Actual remote network reachability and permission remain unknown; there has been no authorization for remote access. Administrator-supplied approved data/configuration and existing credentials remain the exact blockers.

## Authorized existing-data review — supersedes earlier blocked status

The user explicitly authorized the existing remote database for development login/session/audit writes and private use of the existing local review accounts. The approved database reference is now configured in target-only ignored `.env.local` via LEGACY_BACKEND_ORIGIN and SYMPHOWORK_REFERENCE_ENV_FILE; no secret values or original environment file were copied. The authoritative backend was staged into ignored `.review-backend`, excluding environment/credential files, and started with the approved DATABASE_URL extracted in memory. Original application files remain unchanged. No provider settings were imported from the reference file.

Both listeners were verified (backend 3000, frontend 5173), and the original backend's SELECT-1 health check passed. Real API authentication, refresh continuity, organization/employee reads and role denials were verified using three existing approved accounts. Invalid credentials returned 401, logout returned 200 and subsequent protected requests redirected. No business mutation, migration, seed, reset or provider call was performed. Natural expiration and full tenant/private-file security acceptance remain unverified.

Use `docs/review-runbook.md` for the current startup commands and precise verification boundaries. Earlier no-live authorization and blocked sections above describe prior runs; they are superseded only within the explicitly approved authentication/read scope. A changed database destination needs renewed approval. Original error logs can contain driver details, so the authorized backend launcher emits only sanitized lifecycle messages.
