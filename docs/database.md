# Database

Drizzle ORM targets PostgreSQL using the `postgres` driver. Schema definitions live in `src/db/schema.ts`; generated migrations are stored in `drizzle/` and applied with `pnpm db:migrate`.

The schema now contains identity, sessions, organizations, memberships, roles, permissions, plans, subscriptions, invitations, provisioning jobs, audit logs, HR master data, employees, history, documents, and onboarding. Every table uses UUID identifiers and UTC-aware timestamps. Organization-owned tables use `organization_id` and the generated migration enables PostgreSQL RLS with transaction-local tenant context variables. Future organization-owned tables must add the same boundary and indexes for tenant-scoped access patterns.
