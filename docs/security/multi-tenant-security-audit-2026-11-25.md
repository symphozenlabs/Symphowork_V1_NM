# Multi-Tenant Security Audit

**Date:** 2026-11-25  
**Target:** `http://127.0.0.1:5174`  
**Method:** Read-only application audit using the supplied development accounts, Playwright with the installed Chrome browser, live HTTP APIs, source review, and read-only PostgreSQL catalog/data checks.

## Executive result

**Overall status: FAIL.** Tenant-scoped application APIs generally enforced organization context in the cases exercised, and staff restrictions worked for administrative APIs. A Product Owner can also see the intended platform organization list. However, the Product Owner audit API returned tenant audit events containing actor names and email fields. This violates the stated Product Owner confidentiality boundary. Login rate limiting is also bypassable by changing the client-supplied `X-Forwarded-For` header.

No application source, migrations, or live policies were changed. No business records were created, updated, or deleted. Mutation and destructive tests were skipped. Authentication necessarily created session/audit events; all sessions from completed test runs were logged out and then rejected by a protected endpoint.

## 1. Test accounts detected

The credential file contained the following usable account categories. No email addresses or credentials are included here.

| Account | Organization | Role and state |
|---|---|---|
| Organization A owner | Naresh Technologies | `ORGANIZATION_OWNER`, active membership |
| Organization A staff | Naresh Technologies | `EMPLOYEE`, active membership |
| Organization B administrator | SymphoWork QA Tenant B | `ORGANIZATION_OWNER`, active membership |
| Organization B staff | SymphoWork QA Tenant B | `EMPLOYEE`, active membership |
| Product Owner | Platform | `PRODUCT_OWNER`, no tenant membership |

The Product Owner organization list also contained a third organization. No account for that tenant was identified or used, so that tenant is outside the tested A/B scope.

## 2. Seeded data available

Read-only counts confirmed limited test data. Naresh Technologies had 18 employees, 4 departments, 6 attendance records, 2 conversations, and 10 notifications. SymphoWork QA Tenant B had 23 employees, 3 departments, and 1 conversation. Both tenants had zero leave requests, payroll runs, employee documents, expenses, and projects. B had zero attendance records and notifications.

These empty collections prevent meaningful resource-ID and file-download tests for payroll, leave, documents, expenses, projects, and notifications.

## 3. Organization isolation

### Organization A — PASS, with coverage gaps

- The owner account loaded `/app`; the rendered page did not contain the B organization name.
- Employee API returned 18 rows and the directory returned 18 rows.
- The departments table had 4 rows; organization attendance reported the tenant’s own workforce and 6 attendance records existed in the database.
- Supplying Organization B’s ID in the employee and directory query parameters and organization header left the returned record IDs unchanged at 18.
- A direct request for a B employee profile and that employee’s attendance returned `404 NOT_FOUND` with no record.
- Payroll, leave, documents, expenses, projects, chat, and notification row-level response checks were incomplete for A because several calls timed out or the tenant had no seeded records. Treat those subtests as **NOT TESTED**, not as blanket passes.

### Organization B — PASS for exercised reads

- The owner account loaded `/app`; the rendered page did not contain the A organization name.
- Employee API returned 23 rows. The organization attendance endpoint returned B-scoped workforce data. No payroll, leave, document, expense, or project records were seeded.
- Supplying Organization A’s ID to employee, attendance, payroll, documents, leave, expenses, projects, chat, and notification collection requests returned the same IDs as the B baseline wherever rows existed. No A organization ID appeared in the returned collection organization markers.
- A’s tenant owner session could not retrieve a B employee profile or attendance by the B employee ID; both returned `404 NOT_FOUND`.

### UI and API context manipulation

- Both owner dashboards rendered without the other tenant’s organization name.
- Client-supplied organization IDs did not switch tenant context in the collection tests.
- Direct foreign employee IDs were filtered to `404`; error bodies did not include the foreign record.
- No tenant data mutation was attempted.

