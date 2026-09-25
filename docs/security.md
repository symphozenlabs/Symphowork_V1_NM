# Security controls

## Implemented or verified in code

Password hashing, expiring HTTP-only sessions, production Secure cookies, SameSite cookies, organization membership checks, permission checks, tenant-scoped queries, migration RLS policies, signed storage URL boundaries, input validation/sanitization, safe error responses, audit records, idempotency fields, pagination, and security headers are present. Login, platform login, public ATS applications, registration, and password reset now have bounded process-local request throttling. Unauthorized platform login sessions are removed before returning 403.

## Not verified or incomplete

PostgreSQL RLS behavior has not been integration-tested because no \`DATABASE_URL\` was available. The transaction helpers that set RLS context require runtime verification. Distributed rate limiting, CAPTCHA/bot protection, malware scanning, storage-provider policy, dependency scanning, backup/restore, and deployment security are infrastructure-dependent and remain open. CSRF protection requires review against the deployed cookie architecture; SameSite=Lax reduces risk but is not a substitute for a deliberate deployment decision.

No secrets were added to the repository. Sensitive credentials and private chat content are not intended for logs.
