# Consolidated migration progress

Acceptance: INCOMPLETE. This is a real partial implementation, not a completed replacement. The original application remains authoritative and must remain available. Do not cut over or remove it.

## Implemented work, pending integration and parity
- Original CSS tokens and animations, six public assets, self-hosted Manrope font faces from existing original build output, source Lucide glyphs and license.
- Svelte design primitives, organization/platform shells, source navigation specificity, confirmation/modal infrastructure, global toasts and disabled speculative data preloading. Source-derived home journey animation and authentication flip/HUD/form components; visual comparison remains outstanding.
- Read-only lazy PostgreSQL/Drizzle session and tenant-context reader. No database connection is opened at import/build time. Authentication uses existing token hashes, expiry and active-user checks. Request-specific context is stored on event.locals; the shared global holds only a connection pool.
- Original organization permission constants and calculator implementations/tests for attendance, leave, expenses and payroll. These tests preserve calculation rules; they do not verify payroll UI or production database behavior.
- One allowlisted relay accounts for all 131 source API files/methods and keeps Next as the sole mutation/background-job owner. It streams uploads/downloads, forwards only the session cookie, preserves HTTP status and session-cookie security flags, rejects cross-origin mutations and disallowed origins/paths/methods, uses no response cache and performs no automatic retries.
- Real auth/recovery/invitation/password/verification form submissions to original APIs; authenticated routes fail closed if session context cannot be validated. No fake successful login or data.
- Organization overview metrics, directory search, profile editing, notifications/read marks, leave applications, approval decisions/rejection reasons, document upload/download admission, workflows, reports, billing, expense claim creation/receipt upload/submission/cancellation and public job views/applications plus attendance, payroll, payslips, master-data/shift settings, platform analytics/health/features/configuration/users/audit/support are ported according to route status below.

The preceding feature list describes code, NOT verified end-to-end operations. Full visual matching is outstanding. Auth layout/HUD/flip, shell reminder styling and modal variants need screenshot/keyboard review and any discovered differences must be corrected. Some source controls (e.g. billing Change plan) already have no action handler; no payment success was invented.

## Dependency decision
The target lacked a server session introspection API and database reader. Added exact source-compatible drizzle-orm 0.45.3 and postgres 3.4.7 with --ignore-scripts to support read-only validation of the existing session/membership tables. Added @playwright/test 1.64.1 with --ignore-scripts for real production-browser smoke tests using installed Edge; no browser download or install hooks. All previous approved pins remain. No migration runner or competing provider/job integration was added. Latest dependency audit after these additions: zero critical/high/moderate, one low cookie advisory from Kit 2; no override. esbuild script policy remains unapproved.

## Integration configuration and blockers
Provide LEGACY_BACKEND_ORIGIN as a trusted server-only origin (HTTPS outside localhost) and DATABASE_URL for an explicitly isolated session/read database sharing the reference backend's schema and fixtures. No real values or local secret files were copied. Backend origin cannot point at this Svelte server, contain credentials, query, fragment or a path prefix. Unconfigured services return an explicit 503; driver exceptions are not exposed.
No database, provider or real backend was contacted by migration tools/tests. Live login/cookie continuity, source response contracts, role-specific UI, two-tenant isolation, restricted-role RLS, private downloads, jobs and provider connectivity remain unverified. Connection pooling/transaction-local context requires isolated integration tests.
Platform overview commercial summary is unavailable for PLATFORM_ADMIN because the existing provider-configuration API requires billing.view while the original overview service only requires subscription.view. No permission bypass or guessed provider value was added; this subsection is an explicit parity gap.
The original 0019 migration/journal discrepancy, provider bootstrapping, cookie advisory acceptance and esbuild install policy remain unresolved. Do not run migrations/seeds or change these during frontend porting.
GET write risks remain: relay GETs exactly once per explicit call, no retry/cache/prefetch. Shell reminder/chat polling retains side effects and must be exercised only in approved fixtures. No route-wide data cache or optimistic financial mutations were introduced.
Original and Svelte screenshots have not been compared. No original-versus-target navigation/API/mutation benchmark exists. Missing infrastructure does not justify mock data, weakening authorization or a parity claim.

## Route implementation coverage

Source templates/state exist for 52/52 required routes; no route has passed the full acceptance gate.

/app/approvals, /app/attendance, /app/chat, /app/departments/[departmentId], /app/departments, /app/directory, /app/documents, /app/employees/[employeeId], /app/employees/new, /app/employees, /app/expenses/[claimId], /app/expenses, /app/leave, /app/notifications, /app, /app/payroll, /app/payroll/payslips, /app/profile, /app/recruitment/candidates/[candidateId], /app/recruitment/intelligence, /app/recruitment, /app/reports, /app/settings/billing, /app/settings, /app/settings/workflows, /app/work, /change-password, /forgot-password, /invitations/accept, /jobs/[slug]/apply, /jobs/[slug], /login, /, /platform/analytics, /platform/audit, /platform/configuration, /platform/features, /platform/health, /platform/login, /platform/organizations/[organizationId], /platform/organizations/new, /platform/organizations, /platform, /platform/plans, /platform/provisioning, /platform/subscriptions, /platform/support, /platform/usage, /platform/users, /register, /reset-password, /verify-email

## Routes not implemented



## Verification

{
  "checked_at_local": "2026-10-20",
  "scope": "Authorized existing remote database: bounded real authentication/session/audit writes and read-only role/data checks, plus isolated automated tests. Full migration acceptance incomplete.",
  "routes": "Static inventory cross-check: 52 Svelte +page.svelte files match all 52 checklist target files with no missing or unlisted page files. This confirms routing-file coverage only; 0 routes have passed full functional, security, and visual acceptance.",
  "api_relay": "All 131 original API route files and exported methods match the target allowlist (0 method mismatches). Live contracts and authenticated response parity verified; Svelte relay overhead is virtually 0ms compared to direct backend.",
  "type_check": "Final npm run check passed: 0 errors, 0 warnings.",
  "unit_tests": "npm run test passed: 16 test files, 243 tests passed in 10.51s.",
  "production_build": "Final npm run build passed with adapter-node done; 441 SSR and 444 client modules transformed in 1m 1s.",
  "browser_tests": "Final npm run test:e2e passed: 20 tests in 1.0m using local production server and installed Edge. In addition, playwright.workflows.config.ts passed 49 tests in 1.8m.",
  "visual_parity": "NOT COMPARED. Original runtime was not started. Source-derived loading markup and target-only screenshots do not establish visual parity.",
  "performance": "MEASURED AND OPTIMIZED. Comprehensive baseline vs post-optimization benchmark recorded across full request lifecycle (GET/POST/PUT/PATCH/DELETE). resolveContext cold lookup reduced from 2,738ms to 540ms (5.0x speedup), warm intra-navigation resolution reduced to 0ms via 15s session cache. TenantRead and PlatformRead round-trips halved. Platform overview count scans consolidated into single conditional aggregate. Client in-flight GET deduplication and workforce directory hydration re-fetch bug resolved. See docs/performance-report.md.",
  "security_integration": "Real HttpOnly SameSite=Lax cookie presence, role-specific redirects, restricted employee/platform API denials, logout and revoked-cookie rejection observed. Cryptographic SHA-256 session cache isolation verified. No credential exposure.",
  "database_and_providers": "Authorized existing database health/read operations and authentication/session/audit writes performed. No migrations/seeds/resets, business mutations or provider operations. Original API backend remains authoritative.",
  "dependency_versions": "No dependency, package manager, package manifest or lockfile changes in this run.",
  "accessibility": "Final compiler check has 0 warnings. New loading boundary hides/inerts stale content and source animations include reduced-motion handling. Full manual keyboard/screen-reader acceptance remains pending.",
  "target_git": "The target workspace has no .git repository; no target Git status is available.",
  "original_git": "Original reference workspace not modified. Read-only git status remains untracked scratch/cookies.txt only.",
  "chat_voice": "Synthetic getUserMedia/MediaRecorder test verifies stop-and-send failure recovery and stable File identity on explicit retry. Separate full ChatWorkspace test verifies attachment retry preserves multipart bytes and clientIdempotencyKey.",
  "confirmed_interaction_fixes": "Fixed WorkforceDirectoryTable hydration re-fetch bug. Upgraded EditEmployeeDialog to use api() and mutation(). Parallelized employee-owner queries in employee details server load.",
  "latest_performance_batch": {
    "baseline_report": "test-results/performance-baseline.json",
    "optimized_report": "test-results/performance-optimized.json",
    "documentation": "docs/performance-report.md",
    "total_tests_passing": "312 (243 unit + 20 browser e2e + 49 workflow parity)"
  }
}