**Uncovered:** direct foreign payroll, document, expense, project, chat-message, and notification IDs could not be tested because the required records were absent or unavailable. The A-side multi-collection sweep had timeouts; it is not counted as a pass.

## 4. Staff role permissions

The A and B staff accounts were both confirmed as `EMPLOYEE`.

- Employee administration (`/api/app/employees`): **PASS** — `403 FORBIDDEN`.
- Organization attendance management: **PASS** — `403 FORBIDDEN`.
- Payroll runs and payroll profiles: **PASS** — `403 FORBIDDEN`.
- Department/settings API: **PASS** — `403 FORBIDDEN`.
- Platform organization API: **PASS** — `403 FORBIDDEN`.
- Direct employee detail by ID: **PASS** — B staff received `403 FORBIDDEN`.
- B staff could use the visible company directory, which returned 22 entries with basic work-directory fields. The directory is intentionally exposed by the app navigation; the employee detail API remained permission-gated.
- Staff document lists were empty/not found. No confidential document was available for a direct-ID test.

These checks match the static `EMPLOYEE` permission set, which lacks employee administration, payroll administration, attendance management, and department administration.

## 5. Product Owner boundary

### Allowed platform visibility — PASS

The Product Owner logged in as `PRODUCT_OWNER`. `/api/platform/organizations` returned three organization metadata rows, including names and status. `/api/platform/users` returned platform-role users only.

### Tenant-confidential APIs — PASS for collection routes

With a Product Owner session and a supplied tenant organization ID, these APIs all returned `403 ORG_ACCESS_DENIED` without records: employees, directory, attendance, organization attendance, payroll runs, payroll profiles, documents, leave, expenses, projects, chat conversations, and notifications.

### Tenant audit exposure — FAIL, HIGH

`GET /api/platform/audit?pageSize=100` returned 100 audit events. Every returned row included actor name and email fields; the page included a tenant employee resource event. The Product Owner also received 12 organization-detail activity entries containing actor/resource identifiers and a raw metadata field. No personal values were copied into this report.

This is a confirmed cross-tenant disclosure of employee identity and tenant activity to the Product Owner. The implementation grants `PRODUCT_OWNER` every platform permission, including `platform.audit.view`, and `listPlatformAudit` returns raw tenant audit records joined to user names and emails. The organization detail operation also includes raw audit rows.

**Affected code:**

- `src/modules/platform/authorization.ts` — Product Owner receives all platform permissions.
- `src/modules/platform/operations.ts` — `listPlatformAudit` selects audit records and actor name/email; `getPlatformOrganization` returns organization audit activity.
- `src/lib/server/api/platform/audit/route.ts` — exposes the audit result.
- `src/db/client.ts` — `withPlatformTransaction` sets the database-wide `app.is_platform_owner` context for its transaction.
- The live tenant RLS policies allow that platform flag to bypass tenant predicates.

**Recommended fix:** separate platform-only audit events from tenant audit events. Give the Product Owner only redacted platform events or aggregate counts, omit actor email/name and raw metadata/resource IDs, and prevent platform metadata transactions from returning tenant-confidential rows. Do not apply this broad audit access to the Product Owner role.

## 6. PostgreSQL RLS and transaction context

Live catalog checks ran in read-only transactions.

- Runtime role: `sympowork_app`; not superuser, does not have `BYPASSRLS`, and owns none of the public tables.
- 129 of 140 public tables had RLS enabled. No table had `FORCE ROW LEVEL SECURITY`; because the runtime role owns no tables, the tested runtime role remains subject to RLS. Eleven global/auth/configuration tables lack RLS and rely on application-level controls.
- There were 129 policies; 127 referenced `app.current_organization_id`, and all 129 referenced `app.is_platform_owner` in either policy expression. Sensitive tenant-table policies used organization equality plus the platform-owner bypass; they did not use `app.current_user_id` for row-level ownership.
- PostgreSQL checks confirmed transaction-local behavior: before a transaction the GUCs were empty; with no organization context, the app role saw 0 employee rows; with Organization A context it saw 18; after commit the GUCs were empty again.
- Setting `app.is_platform_owner=true` inside a read-only transaction exposed 41 employee rows across tenants. This is the intended broad behavior of the current platform transaction helper, but it means confidentiality depends on every platform caller filtering and redacting data correctly. The audit API above demonstrates that this boundary currently fails.
- `withTenantTransaction` sets the organization GUC but not the user GUC. `tenantApiRead` and `tenantApiWrite` set both. Several services also use direct ORM queries with explicit organization predicates. A full call-site audit of all background jobs was not completed.
- Client-supplied organization IDs did not override the tenant context in the live collection tests. Missing context failed closed for the tenant APIs exercised.

