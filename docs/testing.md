# Release test matrix

The Next.js React UI tests and root Playwright suite were removed with the legacy presentation layer. Backend route and domain unit tests remain at the repository root. The canonical Svelte frontend owns component, workflow, and browser tests under `svelte/`; run them with `pnpm --dir svelte test -- --run` and `pnpm --dir svelte run test:e2e` after installing the Svelte lockfile. These automated suites do not replace authorized live integration checks.

Root backend checks are `pnpm typecheck`, `pnpm test`, and `pnpm build`. The root build verifies the API service, not the frontend. Svelte checks are `pnpm --dir svelte run check`, `pnpm --dir svelte test -- --run`, and `pnpm --dir svelte run build`.

| Area | Unit | Integration/RLS | E2E | Status |
| --- | --- | --- | --- | --- |
| Auth/RBAC | Existing tests plus endpoint hardening | Pending database fixtures | Run result reported per release | YELLOW |
| HR/attendance/leave/expenses | Existing tests | Pending | Pending | YELLOW |
| Payroll | Calculator tests | Pending immutable snapshot tests | Pending | YELLOW |
| ATS/resume/matching | Existing tests | Pending provider/database tests | Pending | YELLOW |
| Projects/tasks/chat | Collaboration policy tests | Pending | Pending | YELLOW |
| Billing/entitlements | Billing policy tests | Pending subscription fixtures | Pending | YELLOW |
| Reporting/exports | Build/type coverage | Pending authorization/export fixtures | Pending | YELLOW |
| RLS/cross-tenant | Not meaningful without DB | Blocked when \`DATABASE_URL\` is unavailable | Pending | RED |

The release report must distinguish verified tests from blocked infrastructure checks. No RLS, backup/restore, malware-scanning, distributed-rate-limit, dependency-security, or deployment result is claimed without evidence.
