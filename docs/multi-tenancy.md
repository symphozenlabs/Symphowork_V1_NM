# Multi-tenancy and RLS

V1 enforces one active organization membership per user with a unique `memberships.user_id` constraint and application checks. The schema keeps `organization_id` on organization-owned identity records so multi-organization support can be introduced later.

The migration enables PostgreSQL RLS on memberships, invitations, subscriptions, and audit logs. Policies require the transaction-local `app.current_organization_id`, or the explicit platform-owner flag for platform operations. Future database helpers must set these values only after resolving the authenticated session and membership on the server; clients never choose a trusted tenant context.

The current application-layer authorization service is the primary boundary until all tenant queries are routed through a context-aware transaction helper. New business tables must add `organization_id`, indexes, RLS, and tenant isolation tests together.
