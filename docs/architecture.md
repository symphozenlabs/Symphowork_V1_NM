# Architecture

SymphoWork now has a SvelteKit frontend in `svelte/` and a separately run Next.js API/backend at the repository root. The migration removes the legacy React presentation layer while retaining the Next.js server because Svelte still relays authentication and business API requests to its route handlers.

## Boundaries

- Presentation: Svelte pages, components, and browser behavior under `svelte/src/`.
- API/backend: Next.js route handlers under `src/app/api/`.
- Application/domain: services, validation, authentication, and authorization under `src/modules/` and `src/lib/`.
- Persistence: PostgreSQL and Drizzle schema/client/migrations under `src/db/` and `drizzle/`.
- Svelte session/context reads: the Svelte server uses the approved database connection and backend session semantics; see `svelte/docs/auth-environment.md`.

The Next.js app shell and middleware remain only to host and protect the API runtime. There are no Next.js user-facing pages or React component library in this repository. React remains a transitive/runtime requirement of Next.js and the backend's Next request-context helpers.

Svelte and the API are separate services. SvelteKit needs `LEGACY_BACKEND_ORIGIN` for API forwarding and an approved `DATABASE_URL` for its session/context reads. The Next.js backend uses its own environment configuration. Do not infer that structurally mapped routes establish complete business parity or tenant/file security; the migration evidence in `svelte/docs/verification-latest.json` records outstanding acceptance gaps.
