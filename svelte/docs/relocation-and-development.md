# Svelte relocation and development notes

## What was moved

The application is located under the repository's `svelte/` folder. Its `package.json`, Svelte/Vite/TypeScript configuration, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, routes, components, assets, tests, and migration documentation are present. Dependencies and generated files are not checked in. No environment or credential files are included.

The package declares pnpm 11.19.0. Install with `pnpm install --frozen-lockfile` from `svelte/`. The locked install initially stopped because pnpm v11 requires explicit approval for dependency lifecycle scripts. `esbuild` was individually approved and its postinstall completed. `pnpm-workspace.yaml` records that approval; `pnpm-lock.yaml` and dependency versions are unchanged. Do not approve other package scripts without review.

## Runtime and path assumptions

SvelteKit loads configuration from the process environment and its current project directory. Run package commands with the working directory set to `svelte/`; local ignored `.env` files, if an operator chooses to create one, belong there and must never be copied to source control. This published tree contains no such files.

The application uses root-relative routes and `/api/...` calls. Moving its files beneath a repository subdirectory does not configure a `/svelte` URL prefix. Its Vite config also disables automatic PostCSS discovery: otherwise Vite inherits the parent Next.js `postcss.config.mjs`, whose `@tailwindcss/postcss` dependency is not part of the Svelte dependency set. Tailwind remains integrated by `@tailwindcss/vite`. Run the Svelte adapter-node server as a separate service, normally behind its own hostname or root-path routing. A reverse proxy must route the browser's app and same-origin `/api` requests consistently to SvelteKit. This tree does not merge SvelteKit into the Next.js process, reassign API ownership, set a base path, or create deployment/proxy configuration.

`LEGACY_BACKEND_ORIGIN` is the server-only origin of the separately running authoritative Next.js API backend. `DATABASE_URL` is consumed by SvelteKit for session/context resolution and read loaders, and by Next.js for auth and business operations. For real login they must point to the same explicitly approved database/session store. A separate empty database does not provide existing users or session continuity. `APP_URL` belongs to Next.js and should be the public Svelte origin for generated auth/invitation links. `HOST`, `PORT`, and adapter `ORIGIN` are runtime settings. Provider configuration remains backend-owned and must be authorized separately.

The included `scripts/start-local-review.mjs` is a local-only configuration guard and Vite launcher; it refuses remote database destinations. The previous ignored `.review-backend` runtime and authorized backend launcher were not copied. `scripts/start-authorized-backend.mjs` is consequently not included. The Svelte dev command cannot start the Next.js backend by itself. Do not point it at the original working checkout for a dev server if that would generate files there; use an approved isolated backend runtime or managed development service.

## Verification from this location

The relocated application was installed from the frozen pnpm lock, type-checked, unit-tested, production-built, and tested with both browser suites. Refer to `verification-latest.json` for counts and boundaries. Tests use fixtures and disabled backend/database configuration. No live login or data access was performed as part of this release preparation.

Before a real review, an operator must securely supply authorized settings, start/identify the approved backend independently, and verify the actual listener and database destination. Do not use production credentials/configuration without separate authorization. No migrations, seeds, resets, or business mutations are part of startup.


The generated source-port JSONL trace, test-results, build outputs, backend runtime copy, ignored secrets, and dependency directories were excluded from the release copy.
