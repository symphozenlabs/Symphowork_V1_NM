# Deployment checklist

Deploy the SvelteKit frontend and the root Next.js API/backend as distinct services. The Svelte deployment is built from `svelte/` with its pinned lockfile and Node adapter. The root deployment retains Next.js route handlers and the backend modules they call; it no longer serves the SymphoWork user interface.

Configure each service with only its required secrets through the hosting platform's secret manager. The root backend requires its database, authentication, application URL, and configured provider values as described in `.env.example` and `docs/environment.md`. Svelte requires `LEGACY_BACKEND_ORIGIN` and the approved database configuration for server-side session/context reads; see `svelte/docs/auth-environment.md`. Do not expose secrets to the browser or commit local environment files.

Before deployment:

1. Route the Svelte service and API service through an explicit origin/reverse-proxy design. Configure the Svelte backend origin to the authoritative API service and verify cookie domain, secure, SameSite, and HTTPS behavior.
2. Apply database migrations only through the approved release process against the intended database.
3. Verify schema, constraints, indexes, RLS policies, transaction context, and two-tenant isolation with isolated fixtures.
4. Configure private storage, signed URLs, malware scanning, and upload retention/deletion policy.
5. Configure email delivery, distributed rate limiting, CAPTCHA/bot controls, and alerting.
6. Run unit, integration, cross-tenant, and Svelte Playwright critical journeys.
7. Configure backups, point-in-time recovery, restore drills, logs, metrics, secret rotation, and incident response.
8. Build both services from the release commit and verify API and frontend health independently.

Production deployment and live integration remain unverified. Structural route coverage and local automated checks do not establish tenant isolation, private-file authorization, successful business mutations, visual parity, or performance improvements; see `svelte/docs/verification-latest.json` for recorded evidence and remaining gaps.