## 7. Sessions and authentication

- Login succeeded for all five test-account categories in completed runs.
- Logout returned `200`; a subsequent protected API request returned `401` for the tested sessions.
- Expired sessions were not forced or directly tested. Source logic sets a 14-day expiry and rejects sessions whose expiry is not in the future.
- Protected pages and APIs set `Cache-Control: no-store` in `src/hooks.server.ts`.
- Same-browser account switching and a full cache-state comparison were **NOT TESTED**. A-side and B-side requests with altered organization identifiers were tested instead.
- Some early browser automation attempts navigated before the harness could clean up their session token. The completed test runs were logged out; the early tokens were not captured and cannot be individually revoked without deleting/updating session records, which this audit prohibited. Their expiry follows the 14-day session lifetime.

## 8. Data leakage and error handling

- Tenant collection override probes returned baseline IDs for the tested resources; direct foreign employee and attendance IDs returned `404`.
- The confirmed exception is the Product Owner platform audit API described above.
- API error codes observed were generic `401`, `403`, or `404` responses with no foreign record details.
- Basic directory identity/work fields are visible to tenant staff through the app’s intended directory route; confidential employee detail remains permission-gated.
- CSV/export endpoints, signed file URLs, client cache contents, search result leakage, and actual file downloads were **NOT TESTED**. No documents or exports were seeded for these tenants.

## 9. Findings and severity

### SEC-01 — HIGH: Product Owner can read tenant audit identities and activity

**Status: FAIL.** `/api/platform/audit` returns cross-tenant audit events joined to actor names/emails; organization detail returns raw tenant activity. This violates the Product Owner’s tenant-confidentiality boundary. See the affected files and recommended fix in section 5.

### SEC-02 — MEDIUM: Login rate limit trusts caller-controlled `X-Forwarded-For`

**Status: FAIL.** After the default login source reached the `429` limit, a login using a different caller-supplied `X-Forwarded-For` value returned `200`. `clientRateLimitKey` directly keys a process-local `Map` from the first `X-Forwarded-For` value, so an unauthenticated caller can rotate the header to bypass the per-source threshold; separate app processes also have separate buckets.

**Affected code:** `src/lib/rate-limit.ts` and `src/lib/server/api/auth/login/route.ts`.

**Recommended fix:** derive the client address only from a trusted proxy that overwrites forwarded headers, reject or ignore untrusted forwarded values, and use a shared rate-limit store when running multiple app instances.

## 10. Not tested / blocked coverage

- No writes, updates, deletes, CSV exports, file downloads, or destructive requests were sent.
- Expired-session behavior was source-reviewed only.
- Direct IDs for payroll, documents, leave, expenses, projects, notifications, and chat messages were unavailable or not captured; those probes remain **NOT TESTED**.
- Account switching in one browser context and detailed client-side cache inspection remain **NOT TESTED**.
- Background jobs were not executed; their transaction context was not exhaustively traced.
- A third platform organization was listed but had no supplied test account and was not tested.
- Several A-side collection requests timed out; these were not counted as passes.

## 11. Audit disposition

The audit is complete for the available safe read-only checks. The application does **not** meet the stated Product Owner confidentiality success criterion until SEC-01 is addressed. SEC-02 should also be fixed before relying on login throttling. No fixes have been applied; this report is ready for review.
