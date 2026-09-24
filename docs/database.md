# Database

Drizzle ORM targets PostgreSQL using the `postgres` driver. Schema definitions live in `src/db/schema.ts`; generated migrations are stored in `drizzle/` and applied with `pnpm db:migrate`.

The initial schema contains only a minimal identity placeholder (`users`) and system configuration. Every table uses UUID identifiers and UTC-aware timestamps. Future organization-owned tables must add an explicit `organization_id` foreign key and indexes for tenant-scoped access patterns.
