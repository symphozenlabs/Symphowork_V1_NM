# SymphoWork V1 — SvelteKit

The canonical frontend and application API runtime in this workspace use Svelte 5 and SvelteKit. SvelteKit serves pages and same-origin API endpoints on one server. The root application replaces the prior Next.js runtime. Historical Next.js source remains recoverable from Git history and the local delivery backups; it is not needed at runtime. Compatibility module names resolve to local SvelteKit adapters, not Next.js or React packages.

## Local development

Requirements: Node.js 24.16.x and npm 10 or 11. `package-lock.json` is the canonical dependency lockfile.

```powershell
npm ci
npm run dev
```

Open `http://localhost:5173`. The dev script binds to loopback port 5173; it does not launch a Next.js server or require port 3000. Use `npm install` when intentionally changing dependencies and commit the resulting `package-lock.json`. Stop the owned dev server with Ctrl+C.

Useful checks:

```powershell
npm run check
npm test
npm run test:e2e -- --config playwright.workflows.config.ts --reporter=line --output=test-results/workflows-local
npm run build
npm run start
```

The workflow browser suite uses synthetic fixtures and intercepted API responses. The foundation browser suite requires a production build and checks public pages, anonymous access guards, security headers, and unavailable-database behavior. Do not overwrite existing review artifacts; select a new output directory when running Playwright.

## Configuration and data

Database-backed routes require `DATABASE_URL` for an already provisioned, authorized PostgreSQL database compatible with `src/db/schema.ts`. Supply it through the local secret manager/process environment or an ignored target `.env.local`; never copy the original `.env.local` or commit populated environment files. Without database configuration, public pages remain available and database-backed endpoints fail with a sanitized 503. The DB client does not fall back to a localhost database. Tenant and platform database transactions establish context using transaction-local PostgreSQL `set_config(..., ..., true)` GUCs (`app.current_user_id`, `app.current_organization_id`, `app.current_invitation_token_hash`, `app.is_platform_owner`).

`APP_URL` supplies public links for invitation, verification, and recovery flows. Email, malware scanning, object storage, AI, billing, realtime, and queue capabilities require their own authorized provider setup. A variable being present does not prove the provider is bootstrapped or reachable. See [auth and environment setup](docs/auth-environment.md).

## Migration status

Static inventories currently map 52 original pages and 131 API paths/method sets. That is structural coverage, not proof of complete functional parity. Successful business persistence, full role/tenant acceptance, RLS, private-file authorization, all provider workflows, original-versus-Svelte screenshots, and a controlled comparative performance baseline remain outstanding. `ORGANIZATION_ADMIN` is not a role in the original source and needs a business decision before it can be added.

See [migration progress](docs/migration-progress.md), [the API crosswalk](docs/api-routes.csv), and [the latest verification record](docs/verification-latest.json) for current evidence and blockers.

## Visual and performance acceptance

Compare the unchanged reference and Svelte app only with approved synthetic fixtures and matching browser, viewport, locale, and clock settings. Capture equivalent routes and states; review interactions, keyboard access, loading/error/empty states, and responsive layouts. Do not use personal data in screenshots or traces.

Performance comparisons require matched production builds, roles, data, backend conditions, browser settings, and repeated measurements. Existing target-only or one-off samples do not establish an improvement.
