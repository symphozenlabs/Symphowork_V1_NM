# SymphoWork SvelteKit production cutover checklist

This checklist validates the SvelteKit production entrypoint. It does not deploy automatically or change Vercel environment values.

## Local verification

Run the existing backend and SvelteKit transition server through the dedicated browser suite:

```bash
pnpm test:e2e:svelte
```

The suite starts SvelteKit on port 4173. Native SvelteKit API handlers serve the application; the legacy bridge remains only as a bounded fallback.

## Required hosted configuration

The SvelteKit deployment requires the same server-side runtime configuration as the existing backend: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, and applicable email/storage/provider variables. `LEGACY_API_ORIGIN` is optional. None of these values may be public/browser variables.

## Cutover gate

Do not switch the production Vercel entrypoint until:

- `pnpm svelte:check` passes.
- `pnpm svelte:build` passes.
- `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass.
- `pnpm test:e2e:svelte` passes against a deployed SvelteKit environment.
- Login, invitation acceptance, organization setup, provisioning, and the highest-risk tenant workflows are manually checked with non-production test accounts.
- no server-only variable is exposed through client bundles.

The repository contains the Vercel build/output configuration, but this task intentionally does not deploy or change Vercel environment values.