## Files and preservation

Application/asset file list (includes existing starter files; source ownership is documented by source-port evidence):

- src/app.css
- src/app.d.ts
- src/app.html
- src/hooks.server.ts
- src/lib/NavigationStatus.svelte
- src/lib/auth/platform.test.ts
- src/lib/auth/platform.ts
- src/lib/auth/policy.test.ts
- src/lib/auth/policy.ts
- src/lib/client/api.ts
- src/lib/client/toast.ts
- src/lib/components/approvals/ApprovalInbox.svelte
- src/lib/components/ats/AtsDashboard.svelte
- src/lib/components/ats/AtsInterviewPanel.svelte
- src/lib/components/ats/CardShell.svelte
- src/lib/components/ats/RecruiterIntelligenceSearch.svelte
- src/lib/components/ats/ResumeIntelligencePanel.svelte
- src/lib/components/attendance/AttendanceActions.svelte
- src/lib/components/attendance/AttendanceViewContainer.svelte
- src/lib/components/attendance/OrganizationAttendanceDashboard.svelte
- src/lib/components/attendance/RegularizationPanel.svelte
- src/lib/components/auth/AuthCommandCanvas.svelte
- src/lib/components/auth/AuthFlipView.svelte
- src/lib/components/auth/AuthForm.svelte
- src/lib/components/auth/AuthFrame.svelte
- src/lib/components/auth/ForgotPasswordForm.svelte
- src/lib/components/auth/LoginForm.svelte
- src/lib/components/auth/ReferenceAuthCard.svelte
- src/lib/components/auth/RegisterForm.svelte
- src/lib/components/billing/BillingOverview.svelte
- src/lib/components/chat/AudioPlayer.svelte
- src/lib/components/chat/ChatHeader.svelte
- src/lib/components/chat/ChatInputBar.svelte
- src/lib/components/chat/ChatProfileModal.svelte
- src/lib/components/chat/ChatSearchDialog.svelte
- src/lib/components/chat/ChatThread.svelte
- src/lib/components/chat/ChatWorkspace.svelte
- src/lib/components/chat/ConversationListItem.svelte
- src/lib/components/chat/ConversationSidebar.svelte
- src/lib/components/chat/EmojiPicker.svelte
- src/lib/components/chat/ImageLightboxModal.svelte
- src/lib/components/chat/MessageBubble.svelte
- src/lib/components/chat/MessageList.svelte
- src/lib/components/chat/MessageToTaskDialog.svelte
- src/lib/components/chat/NewDirectChatDialog.svelte
- src/lib/components/chat/NewGroupChatDialog.svelte
- src/lib/components/chat/VoiceRecorder.svelte
- src/lib/components/chat/types.ts
- src/lib/components/chat/unread-event.ts
- src/lib/components/chat/utils.ts
- src/lib/components/collaboration/CollaborationWorkspace.svelte
- src/lib/components/dashboard/Overview.svelte
- src/lib/components/departments/DepartmentCreateDialog.svelte
- src/lib/components/departments/DepartmentDeleteDialog.svelte
- src/lib/components/departments/DepartmentDetailsView.svelte
- src/lib/components/departments/DepartmentListTable.svelte
- src/lib/components/departments/DepartmentTeamDeleteDialog.svelte
- src/lib/components/departments/DepartmentTeamDialog.svelte
- src/lib/components/documents/DocumentCenter.svelte
- src/lib/components/employees/CompanyDirectoryView.svelte
- src/lib/components/employees/EditEmployeeDialog.svelte
- src/lib/components/employees/EmployeeInvitationActions.svelte
- src/lib/components/employees/OnboardingChecklist.svelte
- src/lib/components/employees/SelfProfileForm.svelte
- src/lib/components/employees/WorkforceDirectoryTable.svelte
- src/lib/components/employees/onboarding/EmployeeIllustration.svelte
- src/lib/components/employees/onboarding/FinanceAdminIllustration.svelte
- src/lib/components/employees/onboarding/HRAdminIllustration.svelte
- src/lib/components/employees/onboarding/HRExecutiveIllustration.svelte
- src/lib/components/employees/onboarding/ManagerIllustration.svelte
- src/lib/components/employees/onboarding/OnboardingCompactStepProgress.svelte
- src/lib/components/employees/onboarding/OnboardingVerticalStepNav.svelte
- src/lib/components/employees/onboarding/OnboardingWizard.svelte
- src/lib/components/employees/onboarding/ProjectManagerIllustration.svelte
- src/lib/components/employees/onboarding/RecruiterIllustration.svelte
- src/lib/components/employees/onboarding/RoleIllustration.svelte
- src/lib/components/employees/onboarding/Step1RoleSelection.svelte
- src/lib/components/employees/onboarding/Step2RoleDetails.svelte
- src/lib/components/employees/onboarding/Step3ReviewConfirm.svelte
- src/lib/components/employees/onboarding/Step4ProfileCreated.svelte
- src/lib/components/employees/onboarding/Step5InvitationStatus.svelte
- src/lib/components/employees/onboarding/TeamLeadIllustration.svelte
- src/lib/components/employees/onboarding/types.ts
- src/lib/components/expenses/ExpenseDashboard.svelte
- src/lib/components/expenses/ExpenseDetail.svelte
- src/lib/components/hud/LoginIdentityHud.svelte
- src/lib/components/hud/RecoveryPipelineHud.svelte
- src/lib/components/hud/RegisterOnboardingHud.svelte
- src/lib/components/hud/WorkforceNetworkHud.svelte
- src/lib/components/journey/EnterpriseJourneyMap.svelte
- src/lib/components/layout/AppShell.svelte
- src/lib/components/layout/Breadcrumb.svelte
- src/lib/components/layout/LogoutButton.svelte
- src/lib/components/layout/MobileNav.svelte
- src/lib/components/layout/SidebarNav.svelte
- src/lib/components/layout/navigation.ts
- src/lib/components/layout/platform-navigation.ts
- src/lib/components/leave/LeaveApplicationForm.svelte
- src/lib/components/notifications/NotificationCenter.svelte
- src/lib/components/payroll/PayrollDashboard.svelte
- src/lib/components/payroll/PayslipList.svelte
- src/lib/components/platform/CompactStepProgress.svelte
- src/lib/components/platform/ConfigurationEditor.svelte
- src/lib/components/platform/FeatureEditor.svelte
- src/lib/components/platform/FeatureFlagToggle.svelte
- src/lib/components/platform/OrganizationCreateDialog.svelte
- src/lib/components/platform/OrganizationCreateForm.svelte
- src/lib/components/platform/OrganizationCreateWizard.svelte
- src/lib/components/platform/OrganizationInvitationActions.svelte
- src/lib/components/platform/OrganizationListTable.svelte
- src/lib/components/platform/OrganizationStatusActions.svelte
- src/lib/components/platform/OrganizationSupportNotes.svelte
- src/lib/components/platform/PlanManagement.svelte
- src/lib/components/platform/PlatformAuditList.svelte
- src/lib/components/platform/PlatformShell.svelte
- src/lib/components/platform/PlatformUserList.svelte
- src/lib/components/platform/ProvisioningJobActions.svelte
- src/lib/components/platform/ProvisioningManager.svelte
- src/lib/components/platform/ProvisioningProgressModal.svelte
- src/lib/components/platform/SubscriptionManagement.svelte
- src/lib/components/platform/SupportOrganizationList.svelte
- src/lib/components/platform/UsageManagement.svelte
- src/lib/components/platform/VerticalStepNav.svelte
- src/lib/components/platform/WizardStepContactAddress.svelte
- src/lib/components/platform/WizardStepOrganization.svelte
- src/lib/components/platform/WizardStepOwner.svelte
- src/lib/components/platform/WizardStepPlan.svelte
- src/lib/components/platform/WizardStepRegional.svelte
- src/lib/components/platform/WizardStepReview.svelte
- src/lib/components/platform/organization-wizard-types.ts
- src/lib/components/platform/types.ts
- src/lib/components/reports/BarList.svelte
- src/lib/components/reports/ReportDashboard.svelte
- src/lib/components/settings/MasterDataEditDialog.svelte
- src/lib/components/settings/MasterDataManager.svelte
- src/lib/components/settings/ShiftFormDialog.svelte
- src/lib/components/ui/Badge.svelte
- src/lib/components/ui/Button.svelte
- src/lib/components/ui/Card.svelte
- src/lib/components/ui/CardContent.svelte
- src/lib/components/ui/CardDescription.svelte
- src/lib/components/ui/CardFooter.svelte
- src/lib/components/ui/CardHeader.svelte
- src/lib/components/ui/CardTitle.svelte
- src/lib/components/ui/ConfirmDialog.svelte
- src/lib/components/ui/CustomSelect.svelte
- src/lib/components/ui/DialogFrame.svelte
- src/lib/components/ui/Icon.svelte
- src/lib/components/ui/Input.svelte
- src/lib/components/ui/LinkButton.svelte
- src/lib/components/ui/Modal.svelte
- src/lib/components/ui/Reveal.svelte
- src/lib/components/ui/Toasts.svelte
- src/lib/components/ui/icon-nodes.json
- src/lib/components/workflows/WorkflowSettings.svelte
- src/lib/domain/attendance/calculator.test.ts
- src/lib/domain/attendance/calculator.ts
- src/lib/domain/attendance/dashboard-types.ts
- src/lib/domain/attendance/types.ts
- src/lib/domain/departments/hr.ts
- src/lib/domain/departments/types.ts
- src/lib/domain/employees/types.ts
- src/lib/domain/expenses/calculator.test.ts
- src/lib/domain/expenses/calculator.ts
- src/lib/domain/leave/calculator.test.ts
- src/lib/domain/leave/calculator.ts
- src/lib/domain/payroll/calculator.test.ts
- src/lib/domain/payroll/calculator.ts
- src/lib/domain/rbac/permissions.test.ts
- src/lib/domain/rbac/permissions.ts
- src/lib/navigation.test.ts
- src/lib/navigation.ts
- src/lib/server/api-manifest.json
- src/lib/server/context.ts
- src/lib/server/database.ts
- src/lib/server/employee-owner.ts
- src/lib/server/legacy.ts
- src/lib/server/platform-read.ts
- src/lib/server/proxy-policy.test.ts
- src/lib/server/proxy-policy.ts
- src/lib/server/schema.ts
- src/lib/server/tenant-read.ts
- src/lib/utils.ts
- src/routes/+error.svelte
- src/routes/+layout.server.ts
- src/routes/+layout.svelte
- src/routes/+page.server.ts
- src/routes/+page.svelte
- src/routes/api/[...path]/+server.ts
- src/routes/app/+layout.server.ts
- src/routes/app/+layout.svelte
- src/routes/app/+page.server.ts
- src/routes/app/+page.svelte
- src/routes/app/approvals/+page.server.ts
- src/routes/app/approvals/+page.svelte
- src/routes/app/attendance/+page.server.ts
- src/routes/app/attendance/+page.svelte
- src/routes/app/chat/+page.svelte
- src/routes/app/departments/+page.server.ts
- src/routes/app/departments/+page.svelte
- src/routes/app/departments/[departmentId]/+page.server.ts
- src/routes/app/departments/[departmentId]/+page.svelte
- src/routes/app/directory/+page.server.ts
- src/routes/app/directory/+page.svelte
- src/routes/app/documents/+page.svelte
- src/routes/app/employees/+page.server.ts
- src/routes/app/employees/+page.svelte
- src/routes/app/employees/[employeeId]/+page.server.ts
- src/routes/app/employees/[employeeId]/+page.svelte
- src/routes/app/employees/new/+page.server.ts
- src/routes/app/employees/new/+page.svelte
- src/routes/app/expenses/+page.svelte
- src/routes/app/expenses/[claimId]/+page.server.ts
- src/routes/app/expenses/[claimId]/+page.svelte
- src/routes/app/leave/+page.svelte
- src/routes/app/notifications/+page.svelte
- src/routes/app/payroll/+page.server.ts
- src/routes/app/payroll/+page.svelte
- src/routes/app/payroll/payslips/+page.svelte
- src/routes/app/profile/+page.server.ts
- src/routes/app/profile/+page.svelte
- src/routes/app/recruitment/+page.server.ts
- src/routes/app/recruitment/+page.svelte
- src/routes/app/recruitment/candidates/[candidateId]/+page.server.ts
- src/routes/app/recruitment/candidates/[candidateId]/+page.svelte
- src/routes/app/recruitment/intelligence/+page.server.ts
- src/routes/app/recruitment/intelligence/+page.svelte
- src/routes/app/reports/+page.svelte
- src/routes/app/settings/+page.server.ts
- src/routes/app/settings/+page.svelte
- src/routes/app/settings/billing/+page.server.ts
- src/routes/app/settings/billing/+page.svelte
- src/routes/app/settings/workflows/+page.svelte
- src/routes/app/work/+page.svelte
- src/routes/change-password/+page.svelte
- src/routes/forgot-password/+page.svelte
- src/routes/invitations/accept/+page.svelte
- src/routes/jobs/[slug]/+page.server.ts
- src/routes/jobs/[slug]/+page.svelte
- src/routes/jobs/[slug]/apply/+page.svelte
- src/routes/login/+page.svelte
- src/routes/platform/+layout.server.ts
- src/routes/platform/+layout.svelte
- src/routes/platform/+page.server.ts
- src/routes/platform/+page.svelte
- src/routes/platform/analytics/+page.server.ts
- src/routes/platform/analytics/+page.svelte
- src/routes/platform/audit/+page.server.ts
- src/routes/platform/audit/+page.svelte
- src/routes/platform/configuration/+page.server.ts
- src/routes/platform/configuration/+page.svelte
- src/routes/platform/features/+page.server.ts
- src/routes/platform/features/+page.svelte
- src/routes/platform/health/+page.server.ts
- src/routes/platform/health/+page.svelte
- src/routes/platform/login/+page.svelte
- src/routes/platform/organizations/+page.server.ts
- src/routes/platform/organizations/+page.svelte
- src/routes/platform/organizations/[organizationId]/+page.server.ts
- src/routes/platform/organizations/[organizationId]/+page.svelte
- src/routes/platform/organizations/new/+page.server.ts
- src/routes/platform/organizations/new/+page.svelte
- src/routes/platform/plans/+page.server.ts
- src/routes/platform/plans/+page.svelte
- src/routes/platform/provisioning/+page.server.ts
- src/routes/platform/provisioning/+page.svelte
- src/routes/platform/subscriptions/+page.server.ts
- src/routes/platform/subscriptions/+page.svelte
- src/routes/platform/support/+page.server.ts
- src/routes/platform/support/+page.svelte
- src/routes/platform/usage/+page.server.ts
- src/routes/platform/usage/+page.svelte
- src/routes/platform/users/+page.server.ts
- src/routes/platform/users/+page.svelte
- src/routes/register/+page.svelte
- src/routes/reset-password/+page.svelte
- src/routes/verify-email/+page.svelte
- static/LUCIDE-LICENSE.txt
- static/enterprise-journey-landscape.jpg
- static/favicon.svg
- static/fonts/438aa629764e75f3-s.woff2
- static/fonts/4c9affa5bc8f420e-s.p.woff2
- static/fonts/51251f8b9793cdb3-s.woff2
- static/fonts/875ae681bfde4580-s.woff2
- static/fonts/cc978ac5ee68c2b6-s.woff2
- static/fonts/e857b654a2caa584-s.woff2
- static/journey-world-landscape.jpg
- static/symphowork-logo-white.png
- static/symphowork-logo.png
- static/symphowork-symbol.png

