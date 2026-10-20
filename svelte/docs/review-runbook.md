# Svelte review runbook

## Start the migrated frontend

From the repository's `svelte/` directory, install from the frozen lockfile and run the SvelteKit application:

```powershell
pnpm install --frozen-lockfile
pnpm run dev
```

Vite normally uses port 5173. Confirm the actual startup URL before opening it. The frontend cannot sign in without an approved `LEGACY_BACKEND_ORIGIN` and a matching authorized `DATABASE_URL` supplied securely to this runtime.

## Backend and data prerequisites

This repository preserves the original Next.js app at its root. It remains authoritative for API mutations and authentication. This Svelte directory does not include an isolated backend runtime, backend dependencies, `.review-backend`, credentials, or environment files. Run the backend only through its separately approved deployment/development process. Do not run Next.js development mode from a protected original checkout if generated-file writes are prohibited.

Svelte and Next must use the same explicitly approved database for session continuity. No empty replacement database, migrations, seeds, resets, or provider configuration are supplied by this frontend. See `auth-environment.md` for required variable names and safe configuration boundaries.

## Validation

Use authorized test accounts only. Verify login, page navigation, refresh, logout and post-logout denial. Begin with read-only data inspection. Successful organization, payroll, invitation, upload, private-file, or provider operations require explicit approval and an approved disposable test dataset.

Automated fixture/browser checks and their limits are recorded in `verification-latest.json`. They do not establish live authentication, business persistence, RLS/tenant isolation, private-file authorization, visual parity, or performance improvements.
