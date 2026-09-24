# Security

- Passwords use `scrypt`; plaintext passwords, hashes, sessions, and invitation tokens are not logged.
- Session cookies are HTTP-only, SameSite=Lax, secure in production, and backed by expiring server records.
- Protected server operations do not trust client-provided organization IDs.
- Audit events capture security-relevant identity and provisioning actions without sensitive token material.
- RLS policies provide a second tenant boundary for the identity-owned tenant tables.
- Rate limiting, CSRF protection for mutation endpoints, and production email delivery remain explicit follow-up work before public launch.
