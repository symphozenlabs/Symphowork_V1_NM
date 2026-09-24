# Development

1. Install Node.js 20+ and pnpm.
2. Run `pnpm install`.
3. Copy `.env.example` to `.env` and provide a PostgreSQL URL plus an `AUTH_SECRET` of at least 32 characters.
4. Run `pnpm dev`.

Use `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` before opening a pull request. Use Conventional Commits such as `feat: add organization membership model`.
