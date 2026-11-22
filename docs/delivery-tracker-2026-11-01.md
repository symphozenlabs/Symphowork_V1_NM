# SymphoWork Svelte V1 — CEO Delivery Tracker

Audit baseline: previous independent CEO audit. This tracker was created before implementation changes on 2026-11-01.

## Protected workspace baseline

- Branch: `svelte-migration`
- HEAD: `2e4eecd3b9ac10379a320fa12a9691e92bd27b2f`
- Configured Git remotes: `original` points to the developer reference checkout; no publishing remote is configured here.
- Pre-existing status entries: 521 total (432 deletions, 21 modifications, 68 untracked paths).
- No reset/clean performed. Existing files and artifacts are preserved. Original NM checkout remains read-only.
- The full initial porcelain path/status snapshot is listed at the end of this document. Sensitive file contents were not inspected or included.

## Requirements

| ID | Requirement | Priority | Affected areas | Status at start | Evidence / test | Remaining blocker |
|---|---|---:|---|---|---|---|
| API-01 | Keep all original API routes/methods and verify contracts | P0 | `src/routes/api`, `src/lib/server/api`, `src/lib/server/api-dispatch.ts` | Partial | Static: 131/131 paths and method sets; 128 exact handler copies | 3 department copies differ; no live contract run for all routes |
| API-02 | Convert validation and unexpected errors to safe, contract-compatible statuses | P0 | `src/lib/errors.ts`, API handlers | Partial | Prior report documents broad Zod error mapping gap | Implement focused mapping/tests; route-wide invalid-input coverage remains |
| API-03 | Review conditional-write GETs and side effects | P0 | Attendance, chat, notifications, employee services | Partial | Inventory identifies conditional-write handlers | 15 findings and 71 unreviewed GETs; call-graph and safe fixture review needed |
| SEC-01 | Session expiry/revocation, cross-tenant isolation, RLS, private files | P0 | auth/context/database/document endpoints | Not verified | Source and mocks only; no current live requests | Requires approved isolated multi-tenant fixtures and private-file fixtures |
| SEC-02 | RBAC and direct/API authorization across all roles | P0 | `src/lib/auth`, `src/hooks.server.ts`, APIs | Partial | Policy code; prior limited live denials | Approved fixture accounts for each role and a route/API matrix |
| ORG-01 | Complete organization workflows across core modules | P0 | org, employee, attendance, leave, expenses, payroll, docs, ATS, chat | Partial | Svelte pages/API modules and synthetic tests | Approved disposable test records for persistence/readback; no real-customer mutation |
| ROLE-01 | Resolve requested `ORGANIZATION_ADMIN` role discrepancy | P0 | original `SYSTEM_ROLES`, target role maps | Blocked decision | Original explicitly excludes this role | Business owner must decide whether it remains out of scope |
| PLATFORM-01 | Verify all five platform roles and permitted/denied operations | P1 | `src/lib/auth/platform.ts`, platform routes/APIs | Partial | Policy source and limited historical account artifacts | QA identities/fixtures for all roles; safe operation tests |
| ARCH-01 | SvelteKit owns frontend and same-origin backend on 5173 | P1 | scripts/config/API dispatcher/docs | Partial | Static native dispatcher and Vite scripts; no runtime 3000 in app code | Current startup smoke and stale docs/scripts reconciliation |
| ENV-01 | Document consumers and fail safely on missing/invalid config | P1 | `src/db/client.ts`, env docs | Partial | Names-only inspection; DB presence-only check | Non-loopback DB identity/access not checked; localhost fallback can mask missing config |
| UI-01 | Compare Product Owner, Organization Owner and HR Admin UI states | P1 | route/component trees | Not verified | Route maps only; no comparative screenshots | Run both approved environments with equivalent fixture data/viewports |
| PERF-01 | Establish comparable navigation/API performance evidence | P2 | perf scripts/artifacts | Not verified | Existing single-run target measurements | Current scripts/conditions differ; need safe repeatable matched baseline |
| QA-01 | Current-tree check, unit/integration/browser tests and build | P0 | project test/build configuration | Not verified | Historical 2026-10-20 report only | Run against current dirty tree; distinguish unit/mocks from integration |
| DOC-01 | Align README, migration, environment, API and verification docs | P1 | `README.md`, `docs/*` | Partial | Docs conflict with in-process backend | Update only after confirming tested implementation and evidence |
| REL-01 | Preserve branch/history and avoid unapproved commit/push | P1 | Git metadata | Partial | No reset/clean; no origin remote configured | No commit/push requested; publishing requires separate repo/approval |