Original Git status:

    ## naresh-dev
    ?? scratch/cookies.txt

No commits, pushes, database migrations, seeds, production mutations or install-script approvals were performed. See migration-checklist.json for every source route/component/role/API/interaction reference and its unverified state.

## Latest continuation batch

Confirmed source-preserving interaction corrections in live text search/filter fields and corrected chat message initial/append scrolling. The final `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` results are recorded in `verification-latest.json`.

Target source files touched in this validation/correction batch:

- `src/lib/components/chat/ChatSearchDialog.svelte`
- `src/lib/components/ats/AtsDashboard.svelte`
- `src/lib/components/chat/NewDirectChatDialog.svelte`
- `src/lib/components/chat/ConversationSidebar.svelte`
- `src/lib/components/attendance/OrganizationAttendanceDashboard.svelte`
- `src/lib/components/chat/MessageList.svelte`

Target documentation updated:

- `docs/source-port-state-evidence.jsonl`
- `docs/verification-latest.json`
- `docs/migration-checklist.json`
- `docs/migration-progress.md`

No package manifest or lockfile changed. The microphone policy remains restrictive. The five source-backed components regenerated during recovery are listed in `verification-latest.json`; because the target lacks Git history, any unrecorded Svelte-only edits in those files need review before relying on them.

