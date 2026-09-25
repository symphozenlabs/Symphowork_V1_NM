# Security controls

Implemented controls include password hashing, expiring HTTP-only sessions, SameSite cookies, organization membership checks, permission checks, tenant-scoped queries, migration RLS policies, signed storage URL boundaries, input sanitization for collaboration text, safe error messages, audit records, idempotency fields, pagination, and security headers.

Required before production: PostgreSQL RLS tests with two tenants, cross-tenant attack tests, CSRF review for deployed cookie architecture, endpoint rate limiting, public ATS abuse protection/CAPTCHA, malware scanning for resumes/uploads, storage-provider security review, dependency scanning, and a complete authorization matrix test.

No secrets were added to the repository. Private chat content and sensitive provider credentials are not intended for logs.