Statuses mean: **Complete** only with direct verification; **Partial** means implementation/source exists but acceptance is incomplete; **Blocked** means required business decision or safe fixture is unavailable; **Not verified** means no adequate evidence.

## Current delivery-run outcomes

| Requirement | Current status | Evidence from this run | Remaining blocker |
|---|---|---|---|
| API-01 route/method and contract parity | Partial | Static inventory remains 131/131 path/method matches; dispatcher registry tests pass. | Route-by-route request, response, permission, tenant and side-effect verification is outstanding. |
| API-02 common validation/error safety | Partial | Focused unit tests pass; Zod/malformed JSON and invalid identifier failures are sanitized and mapped to 400, unavailable DB to 503. | Per-endpoint validation and contract coverage is incomplete. |
| API-03 conditional-write GET review | Partial | No write/GET integration tests were run. | 15 identified conditional-write paths and 71 unreviewed GET paths remain. |
| SEC-01 session, tenant/RLS, private files | Not verified | DB auth context is resolved per request; reviewed failure logs are sanitized; no shared auth cache. | Needs isolated two-tenant fixtures and private-file/session-expiry tests against approved infrastructure. |
| SEC-02 role/API authorization | Partial | Synthetic anonymous direct-route rejection and unit policy tests are present. | No all-role real identity/API authorization matrix this run. |
| ORG-01 organization workflows | Partial | Browser synthetic test harness covers selected workflow UI/error paths. | No authorized disposable records; successful persistence/readback not exercised. |
| ROLE-01 `ORGANIZATION_ADMIN` | Blocked decision | Original source does not define the role. | Business owner decision; no role was invented. |
| PLATFORM-01 platform roles | Partial | Synthetic failure/permission handling is covered in the workflow suite (50/50 passed). | Five-role direct URL/API allowed/denied matrix and persisted operations require approved QA fixtures. |
| ARCH-01 same-origin SvelteKit | Partial | In-process route registry and isolated production server operate without Next.js; `npm run build` passed. | This run did not relaunch the existing dev server or establish backend/database readiness. |
| ENV-01 configuration safety | Partial | Lazy DB client fails closed without configuration; no localhost DB fallback; health reflects readiness. | Authorized DB identity and connectivity remain unverified. |
| UI-01 visual parity | Not verified | No screenshot comparison was performed. | Requires original and migrated apps with equivalent fixture data/viewports. |
| PERF-01 comparative performance | Not verified | No controlled benchmark was performed. | Need repeatable same-condition original/Svelte baseline. |
| QA-01 checks and tests | Partial | Check passed (0/0); unit suite passed (96 files/886 tests, single worker); build passed in isolated temp copy; browser smoke passed 20/20. | Synthetic workflow suite passed 50/50; no live auth/API, RLS, or business mutation tests. |
| DOC-01 current startup and API records | Partial | README, auth/environment, review runbook, migration progress, route inventory and verification record updated. | Broader route-level integration evidence is not available to document. |

The default parallel full unit run timed out in two tests while another browser suite was consuming resources. A serial full run passed. The first concurrent workflow attempt also timed out during initial navigation and was stopped; the serially isolated workflow rerun passed 50/50. No real database, provider, login, or business record was accessed in this run.

## Initial Git status snapshot (before implementation)

