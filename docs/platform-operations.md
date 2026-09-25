# Product Owner platform operations

PO-2 adds operational Product Owner capabilities under `/platform/*` and `/api/platform/*`.

## Organization operations

Organizations are listed with server-side search, status filtering, pagination metadata, lifecycle state, provisioning state, and subscription state where present. Organization details use `authorizePlatformTargetOrganization` before reading tenant-scoped operational data. This is a platform inspection boundary; it never creates or changes an organization membership.

Supported status transitions are constrained by the existing lifecycle model: pending organizations can become active or rejected; active organizations can become suspended or archived; suspended organizations can become active or archived. Every transition is permission checked and audited.

## Provisioning

The provisioning view reads the existing `provisioning_jobs` records. Retry calls the existing idempotent `runProvisioning` service and requires `platform.provisioning.manage`; completed jobs cannot be retried. The UI does not claim background processing or completion beyond the persisted job state.

## Platform users and roles

Platform users are users with a non-`NONE` `platform_role`. They are independent of organization memberships. Role changes require `platform.user.manage`, are audited, and prevent lower-authority users from granting or removing high-authority roles. The last `PRODUCT_OWNER`/`PLATFORM_OWNER` cannot be removed.

## Audit and security

`/platform/audit` reads the shared `audit_logs` infrastructure and writes only safe identifiers and transition metadata. All platform APIs require an authenticated platform role and a server-side permission. Organization permissions do not grant platform access, and platform inspection is never performed by client-side filtering.

Database-backed integration/RLS verification still requires a configured `DATABASE_URL` and PostgreSQL environment.
