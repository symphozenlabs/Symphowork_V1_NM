# Development

Use Node.js 24.16.x and pnpm 11.19.x. Install the API and frontend dependencies from their own package roots with frozen lockfiles:

```powershell
pnpm install --frozen-lockfile
pnpm --dir svelte install --frozen-lockfile
```

The root Next.js service provides the authoritative API and uses the environment variables documented by `.env.example` and `docs/environment.md`. The Svelte service uses its own configuration documented in `svelte/docs/auth-environment.md`. Supply values through a protected local environment file or secret manager; do not copy production environment files into the repository.

Start the services in separate terminals after authorized local backend and database configuration is available:

```powershell
# Repository root: API/backend, normally http://localhost:3000
pnpm dev

# Svelte frontend, normally http://localhost:5173
pnpm --dir svelte dev
```

The Svelte relay requires `LEGACY_BACKEND_ORIGIN` to identify the running authorized Next.js API service. Session/context reads also require `DATABASE_URL` according to the Svelte auth environment guide. Public Svelte pages can be inspected without this integration; real authentication requires it.

Run Svelte checks from the repository root:

```powershell
pnpm --dir svelte run check
pnpm --dir svelte test -- --run
pnpm --dir svelte run build
pnpm --dir svelte run test:e2e
```

Run backend checks with `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Root API build output is not a frontend deployment. Do not run database migrations, pushes, bootstrap, or other data-changing commands without separate authorization and the approved database process.
