# Deployment checklist

Required environment: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, private object storage configuration, production email provider, and a migration execution step. Optional provider configuration includes AI/embeddings, billing, realtime, job queue, rate limiting, and error monitoring.

Before deployment:

1. Apply migrations 0000–0011 to a staging database.
2. Verify schema, constraints, indexes, and RLS with tenant fixtures.
3. Configure private storage and signed URLs.
4. Configure email delivery and public-application abuse controls.
5. Run the full Playwright suite and critical cross-tenant security tests.
6. Configure backups, point-in-time recovery, restore drills, logs, metrics, alerts, and secret rotation.
7. Run the production build from the release commit.

Vercel/runtime compatibility has only been build-verified locally; deployment itself was not performed.
