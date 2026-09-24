# Authentication

Authentication uses email/password identity records, Node `scrypt` password hashing, opaque random tokens, SHA-256 token hashes in PostgreSQL, and an HTTP-only `symphowork_session` cookie. Session records expire after 14 days and are deleted on logout or password reset.

Email verification, password reset, and invitation tokens are one-time database records with expiry. Raw tokens are never persisted or audited. The email provider remains an infrastructure boundary; local development must use a secure inspection provider rather than pretending that mail was delivered.

The middleware provides early navigation protection for `/app` and `/platform`. Every server route also resolves the session and performs server-side authorization.
