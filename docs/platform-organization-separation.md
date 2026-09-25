# Platform and organization product separation

SymphoWork now has two explicit product surfaces sharing one backend and PostgreSQL database:

- Product Owner Portal: `/platform/*`, `/api/platform/*`, `PlatformShell`, platform identity/roles/permissions, organizations, provisioning, plans, subscriptions, billing, usage, support, health, and platform audit.
- Organization App: `/app/*`, existing organization APIs, `AppShell`, organization membership, employee roles, HRMS, ATS, projects, tasks, chat, and reports.

Platform login is available at `/platform/login`; organization login remains `/login`. A platform user is not required to have organization membership. The platform authorization boundary uses separate `platform.*` permissions and role capabilities. Organization roles do not imply platform access.

Platform actions against tenant data remain explicit and auditable. Impersonation is intentionally not implemented. Plans and entitlements remain platform-owned concepts while the organization application only consumes entitlement decisions.

## Status

- Implemented: separate shells, route namespaces, platform login boundary, platform permission namespace, platform role model extension, API authorization helper, and navigation foundation.
- Unit tested: platform-role separation and capability boundaries.
- Integration/RLS tested: pending; no `DATABASE_URL` is configured.
- E2E tested: not run.
- Deferred: complete Product Owner modules, support tickets, platform analytics, billing administration, feature management UI, system-health UI, and secure impersonation.
