# Product Owner platform operations and intelligence

PO-4 adds operational platform visibility under `/platform/*` and `/api/platform/*`.

## Analytics

`/platform/analytics` uses server-side counts and grouped queries for organizations, provisioning state, subscriptions, plan distribution, active employees, audit activity, and organizations near or over employee limits. The selectable 1/7/30/90-day window is applied to records with timestamps. Historical active-employee snapshots and historical subscription state are not claimed because the current schema does not preserve them.

## Feature flags versus entitlements

Platform feature flags are stored in `platform_feature_flags` and evaluated through `isFeatureEnabled`. They control platform/application availability only. They do not grant an organization plan access, bypass organization permissions, or replace `getEntitlement`/`checkOrganizationEntitlement`. Effective capability requires the platform flag, organization entitlement, and organization permission to align.

## Support boundary

`/platform/support` provides an operational organization search. Target organization views use `authorizePlatformTargetOrganization`; support access does not create organization memberships or expose unrestricted tenant records. Platform-only support notes are stored separately, permission-controlled, and audited.

## Health and configuration

`/platform/health` reports only checks the application can actually perform. States distinguish healthy, unavailable, and not configured; provider configuration is not treated as a successful transaction probe. `/platform/configuration` exposes a small allowlisted set of typed safe settings backed by `system_config`. Infrastructure secrets remain environment-managed and are never returned or audited.

PostgreSQL/RLS integration verification remains pending until `DATABASE_URL` is configured.