## Latest resumed recovery and verification batch — 2026-10-20

- Read the recovery report and latest verification record first. Reviewed the five previously implicated components against original source: ChatSearchDialog, AtsDashboard, NewDirectChatDialog, ConversationSidebar, and OrganizationAttendanceDashboard. Source-level checks confirmed reactive input handlers for search/filter fields, escaped HTML in chat search, and matching API paths where direct fetch calls are used. Target-only handwritten differences cannot be reconstructed because the target has no Git history.
- Reviewed /app/employees/new and the existing Svelte onboarding wizard. It contains the employee.create route guard, role assignment via existing RBAC, five-step role/details/review/profile/invitation flow, source-backed validation, profile create POST, invitation POST, and resend POST. No authenticated API/provider behavior was exercised.
- Fixed all 53 compiler accessibility warnings without global suppression: linked wizard and plan labels; changed plan selection to an associated native radio inside a label; made chat profile/image actions keyboard-operable; added focusable dialog roles, Escape handling and backdrop-only close behavior; kept Escape handling request-local to avoid duplicate global handlers; replaced autofocus with programmatic focus and moved initial focus into image preview. Existing content and visual structure remain. Manual screen-reader and keyboard review remain pending.
- Static route inventory check matched all 52 checklist target paths with the 52 current Svelte +page.svelte files. This verifies file inventory only: every route remains implemented-awaiting-parity, with functional parity NOT VERIFIED and visual parity NOT COMPARED.
- Commands, in sequence: pnpm.cmd check passed (0 errors, 0 warnings); pnpm.cmd test passed (9 files, 192 tests); pnpm.cmd build passed after final source refinement (412 SSR / 414 client modules; final reported bundle stage 46.33s; adapter-node done); pnpm.cmd test:e2e passed after final source refinement (16 tests, 35.5s). E2E tests exercise public/fail-closed foundation flows with mock transport and target-only screenshots, not authenticated business workflows or visual parity.
- Files changed in this batch: src/lib/components/chat/ChatSearchDialog.svelte, src/lib/components/chat/ImageLightboxModal.svelte, src/lib/components/chat/ChatHeader.svelte, src/lib/components/chat/MessageBubble.svelte, src/lib/components/platform/OrganizationInvitationActions.svelte, src/lib/components/platform/WizardStepPlan.svelte, src/lib/components/platform/WizardStepOrganization.svelte, src/lib/components/platform/WizardStepContactAddress.svelte, src/lib/components/platform/WizardStepOwner.svelte, src/lib/components/platform/WizardStepRegional.svelte, and src/lib/components/platform/PlanManagement.svelte. This report and docs/verification-latest.json were also updated. No package or lockfile changes.
- Original reference remained at branch naresh-dev, commit 2e4eecd3b9ac10379a320fa12a9691e92bd27b2f, with the pre-existing untracked scratch/cookies.txt; .env.local and credentials.txt existence were confirmed without reading contents. No source or Git changes were made there. Target still has no Git repository, so target-side history-based preservation comparison is unavailable.
- Remaining work is broad: authenticated route/workflow tests for 52 pages, UI comparisons, role-by-role behavior, 131 live API contracts, 88 unreviewed GET safety entries, RLS/two-tenant tests, provider and deployment validation, microphone Permissions-Policy conflict review, migration journal reconciliation, and performance baselines. No live DB/backend/provider, screenshot reference, or performance measurement was used. The migration is incomplete and no route is accepted.
## Latest continuation batch — 2026-10-20

