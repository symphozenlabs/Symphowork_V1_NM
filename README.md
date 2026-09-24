# SymphoWork_v1

Production foundation for SymphoWork, a future multi-tenant HRMS, ATS, recruitment intelligence, and productivity platform.

## Current milestone

This repository contains the foundation plus the identity and SaaS security milestone: email/password identity, hashed sessions, email verification/reset foundations, organizations, memberships, database-backed RBAC, tenant authorization, provisioning, subscriptions, invitations, audit logging, and protected platform/workspace routes. It does not implement HRMS, ATS, payroll, chat, or task features.

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

See [docs/architecture.md](docs/architecture.md), [docs/authentication.md](docs/authentication.md), [docs/multi-tenancy.md](docs/multi-tenancy.md), [docs/rbac.md](docs/rbac.md), [docs/provisioning.md](docs/provisioning.md), [docs/security.md](docs/security.md), and [docs/decisions/0001-foundation.md](docs/decisions/0001-foundation.md).
