# SymphoWork_v1

Production foundation for SymphoWork, a future multi-tenant HRMS, ATS, recruitment intelligence, and productivity platform.

## Current milestone

This repository contains the first foundation milestone only: a responsive application shell, design tokens, PostgreSQL/Drizzle setup, typed environment validation, safe error handling, structured logging, provider interfaces, and test infrastructure. It does not claim to implement HRMS, ATS, payroll, chat, or task features.

## Stack

Next.js App Router, React, TypeScript strict mode, Tailwind CSS v4, shadcn-style Radix primitives, PostgreSQL, Drizzle ORM, Zod, Vitest, Playwright, ESLint, Prettier, and pnpm.

## Commands

```bash
pnpm install
cp .env.example .env
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Database commands: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, and `pnpm db:studio`.

See [docs/architecture.md](docs/architecture.md), [docs/development.md](docs/development.md), [docs/database.md](docs/database.md), and [docs/decisions/0001-foundation.md](docs/decisions/0001-foundation.md).