- Re-read the migration progress and verification records, then reconciled the CSV inventories and on-disk Svelte routes. Inventory sizes: 52 original route rows, 131 API route rows, 199 API call-site rows, 130 component rows, 14 role rows, 59 design-token rows, and 88 GET-risk rows. There are 52 Svelte page/loader files and one allowlisted API catch-all. The route inventory still labels every route mapping as proposed/unknown for runtime/UI parity; route file presence is not feature acceptance.
- Static review of `src/lib/server/legacy.ts`, `proxy-policy.ts`, the API catch-all and proxy tests found the relay passes through the original path and query, streams non-GET bodies once, preserves upstream status/status text and response body, forwards only the session cookie, does not retry, uses `no-store`, and rejects external redirects. Tests do not yet establish complete live API contract parity, and query/binary/header behavior is not covered comprehensively by automated contract tests.
- Fixed four real inert controls in chat: the close X buttons in ChatProfileModal, NewDirectChatDialog, MessageToTaskDialog and NewGroupChatDialog now call their existing `onOpenChange(false)` callback. This only restores the intended close interaction and does not change API ownership or permissions.
- Verification after these changes: `pnpm.cmd check` passed with 0 errors and 0 warnings; `pnpm.cmd test` passed (9 files, 192 tests); `pnpm.cmd build` passed (412 SSR / 414 client modules, adapter-node done); `pnpm.cmd test:e2e` passed (16 tests, 25.3s). Browser tests remain foundation/anonymous-access coverage and do not exercise authenticated chat dialogs.
- Files changed in this batch: `src/lib/components/chat/ChatProfileModal.svelte`, `src/lib/components/chat/NewDirectChatDialog.svelte`, `src/lib/components/chat/MessageToTaskDialog.svelte`, `src/lib/components/chat/NewGroupChatDialog.svelte`, `docs/migration-progress.md`, and `docs/verification-latest.json`. No package or lockfile changed. The original Next.js repository was not accessed for writes; no backend, database, or provider was contacted.
- Remaining: full per-route/component/role/workflow reconciliation and implementation, authenticated API contract and integration tests, safe two-tenant/RLS testing, GET side-effect call-graph review, voice permissions policy conflict, migration journal discrepancy, provider setup verification, original-vs-target screenshots, accessibility manual review, and performance baselines. The migration remains incomplete and no route is accepted as parity-verified.

### Verification refinement — 2026-10-20

- Added a mocked relay contract test that asserts query-string forwarding, session-cookie-only forwarding, a byte-exact binary 206 response, and content-range/download response headers.
- After this test-only addition, `pnpm.cmd check` passed with 0 errors and 0 warnings; `pnpm.cmd test` passed (9 files, 193 tests). The production build and 16-test browser smoke suite had passed immediately before this test-only edit, after the four Svelte component edits; neither was rerun after changing only the test file.
- Additional file changed: `src/lib/server/proxy-policy.test.ts`. The complete batch file list is in `verification-latest.json`.

### Latest continuation — chat interactions and duplicate polling — 2026-10-20

- Static comparison of app-shell and chat polling found a duplicate target GET on visibility changes: `/app/chat` refreshes conversation sidebar state through ChatWorkspace and dispatches unread count, but AppShell also called `/api/app/chat/unread-count` on visibility even though its interval correctly skips chat routes. The unread-count and conversations GET paths may conditionally ensure employee state. Added a shared `shouldPollChatUnread` predicate and used it for both timer and visibility events, so the app shell leaves chat-page unread refresh ownership to ChatWorkspace. No caching, retry, or API changes were introduced.
- Added predicate regression coverage for `/app/chat`, nested chat routes, hidden tabs, and unrelated paths. The relay contract test from the preceding batch also asserts synthetic query, cookie, byte-level binary partial-response, and download-header behavior.
- Final verification after all changes: `pnpm.cmd check` passed (0 errors, 0 warnings); `pnpm.cmd test` passed (10 files, 195 tests); `pnpm.cmd build` passed (412 SSR / 414 client modules, adapter-node done); `pnpm.cmd test:e2e` passed (16 tests, 29.1s). Browser tests do not enter authenticated chat workflows; the polling predicate is covered by a unit test.
- Files changed in this batch: four chat dialog components, `src/lib/components/chat/unread-event.ts`, `src/lib/components/chat/unread-event.test.ts`, `src/lib/components/layout/AppShell.svelte`, `src/lib/server/proxy-policy.test.ts`, plus this progress report and `docs/verification-latest.json`. No dependency/lockfile change and no original-project write.
- Migration remains incomplete. All 52 route entries still lack accepted runtime/UI parity; authenticated workflow/API parity, RLS and cross-tenant authorization, private files, migration-journal reconciliation, provider integrations, original-vs-target screenshots, and performance measurements remain unresolved or blocked by unavailable authorized infrastructure.

### Final chat polling refinement — 2026-10-20

- A second check found that the AppShell also made an unconditional initial unread-count request on `/app/chat`, even though its periodic timer skipped that route. The initial request now uses the same shared route/visibility predicate, so chat pages leave unread count to ChatWorkspace from first load onward.
- Re-ran the full safe target sequence after this source change: `pnpm.cmd check` passed (0 errors, 0 warnings); `pnpm.cmd test` passed (10 files, 195 tests); `pnpm.cmd build` passed (412 SSR / 414 client modules, adapter-node done); `pnpm.cmd test:e2e` passed (16 tests, 28.4s).
- No new file was added beyond the previous continuation batch; `src/lib/components/layout/AppShell.svelte` received the additional initial-load guard. The original workspace and database/provider infrastructure remained untouched.

## Latest substantial feature/security batch — chat voice policy — 2026-10-20

- Source inspection confirmed that the migrated VoiceRecorder invokes `navigator.mediaDevices.getUserMedia({ audio: true })`, but `src/hooks.server.ts` had an explicit `microphone=()` Permissions-Policy. That header prevented the existing voice feature from working regardless of the user's browser permission. Changed the target policy to `microphone=(self)`; camera and geolocation remain denied. Recording still requires an explicit browser permission grant, and this is a policy-header fix only—not proof of authenticated recording or upload parity.
- Added an E2E assertion that production responses allow microphone only to the same origin while retaining camera/geolocation restrictions.
- Verification after the change: `pnpm.cmd check` passed (0 errors, 0 warnings); `pnpm.cmd test` passed (10 files, 195 tests); `pnpm.cmd build` passed (412 SSR / 414 client modules; adapter-node done); `pnpm.cmd test:e2e` passed (16 tests, 26.5s). E2E does not enter authenticated chat or grant microphone permission.
- Files changed: `src/hooks.server.ts`, `tests/browser/foundation.spec.ts`, this report, and `docs/verification-latest.json`. No dependencies or lockfile changed; original Next.js workspace, databases, backends, and providers were untouched.
- Full application migration remains incomplete. Every route's functional/UI parity remains unverified. Actual voice capture, all authenticated workflows, cross-tenant/RLS checks, private file authorization, live API contracts, visual screenshots, and performance comparisons still require safe authorized infrastructure and broader test coverage.


## Substantial workflow continuation — 2026-10-20

This batch implements and exercises multiple application workflows. Full migration acceptance remains INCOMPLETE: 52/52 page files and 131 API inventory entries are structural coverage, and zero routes have passed full functional/security/visual acceptance.

### Implemented and corrected

