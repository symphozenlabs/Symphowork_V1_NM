# Deployment checklist

Required environment: \`DATABASE_URL\`, \`AUTH_SECRET\`, \`APP_URL\`, private object-storage configuration, production email provider, and a controlled migration execution step. Optional provider configuration includes AI/embeddings, billing, realtime, job queue, rate limiting, and error monitoring.

Before deployment:

1. Apply all generated migrations to a staging database.
2. Verify schema, constraints, indexes, RLS policies, transaction context, and two-tenant isolation with fixtures.
3. Configure private storage, signed URLs, malware scanning, and upload retention/deletion policy.
4. Configure email delivery, distributed rate limiting, CAPTCHA/bot controls, and alerting.
5. Run unit, integration, cross-tenant, and Playwright critical journeys.
6. Configure backups, point-in-time recovery, restore drills, logs, metrics, secret rotation, and incident response.
7. Run the production build from the release commit and verify runtime health checks.

Vercel/runtime compatibility is build-verified locally only; deployment, provider configuration, backup/restore, and production smoke testing were not performed in this workspace.
