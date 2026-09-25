# Production readiness assessment

Assessment date: 2026-09-25.

## Executive status

The repository is suitable for continued staging verification, not certified production-ready. Application-level hardening was applied in this pass, but database/RLS integration, provider configuration, backups/recovery, dependency audit, and deployment verification remain open.

## Verified or fixed in this pass

- Authentication and platform-login throttling are implemented with a bounded process-local limiter.
- Public ATS application, registration, and password-reset endpoints are throttled.
- Unauthorized platform-login attempts do not retain the session created before the platform-role check.
- Production-only HSTS was added; existing HTTP-only, Secure-in-production, SameSite=Lax session behavior remains.
- TypeScript, ESLint, unit tests, build, migration generation, and diff checks are required release gates and are reported from the current run.

## Release blockers and residual risk

- RLS policies and transaction context wiring require a configured PostgreSQL database and two-tenant integration tests.
- The limiter is process-local; distributed production enforcement requires the configured external rate-limit provider.
- CAPTCHA/bot protection and malware scanning are not implemented.
- Private object storage, email, billing, realtime, queue, monitoring, backups, restore drills, and deployment were not verified in this workspace.
- CSP still contains Next.js compatibility allowances (\`unsafe-inline\`/\`unsafe-eval\`) and needs a deployment-specific tightening plan.

This is a technical readiness assessment, not a legal compliance certification.