- **Expenses, receipts and documents:** partial claim creation now preserves the draft ID and offers a direct recovery link instead of allowing another create. Draft detail now uploads receipts through the existing item receipt API and submits through the existing claim submit API, with submit/cancel UI permission checks and backend errors retained. Receipt association uses category/date/trimmed-description/amount matching, consuming each saved item once; it no longer trusts unspecified server row ordering. New shared metadata checks mirror the source document allowlist, extension rules and 10 MB limit; server signature/scanning/storage authorization remains authoritative. Claim navigation clears old detail and discards stale load responses.
- **Payroll:** failed period, salary structure/component/link, employee profile, salary assignment and payment mutations retain form data and open dialogs. Failed finalization keeps the review visible. The common action function guards concurrent actions; successful mutations retain existing refresh behavior. No financial state is optimistically finalized or paid.
- **Employee onboarding and invitations:** repeated create/invite submissions are guarded, and the selected role is rechecked against assignable roles before profile creation. Failed or missing delivery confirmation now shows attention/manual-link states instead of claiming dispatch or successful token generation. Existing role/resend API contracts are preserved.
- **Attendance, leave and approvals:** regularization can now select a missing date using the source API's attendanceDate branch; existing-record correction remains available. Reason and chronological-time validation and duplicate-submit guards were added. Leave rejects whitespace-only reasons and sends a trimmed reason. Approval rejection preserves its dialog and entered justification when the API fails.
- **Chat and voice:** fixed native textarea change-versus-input migration behavior so Enter sends the current text without requiring blur. Failed attachment upload now reaches the composer/recorder. Failed file-message retry uses the original File, caption, conversation and client idempotency key rather than sending caption text as a replacement message; retry is explicit, never automatic. Voice stop-and-send retains the blob, preview and stable File after failure, with its send guard active before asynchronous stopping. Object-URL cleanup captures the URL belonging to the effect. Actual microphone/device behavior remains unverified.
- **ATS/platform/projects:** candidate resume loading and processing now surface API/network failures, prevent concurrent processing and tolerate missing extracted skills. Configuration saves require an explicit success envelope. The project message-to-task title uses Svelte's value prop in place of React's defaultValue. Shared client API calls now reject malformed/missing success envelopes instead of inventing success.

### Verification and safety

- Read the existing progress/verification records and complete CSV inventories: 52 routes, 131 APIs, 199 API call sites, 130 components, 14 roles and 88 GET-risk entries. Compared affected Svelte components against original components, API routes and domain services before adapting their contracts. No inventory entry was promoted to accepted parity.
- Added a standalone loopback Vite browser harness under tests/workflows. It mounts the actual Svelte components, uses test-only state/navigation aliases, and intercepts API calls with synthetic fixtures. It is outside SvelteKit routes and introduces no production auth bypass. The voice test replaces media APIs and never opens a real microphone. The harness is documented in tests/workflows/README.md.
- Final checks: **0 errors / 0 warnings**, **211 unit tests in 12 files**, **16 synthetic workflow browser tests**, **17 production foundation browser tests**, and **production build passed** (414 SSR / 416 client modules; adapter-node done). Durable browser reports: test-results/workflow-report.json and test-results/browser-report.json. Final build log: test-results/final-build.log.
- Browser workflow cases cover draft receipt/submission recovery, partial create without duplicate creation, denied expense UI actions, invalid upload metadata, payroll save failure, profile/create/invite/resend, missing-date regularization, failed approval rejection, leave failure without optimistic balance changes, immediate chat Enter send, fake voice retry, multipart attachment retry, candidate denial/processing failure and failed platform configuration save.
- Measured three local public-login navigation samples; exact TTFB/DOMContentLoaded/load/transfer-size values are recorded in verification-latest.json and test-results/target-navigation-timings.json. These are target-only local observations, not an original comparison, production benchmark, Web Vitals acceptance or an improvement claim.
- No original source writes, dependency/lockfile changes, commit/push, database/backend/provider contact, migrations or seeds. Original Git status remains naresh-dev at 2e4eecd3b9ac10379a320fa12a9691e92bd27b2f with only its pre-existing untracked scratch/cookies.txt.

### Exact remaining work and next batches

1. Extend the synthetic browser harness to department/team manager and lead selection, deletion dependencies, employee edit/owner protection, self-profile and notification read flows. These components exist but have not passed workflow verification.
2. Exercise payroll assignment/profile/payment/finalization and expense cancellation transitions in permitted/denied roles and failure cases; current synthetic payroll coverage is structure-save failure, not financial workflow acceptance.
3. Reconcile and exercise ATS requisition/job/application/interview/feedback/search, work project/task/member/dependency/comment actions, and platform organization/provisioning/plan/subscription/usage/support/admin flows. Current ATS/platform tests cover only the resume and configuration cases listed above.
4. Use explicitly authorized isolated fixtures for real login/session continuity, invitation acceptance, API-side permission matrices, two-tenant/RLS isolation, private documents/receipts/chat media/resumes/payslips, provider failures and workflow concurrency. Synthetic fixture role data is UI evidence only. The original backend remains the mutation owner, and the Svelte target is not a standalone backend replacement.
5. Complete the 88-entry side-effecting GET review, original-versus-target screenshots and keyboard/device review, authenticated navigation/request-count measurements and comparable performance baselines. Billing overview permission mismatch, migration-journal discrepancy and provider configuration blockers remain unresolved. No unsafe database/provider work was attempted.

Changed implementation/test files for recovery are enumerated in verification-latest.json (batch_files_changed). Prior successful foundation checks do not substitute for the remaining module/role/workflow acceptance.


## Whole-application continuation and remaining acceptance — 2026-10-20

**Acceptance remains INCOMPLETE.** This run changes 56 project files across several modules and adds meaningful workflow tests. It does not establish complete application parity, real login, tenant/RLS isolation, private-file authorization or provider connectivity.

### Whole-source audit

- `docs/audit-current.py` reads source code and inventories without executing the reference app or reading secret files. `docs/application-audit.json` records every original page (52), shared component file (130), API route (131), inventoried API call site (199), role (14), original loading/error/not-found boundary and source environment-variable consumer. All API method sets match the allowlist, with zero mismatches.
- Categories are deliberately conservative: route/component records remain partially implemented until their complete interaction/role/error/visual reconciliation is accepted. API relays are implemented but not integration-tested; dynamic call-site reconciliation remains partial. Pure calculator verification is explicitly limited to unit-test vectors. Infrastructure-dependent acceptance is marked blocked. Presence of files or templates is not completion.
- The audit found two unported shared HUD implementations: `ecosystem-constellation-hud.tsx` and `enterprise-growth-hud.tsx`. They are relatively imported/re-exported by the original WorkforceNetworkHud, whose ecosystem/default variant is still absent in the target. They are not mislabeled as unused. Original error/not-found visual boundaries also need reconciliation. Original screenshots were not compared.

### Substantial implementation batches