```text D .agents/skills/neon-ai-gateway/SKILL.md
 D .agents/skills/neon-auth/SKILL.md
 D .agents/skills/neon-auth/references/managed-auth.md
 D .agents/skills/neon-auth/references/self-managed.md
 D .agents/skills/neon-functions/SKILL.md
 D .agents/skills/neon-functions/references/ai-sdk.md
 D .agents/skills/neon-functions/references/function-triggers.md
 D .agents/skills/neon-functions/references/mastra-studio.md
 D .agents/skills/neon-functions/references/mcp.md
 D .agents/skills/neon-functions/references/production-hardening.md
 D .agents/skills/neon-functions/references/sentry.md
 D .agents/skills/neon-functions/references/sse.md
 D .agents/skills/neon-object-storage/SKILL.md
 D .agents/skills/neon-postgres-branches/SKILL.md
 D .agents/skills/neon-postgres-egress-optimizer/SKILL.md
 D .agents/skills/neon-postgres/SKILL.md
 D .agents/skills/neon-postgres/references/full-text-search.md
 D .agents/skills/neon-postgres/references/hybrid-search.md
 D .agents/skills/neon-postgres/references/lakebase-search-drizzle.md
 D .agents/skills/neon-postgres/references/vector-search.md
 D .agents/skills/neon/SKILL.md
 D .agents/skills/neon/references/auth.md
 D .agents/skills/neon/references/claimable-neon.md
 D .agents/skills/neon/references/function-triggers.md
 D .agents/skills/neon/references/logs-loki.md
 D .agents/skills/neon/references/parse-env.md
 D .agents/skills/neon/references/sdk.md
 M .env.example
 M .gitignore
 M README.md
 D SYMPHOWORK_V1_ATTENDANCE_SALARY_PAYROLL_IMPLEMENTATION_REPORT.md
 D SYMPHOWORK_V1_ATTENDANCE_SALARY_PAYROLL_INVESTIGATION.md
 D SYMPHOWORK_V1_DEEP_ANALYSIS_AND_DELIVERY_PLAN.md
 D SYMPHOWORK_V1_E2E_TEST_SCENARIOS.md
 D SYMPHOWORK_V1_INTERNAL_CHAT_INVESTIGATION_REPORT.md
 D SYMPHOWORK_V1_INTERNAL_CHAT_PHASE_3_IMPLEMENTATION_REPORT.md
 D SYMPHOWORK_V1_INTERNAL_CHAT_PHASE_4_IMPLEMENTATION_REPORT.md
 D SYMPHOWORK_V1_INTERNAL_CHAT_PHASE_5_IMPLEMENTATION_REPORT.md
 D SYMPHOWORK_V1_INTERNAL_CHAT_RELEASE_READINESS_REPORT.md
 D SYMPHOWORK_V1_INTERNAL_CHAT_SECURITY_AND_GIT_READINESS_REPORT.md
 D SYMPHOWORK_V1_PROJECT_UNDERSTANDING_REPORT.md
 D SYMPHOWORK_V1_SOURCE_CODE_MAP.md
 D docs/approval-engine.md
 D docs/architecture.md
 D docs/ats.md
 D docs/attendance.md
 D docs/authentication.md
 D docs/billing.md
 D docs/chat-to-task.md
 D docs/compliance-foundation.md
 D docs/database.md
 D docs/decisions/0001-foundation.md
 D docs/deployment.md
 D docs/development.md
 D docs/documents.md
 D docs/employees.md
 D docs/environment.md
 D docs/expenses.md
 D docs/hr-master-data.md
 D docs/internal-chat.md
 D docs/leave.md
 D docs/multi-tenancy.md
 D docs/notifications.md
 D docs/onboarding.md
 D docs/organization.md
 D docs/payroll.md
 D docs/platform-commercial.md
 D docs/platform-operations-intelligence.md
 D docs/platform-operations.md
 D docs/platform-organization-separation.md
 D docs/production-readiness.md
 D docs/projects-tasks.md
 D docs/providers.md
 D docs/provisioning.md
 D docs/rbac.md
 D docs/recruiter-intelligence.md
 D docs/reporting.md
 D docs/resume-intelligence.md
 D docs/security.md
 D docs/testing.md
 D docs/workflows.md
 D drizzle.config.ts
 D drizzle/0000_free_mother_askani.sql
 D drizzle/0001_fluffy_micromax.sql
 D drizzle/0002_brave_pet_avengers.sql
 D drizzle/0003_dashing_butterfly.sql
 D drizzle/0004_hard_jean_grey.sql
 D drizzle/0005_gigantic_vin_gonzales.sql
 D drizzle/0006_slippery_snowbird.sql
 D drizzle/0007_awesome_famine.sql
 D drizzle/0008_flimsy_triton.sql
 D drizzle/0009_worthless_killmonger.sql
 D drizzle/0010_groovy_dragon_lord.sql
 D drizzle/0011_awesome_satana.sql
 D drizzle/0012_swift_blur.sql
 D drizzle/0013_sweet_tarot.sql
 D drizzle/0014_unique_dakota_north.sql
 D drizzle/0015_tidy_raptor.sql
 D drizzle/0016_opposite_iron_lad.sql
 D drizzle/0017_force_platform_owner_password_change.sql
 D drizzle/0018_invitation_token_context.sql
 D drizzle/0019_membership_user_context.sql
 D drizzle/meta/0000_snapshot.json
 D drizzle/meta/0001_snapshot.json
 D drizzle/meta/0002_snapshot.json
 D drizzle/meta/0003_snapshot.json
 D drizzle/meta/0004_snapshot.json
 D drizzle/meta/0005_snapshot.json
 D drizzle/meta/0006_snapshot.json
 D drizzle/meta/0007_snapshot.json
 D drizzle/meta/0008_snapshot.json
 D drizzle/meta/0009_snapshot.json
 D drizzle/meta/0010_snapshot.json
 D drizzle/meta/0011_snapshot.json
 D drizzle/meta/0012_snapshot.json
 D drizzle/meta/0013_snapshot.json
 D drizzle/meta/0014_snapshot.json
 D drizzle/meta/0016_snapshot.json
 D drizzle/meta/_journal.json
 D eslint.config.mjs
 D middleware.ts
 D neon.ts
 D next-env.d.ts
 D next.config.ts
 M package.json
 M playwright.config.ts
 M pnpm-lock.yaml
 M pnpm-workspace.yaml
 D postcss.config.mjs
 D prettier.config.mjs
 D public/enterprise-journey-landscape.jpg
 D public/favicon.svg
 D public/journey-world-landscape.jpg
 D public/symphowork-logo-white.png
 D public/symphowork-logo.png
 D public/symphowork-symbol.png
 D scratch/acceptance_runner.js
 D scratch/benchmark_5x.js
 D scratch/benchmark_5x_results.json
 D scratch/capture-employee.mjs
 D scratch/capture_invitation_polish.mjs
 D scratch/capture_verification.ps1
 D scratch/capture_wizard.mjs
 D scratch/check-arjun.ts
 D scratch/check-current-org.ts
 D scratch/check-db-user.ts
 D scratch/check-roles-perms.ts
 D scratch/check_dims.ps1
 D scratch/check_pwd_prefix.mjs
 D scratch/check_pwd_stats.mjs
 D scratch/check_trailing.mjs
 D scratch/create_accounts.test.ts
 D scratch/create_test_accounts.ts
 D scratch/inspect-amit-attendance.mjs
 D scratch/inspect-current-attendance.mjs
 D scratch/inspect-rls.js
 D scratch/inspect-rls.ts
 D scratch/inspect-shifts-detail.ts
 D scratch/inspect-test-users.mjs
 D scratch/inspect_db_safe.ts
 D scratch/inspect_master_data_safe.ts
 D scratch/inspect_users_safe.ts
 D scratch/investigate_live_server.ts
 D scratch/list-db.ts
 D scratch/list-depts.ts
 D scratch/measure_live_app.js
 D scratch/playwright_animation_verify.mjs
 D scratch/playwright_capture.mjs
 D scratch/setup_attendance_shifts_and_accounts.ts
 D scratch/test-baseline-perf.ts
 D scratch/test-browser-buttons.mjs
 D scratch/test-browser-punch.mjs
 D scratch/test-dev-routes.mjs
 D scratch/test-endpoints.js
 D scratch/test-modal.mjs
 D scratch/test-optimized-perf.ts
 D scratch/test-org-attendance-api.mjs
 D scratch/test-punch-auth.ts
 D scratch/test-real-punch.mjs
 D scratch/test_dropdown_apis.mjs
 D scratch/test_employeeId_error.ts
 D scratch/test_role_attendance.ts
 D scratch/verify_all_shift_test_accounts.ts
 D scratch/verify_creds_safe.mjs
 D scripts/benchmark-phase1.ts
 D scripts/bootstrap-platform-owner.ts
 D scripts/crop-landscape.ps1
 D scripts/sync-tenant-permissions.ts
 D skills-lock.json
 M src/app/api/app/attendance/organization/route.test.ts
 M src/app/api/app/departments/[departmentId]/teams/route.ts
 M src/app/api/app/departments/route.ts
 M src/app/api/app/master-data/departments/route.ts
 D src/app/app/approvals/approvals-page.test.ts
 D src/app/app/approvals/loading.tsx
 D src/app/app/approvals/page.tsx
 D src/app/app/attendance/loading.tsx
 D src/app/app/attendance/page.tsx
 D src/app/app/chat/page.tsx
 D src/app/app/departments/[departmentId]/department-details-page.test.ts
 D src/app/app/departments/[departmentId]/loading.tsx
 D src/app/app/departments/[departmentId]/page.tsx
 D src/app/app/departments/departments-page.test.ts
 D src/app/app/departments/loading.tsx
 D src/app/app/departments/page.tsx
 D src/app/app/directory/page.tsx
 D src/app/app/documents/page.tsx
 D src/app/app/employees/[employeeId]/employee-details-page.test.ts
 D src/app/app/employees/[employeeId]/page.tsx
 D src/app/app/employees/employees-page.test.ts
 D src/app/app/employees/loading.tsx
 D src/app/app/employees/new/page.tsx
 D src/app/app/employees/page.tsx
 D src/app/app/error.tsx
 D src/app/app/expenses/[claimId]/page.tsx
 D src/app/app/expenses/page.tsx
 D src/app/app/layout.tsx
 D src/app/app/leave/loading.tsx
 D src/app/app/leave/page.tsx
 D src/app/app/loading.tsx
 D src/app/app/notifications/loading.tsx
 D src/app/app/notifications/page.tsx
 D src/app/app/page.tsx
 D src/app/app/payroll/loading.tsx
 D src/app/app/payroll/page.tsx
 D src/app/app/payroll/payslips/page.tsx
 D src/app/app/profile/page.tsx
 D src/app/app/recruitment/candidates/[candidateId]/page.tsx
 D src/app/app/recruitment/intelligence/page.tsx
 D src/app/app/recruitment/loading.tsx
 D src/app/app/recruitment/page.tsx
 D src/app/app/recruitment/recruitment-page.test.ts
 D src/app/app/reports/page.tsx
 D src/app/app/settings/billing/page.tsx
 D src/app/app/settings/page.tsx
 D src/app/app/settings/workflows/page.tsx
 D src/app/app/work/page.tsx
 D src/app/change-password/page.tsx
 D src/app/error.tsx
 D src/app/forgot-password/page.tsx
 D src/app/globals.css
 D src/app/invitations/accept/page.tsx
 D src/app/jobs/[slug]/apply/page.tsx
 D src/app/jobs/[slug]/page.tsx
 D src/app/jobs/jobs.test.ts
 D src/app/layout.tsx
 D src/app/login/page.tsx
 D src/app/not-found.tsx
 D src/app/page.tsx
 D src/app/platform/analytics/page.tsx
 D src/app/platform/audit/loading.tsx
 D src/app/platform/audit/page.tsx
 D src/app/platform/configuration/page.tsx
 D src/app/platform/error.tsx
 D src/app/platform/features/page.tsx
 D src/app/platform/health/page.tsx
 D src/app/platform/layout.tsx
 D src/app/platform/loading.tsx
 D src/app/platform/login/page.tsx
 D src/app/platform/organizations/[organizationId]/page.tsx
 D src/app/platform/organizations/loading.tsx
 D src/app/platform/organizations/new/page.tsx
 D src/app/platform/organizations/page.tsx
 D src/app/platform/page.tsx
 D src/app/platform/plans/loading.tsx
 D src/app/platform/plans/page.tsx
 D src/app/platform/provisioning/loading.tsx
 D src/app/platform/provisioning/page.tsx
 D src/app/platform/subscriptions/loading.tsx
 D src/app/platform/subscriptions/page.tsx
 D src/app/platform/support/page.tsx
 D src/app/platform/usage/page.tsx
 D src/app/platform/users/page.tsx
 D src/app/register/page.tsx
 D src/app/reset-password/page.tsx
 D src/app/verify-email/page.tsx
 D src/components/approvals/approval-inbox.tsx
 D src/components/ats/ats-dashboard.tsx
 D src/components/ats/ats-interview-panel.tsx
 D src/components/ats/recruiter-intelligence-search.tsx
 D src/components/ats/resume-intelligence-panel.tsx
 D src/components/attendance/attendance-actions.test.ts
 D src/components/attendance/attendance-actions.tsx
 D src/components/attendance/attendance-reminder-modal.test.ts
 D src/components/attendance/attendance-reminder-modal.tsx
 D src/components/attendance/attendance-view-container.tsx
 D src/components/attendance/organization-attendance-dashboard.tsx
 D src/components/attendance/regularization-panel.tsx
 D src/components/auth/auth-card.test.ts
 D src/components/auth/auth-card.tsx
 D src/components/auth/auth-command-canvas.tsx
 D src/components/auth/auth-flip-view.test.ts
 D src/components/auth/auth-flip-view.tsx
 D src/components/auth/change-password-form.tsx
 D src/components/auth/forgot-password-form.tsx
 D src/components/auth/invitation-accept-form.test.ts
 D src/components/auth/invitation-accept-form.tsx
 D src/components/auth/login-form.tsx
 D src/components/auth/logout-confirm-dialog.test.ts
 D src/components/auth/logout-confirm-dialog.tsx
 D src/components/auth/register-form.tsx
 D src/components/auth/reset-password-form.tsx
 D src/components/auth/verify-email-form.tsx
 D src/components/billing/billing-overview.tsx
 D src/components/chat/audio-player.tsx
 D src/components/chat/chat-header.tsx
 D src/components/chat/chat-input-bar.tsx
 D src/components/chat/chat-profile-modal.tsx
 D src/components/chat/chat-search-dialog.tsx
 D src/components/chat/chat-thread.tsx
 D src/components/chat/chat-ui.test.ts
 D src/components/chat/chat-workspace.tsx
 D src/components/chat/conversation-list-item.tsx
 D src/components/chat/conversation-sidebar.tsx
 D src/components/chat/emoji-picker.tsx
 D src/components/chat/image-lightbox-modal.tsx
 D src/components/chat/message-bubble.tsx
 D src/components/chat/message-list.tsx
 D src/components/chat/message-to-task-dialog.tsx
 D src/components/chat/new-direct-chat-dialog.tsx
 D src/components/chat/new-group-chat-dialog.tsx
 D src/components/chat/types.ts
 D src/components/chat/utils.ts
 D src/components/chat/voice-recorder.tsx
 D src/components/collaboration/workspace.tsx
 D src/components/dashboard/overview.test.ts
 D src/components/dashboard/overview.tsx
 D src/components/departments/department-create-dialog.tsx
 D src/components/departments/department-delete-dialog.tsx
 D src/components/departments/department-details-view.tsx
 D src/components/departments/department-list-table.tsx
 D src/components/departments/department-team-delete-dialog.tsx
 D src/components/departments/department-team-dialog.test.ts
 D src/components/departments/department-team-dialog.tsx
 D src/components/documents/document-center.tsx
 D src/components/employees/company-directory-view.tsx
 D src/components/employees/edit-employee-dialog.test.ts
 D src/components/employees/edit-employee-dialog.tsx
 D src/components/employees/employee-create-form.tsx
 D src/components/employees/employee-invitation-actions.tsx
 D src/components/employees/onboarding-checklist.tsx
 D src/components/employees/onboarding-wizard/index.ts
 D src/components/employees/onboarding-wizard/onboarding-wizard-step-indicator.tsx
 D src/components/employees/onboarding-wizard/onboarding-wizard.test.ts
 D src/components/employees/onboarding-wizard/onboarding-wizard.tsx
 D src/components/employees/onboarding-wizard/role-illustrations.tsx
 D src/components/employees/onboarding-wizard/step-1-role-selection.tsx
 D src/components/employees/onboarding-wizard/step-2-role-details.tsx
 D src/components/employees/onboarding-wizard/step-3-review-confirm.tsx
 D src/components/employees/onboarding-wizard/step-4-profile-created.tsx
 D src/components/employees/onboarding-wizard/step-5-invitation-status.tsx
 D src/components/employees/onboarding-wizard/types.ts
 D src/components/employees/self-profile-form.tsx
 D src/components/employees/workforce-directory-table.test.ts
 D src/components/employees/workforce-directory-table.tsx
 D src/components/expenses/expense-dashboard.tsx
 D src/components/expenses/expense-detail.tsx
 D src/components/hud/ecosystem-constellation-hud.tsx
 D src/components/hud/enterprise-growth-hud.tsx
 D src/components/hud/hud.test.ts
 D src/components/hud/login-identity-hud.tsx
 D src/components/hud/recovery-pipeline-hud.tsx
 D src/components/hud/register-onboarding-hud.tsx
 D src/components/hud/workforce-network-hud.tsx
 D src/components/journey/enterprise-journey-map.test.ts
 D src/components/journey/enterprise-journey-map.tsx
 D src/components/layout/app-shell.test.ts
 D src/components/layout/app-shell.tsx
 D src/components/layout/breadcrumb.tsx
 D src/components/layout/chat-unread-badge.test.ts
 D src/components/layout/chat-unread-badge.tsx
 D src/components/layout/header-notifications.test.ts
 D src/components/layout/header-notifications.tsx
 D src/components/layout/logout-button.test.ts
 D src/components/layout/logout-button.tsx
 D src/components/layout/mobile-nav.test.ts
 D src/components/layout/mobile-nav.tsx
 D src/components/layout/nav-utils.test.ts
 D src/components/layout/nav-utils.ts
 D src/components/layout/navigation-progress.tsx
 D src/components/layout/sidebar-nav.tsx
 D src/components/leave/leave-application-form.tsx
 D src/components/notifications/notification-center.tsx
 D src/components/payroll/payroll-dashboard.tsx
 D src/components/payroll/payslip-list.tsx
 D src/components/platform/configuration-editor.tsx
 D src/components/platform/feature-editor.tsx
 D src/components/platform/feature-flag-toggle.tsx
 D src/components/platform/organization-create-dialog.test.ts
 D src/components/platform/organization-create-dialog.tsx
 D src/components/platform/organization-create-form.tsx
 D src/components/platform/organization-invitation-actions.tsx
 D src/components/platform/organization-list-table.tsx
 D src/components/platform/organization-status-actions.tsx
 D src/components/platform/organization-support-notes.tsx
 D src/components/platform/organization-wizard/organization-create-wizard.tsx
 D src/components/platform/organization-wizard/types.ts
 D src/components/platform/organization-wizard/wizard-step-contact-address.tsx
 D src/components/platform/organization-wizard/wizard-step-indicator.tsx
 D src/components/platform/organization-wizard/wizard-step-organization.tsx
 D src/components/platform/organization-wizard/wizard-step-owner.tsx
 D src/components/platform/organization-wizard/wizard-step-plan.tsx
 D src/components/platform/organization-wizard/wizard-step-regional.tsx
 D src/components/platform/organization-wizard/wizard-step-review.tsx
 D src/components/platform/plan-editor.tsx
 D src/components/platform/plan-management.tsx
 D src/components/platform/platform-audit-list.tsx
 D src/components/platform/platform-login-form.tsx
 D src/components/platform/platform-shell.test.ts
 D src/components/platform/platform-shell.tsx
 D src/components/platform/platform-user-list.tsx
 D src/components/platform/provisioning-job-actions.tsx
 D src/components/platform/provisioning-manager.tsx
 D src/components/platform/provisioning-progress-modal.tsx
 D src/components/platform/subscription-management.tsx
 D src/components/platform/support-organization-list.tsx
 D src/components/platform/usage-management.tsx
 D src/components/reports/report-dashboard.tsx
 D src/components/settings/master-data-edit-dialog.tsx
 D src/components/settings/master-data-manager.tsx
 D src/components/settings/shift-form-dialog.tsx
 D src/components/ui/badge.tsx
 D src/components/ui/brand-logo.tsx
 D src/components/ui/branded-loader.test.ts
 D src/components/ui/branded-loader.tsx
 D src/components/ui/button.tsx
 D src/components/ui/card.tsx
 D src/components/ui/confirm-dialog.tsx
 D src/components/ui/custom-select.test.ts
 D src/components/ui/custom-select.tsx
 D src/components/ui/dialogs.test.ts
 D src/components/ui/input.tsx
 D src/components/ui/prompt-dialog.tsx
 D src/components/ui/reveal.test.ts
 D src/components/ui/reveal.tsx
 D src/components/ui/skeleton.tsx
 D src/components/ui/toast.test.ts
 D src/components/ui/toast.tsx
 D src/components/workflows/workflow-settings.tsx
 D src/config/env.ts
 M src/db/client.ts
 M src/db/migrate.ts
 M src/lib/rate-limit.ts
 M src/lib/utils.ts
 D src/middleware.ts
 M src/modules/employees/hr-onboarding-shifts-attendance.test.ts
 M src/modules/identity/auth.ts
 M src/modules/recruiter-intelligence/service.ts
 M src/modules/tenancy/context.ts
 D tests/e2e/auth-onboarding.spec.ts
 D tests/e2e/home.spec.ts
 M tsconfig.json
 M vitest.config.ts
?? .storage/
?? .vscode/
?? artifacts/
?? docs/api-call-sites.csv
?? docs/api-routes.csv
?? docs/application-audit.json
?? docs/assets.csv
?? docs/audit-current.py
?? docs/auth-environment.md
?? docs/backend-integration-batch.json
?? docs/baseline-report.md
?? docs/baseline-validation-plan.md
?? docs/capture-plan.csv
?? docs/components.csv
?? docs/design-tokens.csv
?? docs/evidence-and-commands.md
?? docs/generate-inventory.py
?? docs/get-risk-register.csv
?? docs/inventory-metadata.json
?? docs/loading-port-evidence.json
?? docs/migration-checklist.json
?? docs/migration-progress.md
?? docs/module-matrix.md
?? docs/performance-report.md
?? docs/port-client-state.mjs
?? docs/port-loading-template.mjs
?? docs/port-page-template.mjs
?? docs/review-runbook.md
?? docs/roles.csv
?? docs/routes.csv
?? docs/source-port-evidence.json
?? docs/source-port-state-evidence.jsonl
?? docs/update-current-verification.py
?? docs/update-migration-progress.py
?? docs/verification-latest.json
?? playwright.workflows.config.ts
?? screenshots/
?? scripts/capture-dashboards.mjs
?? scripts/check-integration.mjs
?? scripts/dev.mjs
?? scripts/measure-baseline-perf.mjs
?? scripts/measure-optimized-perf.mjs
?? scripts/measure-performance-after.mjs
?? scripts/measure-performance-baseline.mjs
?? scripts/profile-db.mjs
?? scripts/start-authorized-backend.mjs
?? scripts/start-local-review.mjs
?? scripts/verify-authorized-review-ui.mjs
?? scripts/verify-authorized-review.mjs
?? scripts/verify-real-workflows.mjs
?? src/app.css
?? src/app.d.ts
?? src/app.html
?? src/hooks.server.ts
?? src/lib/NavigationStatus.svelte
?? src/lib/auth/
?? src/lib/client/
?? src/lib/components/
?? src/lib/domain/
?? src/lib/navigation.test.ts
?? src/lib/navigation.ts
?? src/lib/server/
?? src/routes/
?? static/
?? svelte.config.js
?? tests/browser/
?? tests/workflows/
?? vite.config.ts```
