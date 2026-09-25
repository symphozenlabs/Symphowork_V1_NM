# SymphoWork_v1

Production foundation for SymphoWork, a future multi-tenant HRMS, ATS, recruitment intelligence, and productivity platform.

## Current milestone

This repository contains the foundation plus identity, SaaS security, organization/employee operations, attendance, leave, configurable workflows, approvals, and notification-event foundations.

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
Prompt 4 modules are documented in [docs/attendance.md](docs/attendance.md), [docs/leave.md](docs/leave.md), [docs/workflows.md](docs/workflows.md), and [docs/approval-engine.md](docs/approval-engine.md).
Prompt 5 modules are documented in [docs/expenses.md](docs/expenses.md), [docs/documents.md](docs/documents.md), and [docs/notifications.md](docs/notifications.md).
Prompt 6 payroll is documented in [docs/payroll.md](docs/payroll.md). It is a configurable India payroll foundation, not a legal-compliance claim; statutory values require production verification.
Prompt 7 ATS core is documented in [docs/ats.md](docs/ats.md). Resume intelligence, semantic search, and AI scoring are intentionally deferred to later prompts.
Prompt 8 resume intelligence is documented in [docs/resume-intelligence.md](docs/resume-intelligence.md). Deterministic extraction and provider contracts are included; external AI, embeddings, and ranking remain deferred.
Prompt 9 recruiter intelligence is documented in [docs/recruiter-intelligence.md](docs/recruiter-intelligence.md). Transparent deterministic search, requirement extraction, matching, explanations, versioned snapshots, and provider-neutral embedding persistence are included; real vector retrieval and external AI remain opt-in/deferred.
Prompt 10 collaboration is documented in [docs/projects-tasks.md](docs/projects-tasks.md) and [docs/internal-chat.md](docs/internal-chat.md). Organization-scoped projects, tasks, comments, dependency protection, conversations, paginated messages, and Prompt 11 source boundaries are included; realtime, full attachment flows, and Chat-to-Task automation remain deferred.
Prompt 11 is documented in [docs/chat-to-task.md](docs/chat-to-task.md), [docs/billing.md](docs/billing.md), and [docs/reporting.md](docs/reporting.md). Chat-to-Task conversion, provider-neutral entitlements, usage foundations, and permission-controlled operational reports are included; real payment processing, realtime, and advanced reporting remain deferred.