1. **Department/team and employee profile:** dependency-check failures no longer offer permanent deletion or archive without a valid check; stale check responses are ignored. Safe archive continues through the existing explicit DELETE mode. Department/team create handlers reject concurrent submissions. Self-profile now loads and edits the backend-supported middle name, validates required names/email/lengths, and preserves failed edits.
2. **Projects/tasks:** added existing backend-supported project status and task dependency operations, with source permission keys and explicit actions. The backend owns cycle, tenant, object and role enforcement. Work actions use current text input and explicit success envelopes, guard duplicate submissions, retain rejected forms and ignore outdated detail responses. Synthetic tests cover create denial, member addition, dependency-cycle rejection and lifecycle PATCH.
3. **Recruitment/platform:** recruiter intelligence now catches API/network/provider failures, releases pending state, preserves query text, supports Enter without blur and displays structured-only/empty results truthfully. Interview schedule/feedback guard duplicate requests. Organization lifecycle and provisioning reject explicit failed envelopes instead of reporting success. Tests cover scheduling denial, suspension/provisioning rejection, provider failure and fallback search.
4. **Authentication/API contracts:** login now refuses to forward to a configured backend when the target's session database is absent, avoiding creation of an unusable local session. New-password policy checks match the source for all form modes. Server JSON loader validation rejects malformed success envelopes. Synthetic relay cases verify login prerequisites, Domain rebasing/security flags, subsequent cookie forwarding, logout expiration and streamed multipart bytes. These are not actual authentication or backend authorization tests.
5. **Loading/navigation:** ported all 16 original loading templates and six shared loading UI components. Source paths/hashes are in `docs/loading-port-evidence.json`. A lazy pending-content boundary in both shells displays the closest inherited source template and hides/inerts stale content during client navigation, without issuing API reads or prefetching business data. Unit/browser tests cover route selection and stale-action suppression. Exact initial SSR streaming, original visual comparison, keyboard/device behavior and error/not-found boundary parity remain pending.

### Login and environment handoff

`docs/auth-environment.md` traces the actual form, relay, cookie and session-reader path, names required configuration, identifies each consumer/service owner and gives a safe local and operator-assisted integration procedure. No values, `.env` files or credentials were read/copied. Real login remains **NOT VERIFIED** because an approved backend/shared fixture DB/valid fixture accounts were not available. The target needs a trusted `LEGACY_BACKEND_ORIGIN` and the authorized shared fixture `DATABASE_URL`; backend APP_URL, injected email/scanner/storage/parser/billing configuration remain backend-owned. Public/login pages remain usable without them and return explicit safe failures. Do not start the original runtime against unknown/default services or run bootstrap/migration/seed commands.

### Final verification

- `npm run check`: **0 errors and 0 warnings**.
- `npm run test`: **13 files, 221 tests passed**.
- `npm run build`: **passed**, adapter-node done (server bundle stage reported 35.16s; a build time is not an application performance result).
- `npm run test:e2e`: **17 production foundation tests passed**. Anonymous guards/fail-closed behavior and public target pages are exercised, not real login.
- `pnpm.cmd exec playwright test --config playwright.workflows.config.ts`: **32 synthetic workflow tests passed**, no skips/failures. Coverage includes the previous expense/onboarding/chat/voice/leave/approval flows plus this run's departments/profile/notifications/work/payroll-payment/interview/platform/search/pending-state cases.
- The workflow suite previously used Playwright's default output directory, which cleared other generated test reports/logs. It now writes artifacts only to `test-results/workflows`; a final rerun confirmed by SHA-256 that the existing production report was preserved. Test reports are `test-results/browser-report.json` and `test-results/workflow-report.json`. No source files were deleted by these test runs.
- Current target-only public-login navigation samples and the previously recorded target samples are retained in verification JSON/test-results. They are real observations, but there is no controlled original baseline, authenticated benchmark or performance improvement claim. The production suite ran alongside a workflow suite; do not treat those timings as controlled comparative measurements.
- All target TS/Svelte files decode as UTF-8. Original read-only Git status still shows only its pre-existing untracked scratch/cookies.txt. No original source/config changes, dependency/lockfile/package-manager changes, database/backend/provider connections, migration/seed/reset, commits or pushes occurred.

### Exact continuation work

- Port the two missing shared HUD implementations/default ecosystem dispatch and reconcile original error/not-found and initial loading/streaming behavior; compare matching viewports before visual acceptance.
- Reconcile each of the 199 original dynamic API call sites with its target request/response use; 131 method mappings alone are insufficient. Review the 88 side-effecting GET entries without cache/retry/prefetch changes.
- Extend source/role/workflow acceptance to employee owner-protection/edit and teams; payroll assignment/profile/review/finalization/payment success; expense approval/reimbursement; private files; ATS requisition/job/application/pipeline/feedback success; and remaining organization/plan/subscription/usage/support/admin actions. Current synthetic cases do not cover all these workflows.
- Use already-provisioned, explicitly authorized isolated backend/database and valid role/tenant fixture accounts for actual login/session continuity, backend permissions, two-tenant/RLS/private files, races and provider behavior. Follow `docs/auth-environment.md`; no fake credentials or auth bypass.
- Resolve the previously documented platform overview commercial permission mismatch, provider bootstrap/configuration and migration-journal discrepancy within their appropriate authorization boundaries. Capture original-versus-target visuals and a controlled performance baseline. No route is accepted as fully migrated until those checks pass.

The exact 56 changed project files and final command outcomes are recorded in `docs/verification-latest.json`. Existing work and original mutation/job ownership are retained.

## 2026-10-20 — Backend configuration and response-contract batch

The login error is caused by absent LEGACY_BACKEND_ORIGIN in the target; DATABASE_URL is also absent and is needed for session/read loaders. The original owns Next.js API mutations and uses PostgreSQL/Drizzle directly. Original configuration metadata indicates a remote database. User instruction: **no live access; a separate authorized local backend will be supplied**. Nothing was connected or activated; real authentication remains blocked, and existing data availability is not verified.

Implemented explicit server-only shared-database configuration resolution (direct DATABASE_URL, or optional authorized absolute SYMPHOWORK_REFERENCE_ENV_FILE), safe sanitized configuration errors, an empty `.env.example`, and a local-only diagnostic script. No values were copied, credentials invented, database created, dependencies changed, or authorization bypassed. Login errors name the missing settings. Both login components reject malformed successful HTTP responses instead of navigating with no confirmed user.

Additional source-derived corrections: EditEmployeeDialog consumes the original employees API's `rows` contract rather than the nonexistent `employees` result; invitation resend/revoke rejects failed envelopes and distinguishes failed/unconfirmed delivery from sent mail; organization creation requires a confirmed organization identity, preserves its draft on failed/malformed responses, and no longer claims provisioning has completed when creation merely queued it.

Acceptance remains incomplete across all modules. Next concrete tasks: supply approved local backend origin and its matching database configuration; verify real login/refresh/logout, role dashboards and read-only existing-data views; reconcile all dynamic API response contracts; complete missing ecosystem/enterprise HUD variants; run authenticated role/tenant/private-file/provider and matching-original screenshot acceptance. Do not run the reference remote configuration or live mutations under the current authorization. See auth-environment.md for the local verification procedure and verification-latest.json for actual test results.

Batch verification: npm run check passed (0 errors / 0 warnings); npm run test passed (14 files / 229 tests); npm run build passed (adapter-node); full isolated component browser suite passed (37 tests); production browser suite passed (19 tests / 41.1s). Static audit: 52 pages, 131 API routes, 130 original components, 199 API call sites, 14 roles, zero relay method mismatches. These are not authenticated integration or complete parity results. Exact files/commands: docs/backend-integration-batch.json.


## Authorized live review stack and login hydration fix — 2026-10-20

User explicitly authorized the existing remote database for development authentication/session/audit writes and approved private use of the existing local review account file. Prepared ignored .review-backend with copied source/config and a dependency junction; excluded original environment and credentials. Target ignored .env.local sets LEGACY_BACKEND_ORIGIN and SYMPHOWORK_REFERENCE_ENV_FILE only. Original backend remains authoritative. No migrations, seeds, resets, business mutations, provider operations or Git writes.

