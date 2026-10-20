# SymphoWork V1 — SvelteKit migration

This directory contains the Svelte 5 + SvelteKit application migrated from the original Next.js project. The Next.js application remains at the repository root and is preserved as the authoritative API/backend during this migration.

## Requirements and local commands

Use Node.js 24.16.x and pnpm 11.19.x. From this directory:

```powershell
pnpm install --frozen-lockfile
pnpm run dev
pnpm run check
pnpm test -- --run
pnpm run build
pnpm run start
```

The dev server normally starts at `http://localhost:5173`. It requires an authorized Next.js API origin and the same approved database used for session/context reads. See [auth-environment.md](docs/auth-environment.md). The lockfile pins the complete dependency graph; do not substitute npm install or regenerate the lockfile.

The workflow browser suite can be run with `pnpm exec playwright test --config playwright.workflows.config.ts`. Production browser smoke tests require `pnpm run build` first, then `pnpm run test:e2e`. Test commands write generated output under ignored `test-results/` and build artifacts under ignored `build/` and `.svelte-kit/`.

## Deployment layout

Placing the project in `svelte/` organizes source files in the repository; it does not make the application live under a `/svelte` URL prefix. SvelteKit retains its default root URL and API paths. Deploy it as a separate Node service or behind a reverse proxy that routes its hostname/root path to this service. Serving it alongside Next.js on one hostname requires an explicit routing design; this migration does not configure a base path or change backend ownership.

No `.env` file, credentials, cookies, backend runtime copy, `node_modules`, build output, or test-result artifacts are included. Supply approved configuration through a protected local secret mechanism. The API backend remains the original Next.js service; it must be made available independently and safely. No database, backend, or provider is contacted by the Svelte build.

## Acceptance status

Structural coverage currently maps 52 original page paths and 131 API route/method contracts. Automated checks are documented in [verification-latest.json](docs/verification-latest.json). This does not establish full workflow parity, live tenant isolation, private-file authorization, successful business persistence, visual parity, or performance improvement.
