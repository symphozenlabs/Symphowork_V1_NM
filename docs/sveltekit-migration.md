# SvelteKit migration

SvelteKit is now the production application entrypoint. The former Next.js application remains in the repository as a source-compatible service/module reference, while all existing application, platform, authentication, health, and public-job API routes have native SvelteKit handlers.

## Local development

From the repository root:

```bash
pnpm svelte:dev
```

SvelteKit runs through `pnpm dev`. The optional `LEGACY_API_ORIGIN` variable remains available only as a server-side fallback for the catch-all bridge; native routes do not depend on it. No database or storage credentials are exposed to the browser.

## Boundaries

- Neon/PostgreSQL, Drizzle migrations, RLS, storage, and business services are unchanged.
- The former Next.js source remains available for reference and compatibility, but is no longer the production entrypoint.
- The root `vercel.json` configures Vercel to build the SvelteKit adapter output.
- SvelteKit pages use native authorization-protected APIs throughout the current route surface.
- `src/lib/server/legacy-api.ts` is server-only and is the single bridge boundary for the incremental transition.
- `src/hooks.server.ts` adds baseline browser security headers without changing authentication or authorization behavior.
