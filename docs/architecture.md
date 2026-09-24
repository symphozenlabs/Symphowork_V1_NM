# Architecture

SymphoWork uses a modular monolith: one Next.js deployment with explicit domain and infrastructure boundaries. The UI lives under `src/app` and `src/components`; cross-cutting contracts live under `src/lib`; persistence lives under `src/db`; future business capabilities belong under `src/modules/<domain>`.

Prompt 2 adds identity, organizations, memberships, tenant-aware request context, and authorization without moving the shell. Platform identity remains separate from organization membership.

## Boundaries

- Presentation: App Router pages, layouts, and reusable UI components.
- Application/domain: future module services and validation schemas.
- Infrastructure: Drizzle/PostgreSQL, email, object storage, AI, and jobs.
- Platform: configuration, logging, errors, and security policy.

Organization-owned tables must carry `organization_id` when they are introduced. Platform data must remain separate from tenant data.
