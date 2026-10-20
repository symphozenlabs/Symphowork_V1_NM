# SymphoWork

SymphoWork's canonical user interface is the Svelte 5 + SvelteKit application in [`svelte/`](svelte/). The root Next.js application is retained as the authoritative API/backend while Svelte migration coverage is completed. Its user-facing React routes and components have been removed.

## Application layout

- `svelte/` contains the SvelteKit frontend, its own lockfile, checks, tests, and Node deployment adapter.
- `src/app/api/` contains the authoritative Next.js API routes used by the Svelte relay.
- `src/db/`, `src/modules/`, and `src/lib/` contain the PostgreSQL/Drizzle access, authentication, tenant authorization, business services, provider integrations, and shared backend logic used by those routes.
- The root Next.js package runs the API service. It is not the canonical frontend.

Svelte currently requires the Next.js API origin and approved database configuration for session/context reads. See [`svelte/docs/auth-environment.md`](svelte/docs/auth-environment.md) and [`svelte/docs/relocation-and-development.md`](svelte/docs/relocation-and-development.md). Do not copy production credentials into local files or run database migrations as part of ordinary startup.

## Local development

Install each application from its own directory with the pinned pnpm version and frozen lockfile:

```powershell
pnpm install --frozen-lockfile
pnpm --dir svelte install --frozen-lockfile
```

Configure the root Next.js API and Svelte frontend with an authorized development backend/database using the environment variable names documented in their respective environment guides. Start the API from the repository root with `pnpm dev` (Next.js defaults to port 3000), then start the frontend with `pnpm --dir svelte dev` (Vite defaults to port 5173). The Svelte API relay must target the running API through `LEGACY_BACKEND_ORIGIN`.

Frontend checks:

```powershell
pnpm --dir svelte run check
pnpm --dir svelte test -- --run
pnpm --dir svelte run build
pnpm --dir svelte run test:e2e
```

Backend checks:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The root `pnpm build` builds the API service. Database commands such as `db:migrate`, `db:push`, and bootstrap scripts are operational data changes; run them only through the separately approved database process.

## Architecture and acceptance status

The Svelte frontend is structurally independent from the removed React presentation layer. It is not yet independent of the Next.js API/backend. See [`docs/architecture.md`](docs/architecture.md), [`docs/development.md`](docs/development.md), and the Svelte migration records in [`svelte/docs/`](svelte/docs/).

Removing the React UI does not establish live tenant isolation, private-file authorization, successful business mutation parity, visual parity, or performance improvements. Those remain explicit acceptance gaps until verified against an authorized integration environment.