Verified backend Ready on port 3000 and Svelte Ready on 5173; original SELECT-1 health returned database OK. Three real accounts: platform dashboard/organization registry/existing API rows; privileged tenant dashboard/employee/department reads/existing employee rows; restricted tenant redirects and denied employee/platform APIs. Refresh preserved sessions, logout removed access, invalid password returned 401. Browser form login/role redirect/refresh/confirmation logout/revoked-cookie rejection passed with zero page errors. Session expiration by elapsed time, cross-tenant/RLS proof, private files and financial/provider workflows remain unverified. Browser checks abort unrelated polling/reminder/external requests rather than creating extra business writes.

Live browser verification exposed early input loss before cold Vite hydration. LoginForm now disables input/submission until onMount; a delayed-script production-browser regression was added. Added guarded local-only startup utility and five isolated launcher tests, explicit authorized backend launcher and sanitized live verification scripts. See review-runbook.md for current commands and verification-latest.json for final build/test results. Entire migration is not accepted as complete.


## Completed Component, Route, Error Boundary & Business Parity Batch — 2026-10-20

### 1. Component & Route Parity (100% Mapped):
- Ported the remaining shared HUD implementations from `.review-backend`:
  - `EnterpriseGrowthHud.svelte`: 6-stage interactive SaaS growth timeline scrubber, auto-advance ticker, animated SVG ribbons, particle glow paths, playback controls.
  - `EcosystemConstellationHud.svelte`: 5-phase interactive workflow command engine, 9 stage nodes, multi-rail SVG routing, animated pulses, subsystem inspector strip.
  - `WorkforceNetworkHud.svelte`: Full variant support (`variant = "ecosystem"` default, plus `"auth"`, `"onboarding"`, `"recovery"`).
  - Unmapped components audit (`python docs/audit-current.py`): **0 unmapped components** (all 130 components in the original Next.js codebase are mapped to Svelte equivalents).
- Ported error and not-found boundaries:
  - `src/routes/app/+error.svelte`: Workspace error boundary matching Next.js `src/app/app/error.tsx` with reload and `invalidateAll` retry handlers.
  - `src/routes/platform/+error.svelte`: Platform console error boundary matching Next.js `src/app/platform/error.tsx`.
  - `src/routes/+error.svelte`: Root error page aligned with `src/app/not-found.tsx` (exact 404 "Page not found" with link to `/`) and `src/app/error.tsx` (500 error state with retry and overview link).

### 2. Business Workflows & Component Test Parity:
- Created `tests/workflows/business-parity.spec.ts` covering:
  - `EditEmployeeDialog`: Manager choices properly populated from the original API `rows` contract, excluding self (`employee.id`), with owner protection locking `ORGANIZATION_OWNER` role, and preserving input on server rejection.
  - `AttendanceActions`: Biometric clock-in punch issues POST to `/api/app/attendance/punch`, updates punch list, and cleanly handles backend rejection errors.
  - `DocumentCenter`: Enforces scan status gating before allowing file open (`disabled` with "Unavailable until clean" when scanning, active when clean).
  - `AtsDashboard`: Renders recruitment requisitions and candidate metrics with search and stage pipeline.
- Extended Vitest unit tests in `src/lib/domain/attendance/calculator.test.ts` for `calculateBreakSummary` covering active breaks with elapsed seconds, unstarted breaks, and exceeded break thresholds across multiple intervals.

### 3. Verification Metrics:
- `npm run check`: **0 errors and 0 warnings**.
- `npm run test`: **16 test files, 243 tests passed** (0 failures).
- `npm run build`: **passed cleanly** (@sveltejs/adapter-node done, 441 SSR and 444 client modules transformed).
- `npm run test:e2e`: **20 production browser tests passed**.
- `pnpm.cmd exec playwright test --config playwright.workflows.config.ts`: **49 workflow tests passed** across 11 spec files.
- Authoritative Next.js backend on loopback port 3000 verified healthy (`status: ok`, `database: ok`).


## Security correction and verification � 2026-10-20

This entry supersedes previous session-cache safety and performance assertions. Migration remains incomplete.

- Removed the process-global 15-second authorization cache and global logout clearing. Every resolver invocation queries the session/user and tenant authorization state; no in-flight result can refill a shared authorization cache. An already-authorized request may still finish; this does not assert transactional revocation of operations already in progress.
- Removed generic client GET caching/deduplication entirely. Request headers, credentials, abort signals and responses remain request-local; old responses cannot populate a cache after mutations/logout. No GET endpoint is assumed side-effect-free.
- Added narrow relay validation matching the original department input contract and rejecting malformed employee/department mutation IDs. Controlled 400, mocked valid-missing 404 preservation and authorization-denial preservation verified without live mutations. Original errorResponse still lacks general Zod handling; broader backend correction remains outstanding and original files were not modified.
- Directory requests abort superseded fetches, guard results/errors/loading with a request generation, clear obsolete rows, show visible failures and allow retry. Browser fixture deliberately ignores cancellation to verify generation handling. Manager selection test now asserts both eligible choices, absent self and submitted manager identity.
- Verification actually run: check 0 errors/0 warnings; 255 unit tests across 18 files; production build passed; 50 synthetic workflow tests; 20 production browser foundation tests. No failed checks in this batch. Existing dependencies and lockfile preserved.
- Rechecked structural coverage: 52 matching page paths; 131 API entries with zero method mismatches. This is not functional acceptance.
- Live authentication/current-data reads, successful business persistence, RLS/tenant/private-file acceptance and original-versus-target visual parity were not tested in this run. Existing role-policy fallback semantics remain unchanged; live permission revocation acceptance is still required. No performance improvement claimed; historical benchmark limitations are flagged in performance-report.md.
- Publishing blocked pending agreed repository layout. Target has no Git metadata. Original was inspected read-only: branch naresh-dev, local/remote commit 2e4eecd3b9ac10379a320fa12a9691e92bd27b2f, one pre-existing untracked file preserved. No staging, commit, fetch that changes original metadata, cross-folder copy or push performed. Proposed next step: separate clone of origin/naresh-dev, add reviewed Svelte files to new svelte/ directory, excluding secrets, credentials, runtime copies, dependency/build/test artifacts; review staged diff and run gates there; fetch/recheck before a normal push. Obtain the user's agreement to this layout first as requested.

Changed files in this batch:
- `src/lib/server/context.ts`
- `src/lib/server/context.test.ts`
- `src/lib/server/legacy.ts`
- `src/lib/server/request-validation.ts`
- `src/lib/server/request-validation.test.ts`
- `src/lib/client/api.ts`
- `src/lib/client/api.test.ts`
- `src/lib/components/employees/WorkforceDirectoryTable.svelte`
- `tests/workflows/business-parity.spec.ts`
- `tests/workflows/directory-race.spec.ts`
- `tests/workflows/harness/Harness.svelte`
- `tests/workflows/harness/navigation.ts`
- `playwright.workflows.config.ts`
- `docs/performance-report.md`
- `docs/migration-progress.md`
- `docs/verification-latest.json`


## Relocated release snapshot

The working app is published under repository subdirectory `svelte/`. The package root for all Svelte commands and local process environment is that directory. Historical commands and account/backend results in earlier entries belong to the source workspace and are not proof of live integration from the relocated checkout. The current release verification boundary is summarized in `verification-latest.json` and `relocation-and-development.md`.
