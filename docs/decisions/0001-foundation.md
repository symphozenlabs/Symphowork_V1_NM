# ADR 0001: Foundation architecture

## Decision

Build SymphoWork as a modular monolith on Next.js, React, TypeScript, PostgreSQL, and Drizzle ORM, with provider interfaces for email, storage, AI, and jobs.

## Rationale

- A modular monolith keeps deployment and local development simple while preserving domain boundaries for future extraction.
- PostgreSQL provides transactional integrity, mature indexing, and a straightforward Neon-compatible production path.
- Direct PostgreSQL avoids coupling the application domain to Supabase-specific APIs and keeps infrastructure replaceable.
- Domain boundaries make tenant isolation, permissions, and future ATS intelligence easier to reason about.
- Provider abstractions prevent vendor details from leaking into domain logic and allow later selection of AI, email, and object storage vendors.
- Vercel is a good fit for the Next.js web layer; long-running/background work can be added through a queue and worker runtime later.

## Deferred

Authentication, multi-tenancy, RBAC, background workers, rate limiting implementation, and all HRMS/ATS/productivity modules belong to later prompts.
