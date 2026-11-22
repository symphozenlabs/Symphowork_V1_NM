# SymphoWork V1: migration baseline and UI inventory

Status: static inventory verified in this task; proposed migration mappings and capture plans are not implementation. No browser screenshots, performance measurements, database checks, provider checks or original-app tests were performed.

## Evidence and scope

Original: C:/Users/nares/Symphowork_V1_NM. Svelte: C:/Users/nares/Symphowork_Svelte_V1. Only new documentation under the Svelte docs directory is written. Source, dependencies, configuration and lockfiles are preserved. No secret/local credential file contents were read, copied or written. Git reports branch naresh-dev, commit 2e4eecd and an untracked scratch/cookies.txt; only its filename/status was inspected. Preserve it and do not include it in fixtures or screenshots.

Read routes.csv for every original page mapped to a proposed Svelte route/component; api-routes.csv for every API file and methods; api-call-sites.csv for literal client API references and candidate page consumers including layouts. Component, role, asset, design-token and capture inventories complete the UI mapping. Counts and hashes are in inventory-metadata.json.

Generated inventory: 52 pages, 131 API files (88 with GET), 130 component TSX files, 199 API literal references, 59 CSS variable/theme entries, six public assets, 14 organization/platform role records and 52 capture-plan rows. Seventeen GET routes have identified conditional write paths; other GET routes remain unreviewed. Twenty-one API routes have no matched literal page consumer, which is an unknown rather than evidence of dead code.

Documents: [route matrix](routes.csv), [API routes](api-routes.csv), [API references](api-call-sites.csv), [components](components.csv), [tokens](design-tokens.csv), [assets](assets.csv), [roles](roles.csv), [capture matrix](capture-plan.csv), [GET risks](get-risk-register.csv), [module plan](module-matrix.md), [baseline protocol](baseline-validation-plan.md), [evidence/commands](evidence-and-commands.md), [metadata](inventory-metadata.json). The supporting generate-inventory.py script only creates new docs artifacts and refuses to overwrite its output names; it is not application migration code.

API consumers are static candidates, NOT observed requests. A recursive local import closure includes inherited layouts and hidden conditional components. Barrel exports, dynamic code, runtime permissions, externally called APIs and computed paths can escape this analysis. A blank/no-match cell means UNKNOWN, never unused. Interaction labels are lexical cues, not proof that an interaction is rendered or functional.

## Current architecture and routes

The reference uses Next App Router with React, TypeScript, Tailwind v4, PostgreSQL via postgres-js/Drizzle, Zod, React Hook Form, Radix primitives and Lucide React. Manifest ranges are declarations rather than exact installed versions; no original dependency install or audit was run. Root layout uses next/font/google Manrope (Latin, swap), metadata/icons and ToastProvider. Shared business modules contain policy, validation and calculation functions; imports into framework/database/provider code must be split before reuse.

There are 52 page files and 131 API route files. Public routes include /, /login, /register, /forgot-password, /reset-password, /verify-email, /change-password, /invitations/accept and /jobs/[slug] with /apply. Organization screens occupy /app; platform governance occupies /platform with its separate login. Nested detail routes and source locations are exhaustively listed in routes.csv. Layout/loading/error/not-found inheritance is included per page.

Role-specific views share /app (Overview and permission-filtered AppShell navigation), rather than having separate employee/HR route prefixes. Navigation varies for people/directory, approvals, payroll, ATS, reports, billing, departments and settings. Assigned department managers and explicit permissions can affect visibility independently of role names. /platform shares PlatformShell and role-specific console titles. Platform-role menu presence is not evidence of authorization. Source-default role permission inventories are in roles.csv; live assignments have not been read.

Many server pages call Drizzle/services directly (directory, employee pages, overview and platform pages). They do not necessarily call the similarly named REST endpoint. The Svelte route must preserve the existing DTO and access checks; API contract suitability is UNKNOWN until compared. Do not duplicate business data loading in both load functions and on-mount client fetches.

## Shared UI and design reference

Source of truth: src/app/globals.css and src/app/layout.tsx. design-tokens.csv records CSS variables and @theme aliases with source lines. Core values include primary #0D3324, secondary #174734, accent #2D5946, background #F7F8FB, surface #FFFFFF, foreground #0B1930, muted #64748B and border #E2E8F0. Semantic success/danger/warning/info, focus ring and background/border variants also exist. Hardcoded shell colors (#EFF4EE, #E8F0E6, #D9E5D7) and slate/emerald utilities must also be matched; variables alone are insufficient.

AppShell has a fixed w-64 desktop sidebar, lg:pl-64 main region, sticky h-16 header, max-w-[1440px] content and p-5/md:p-8 spacing. MobileNav uses a w-72/max-w-[85vw] portal drawer, Escape close, scroll lock and close-on-route-change. Focus trapping/restoration and screen-reader behavior still need browser verification. Header contains breadcrumbs, responsive search, notifications, logout and profile link. A visible search field is not proof of a functioning global search.

SidebarNav includes a high-frequency route prefetch set and ChatUnreadBadge; HeaderNotifications polls every 30 seconds; AttendanceReminderModal mounts across /app. Root styles contain a 640px media query, auth flip/ambient/HUD/navigation animations and reduced-motion rules. Responsive sm/md/lg and other utility variants require capture against actual computed CSS; do not assume all screens share one breakpoint. Use default Tailwind breakpoint candidates only as test points until computed output is checked.

Reusable primitives include button variants/asChild slot behavior, card subcomponents, badges, inputs, custom selects, confirm/prompt dialogs, branded loaders, skeletons, toast provider and reveal effects. Domain components include onboarding and organization wizards, workforce/department tables, attendance dashboards, expense/document controls, payroll and payslip views, ATS and intelligence panels, chat/audio/attachments, approval inbox and platform CRUD. component-inventory.csv maps every TSX component to a proposed Svelte component path; multiple React exports may require several Svelte files, so those splits are TBD.

Assets are inventoried without copying them. Manrope source/loading, logo variants, Lucide glyphs and icon sizes, animation timing, typography, border/shadow/radius and all inline utility values need visual capture before porting. Neither the Svelte landing page nor any proposed component mapping establishes parity.

## Authentication, authorization and tenant boundaries

src/middleware.ts performs a session-cookie-presence redirect for /app and /platform; it does NOT validate the session. /api/app is not matched by the protected /app prefix check, so API authorization must remain server-side in each handler/service. The middleware supplies x-pathname and security headers. Its Permissions-Policy disables microphone while chat includes voice recording: browser behavior needs review. CSP includes unsafe-inline/unsafe-eval; preserve existing behavior during inventory and review hardening separately.

identity/auth.ts hashes opaque session tokens before DB lookup; getSessionUser checks expiry and active user status using cookies() and React cache(). Cookies are HttpOnly, SameSite=Lax, path / and secure in production. Login, verification, resets, logout and audit writes are mutations. Session continuity, required password change, invalid cookie/redirect behavior and token single-use must be tested with synthetic identities; no real tokens were inspected.

tenancy/context.ts requires a session, resolves active membership and active organization, and loads role/permissions. It uses React cache and a cookie-object-keyed WeakMap. Platform owner has a special context/bypass path; other platform roles have distinct permission sets. Tenancy authorization rejects mismatched membership organization IDs and checks active membership/permissions. Specific service-level and object ownership checks remain essential. These mechanisms are static observations, not proof that all 131 handlers are fully protected.

db/client.ts has transaction-local set_config helpers for user, organization, invitation-token and platform context, plus a shared connection pool and many direct db calls elsewhere. Svelte request context should be explicit event.locals after separate auth design approval; never move these user/tenant caches into a shared mutable global. Database role/RLS behavior, transaction propagation, pool reuse and bypass/owner semantics remain unverified. Two-organization tests with the intended restricted role are prerequisites to protected migration.

## GET risks and ownership

get-risk-register.csv lists EVERY GET route. Confirmed static conditional write paths are marked separately from unreviewed handlers; an idempotency key or conditional insert does not make a GET safe to repeat. Do not invoke these endpoints in this audit.

Confirmed examples: /api/app/attendance can update missing_punch status and ensure an employee; /api/app/me/employee, /leave, /attendance/regularization and /expenses/[claimId] can ensure an employee. /attendance/reminder calls checkAndEnsureAttendanceReminder, which can write notifications/outbox/deliveries/audit and ensure an employee. /master-data/employment-types inserts defaults when none exist. Indirect employee setup also appears through expense listing, payslip listing, project listing/detail and chat services (see register). Default handling for all remaining GETs is UNREVIEWED, not safe.

The shell makes this risk cross-route: notification polling and chat unread requests need separate tracking from page requests; chat unread can ensure an employee, and the attendance modal can create persistent notifications. Do not attach navigation preloading, transparent retries, cache refresh or parallel duplicate calls to these paths.

The Svelte starter app.html already sets data-sveltekit-preload-data=hover. It is not currently connected to business loads, but it becomes a risk when protected/side-effecting data loads are added. Review/remove or opt out at the appropriate boundary before wiring business routes; no change is made now. Keep current mutating APIs in Next initially. Do not run two payroll, notification, invitation, provisioning or background-job owners.

## Svelte foundation and verification status

Only / exists, with +page.svelte identifying the migration workspace. +layout.svelte imports Tailwind-only app.css and NavigationStatus; +error.svelte provides a generic error page/home link. NavigationStatus uses $app/state navigating to show a progress bar/live status. There is no business shell, auth hook, session validation, API handler, database integration or business-module migration. src/app.html is the document template; adapter-node produces build/index.js. No src/**/*.test.ts files exist.

package.json is ESM (type=module). Current installed direct versions were confirmed with pnpm list --depth 0: Kit 2.70.3, Svelte 5.57.2, Vite 7.3.7, plugin 6.2.4, adapter-node 5.5.7, Tailwind/plugin 4.3.3, TypeScript 5.9.3, svelte-check 4.7.7, Vitest 4.1.12, esbuild 0.28.2 and @types/node 24.10.0. Node/pnpm declarations are 24.16.x/11.19.x. No dependencies were added/changed here.

Prior turn in this same session VERIFIED: svelte-kit sync exit 0 without output; pnpm check exit 0 with 0 errors/0 warnings; pnpm test exit 0 because no tests were found and --passWithNoTests is enabled; pnpm build exit 0 and adapter-node completed. These are prior-command results, NOT rerun in this inventory task and NOT application regression or browser coverage. Existing build/index.js was produced then. Svelte source/config/manifest and lock are unchanged in this task. Last verified lock SHA256: 27F9453B3ECED2C8C8938118D46E4DBF6D40E3DF85068BE36F15CF1EB6F1572F.

Prior security-remediation task VERIFIED 0 critical/high/moderate and 1 low cookie advisory from Kit 2's cookie 0.6 dependency. Audit was not refreshed here. No override was added. pnpm-workspace.yaml still has the unresolved esbuild allowBuilds placeholder; no scripts were approved. Optional Windows esbuild binary worked in prior task. Do not infer clean-install/other-platform behavior.

Original app: 99 unit-test files and two Playwright specs were inventoried, not executed. Some UI tests inspect source text; file counts are not coverage. Original Playwright config starts pnpm dev on port 3000 and can reuse an existing server; do not run it blindly against an unknown environment. The original app build, lint, typecheck, provider connectivity, database isolation and all browser flows remain NOT VERIFIED.

## Pilot recommendation

Propose /login initial anonymous presentation using AuthFlipView, AuthCommandCanvas/HUD, LoginForm, shared inputs/buttons, logo, typography and responsive layout. Source login page has no direct session/tenant/database service imports. LoginForm POST occurs on submit, not as a mount fetch. Hidden register/recovery faces are part of the static component tree; keep submissions blocked for the visual pilot. Auth transitions use browser history and animated cards, so capture initial stable state plus password visibility/focus and optional local flip/back behavior with reduced-motion and normal-motion checks.

The pilot has NO authentication success, registration, recovery-email or protected-screen parity claim. Use clean synthetic browser contexts and deny non-allowlisted traffic; do not copy cookies. A public screenshot exercise cannot authorize access or replace the legacy login endpoint. Full auth flows remain Next-owned and need separate session/cutover approval.

A second candidate is /app/directory, which has a simple client search/card grid and explicit tenant-scoped server query, but it is deferred: AppShell mounts side-effecting GETs, it contains personal data, and protected Svelte routes have no approved request auth bridge. Do not expose fixture-backed directory UI publicly as though authorization exists.

## Blockers and decisions

1. Approve isolated synthetic reference environment, sanitized fixtures and role accounts before running either app/browser flows. Do not use configured production resources or copy local secrets.
2. Confirm route preservation, API ownership, session origin/proxy/cookie continuity and server tenant context before protected Svelte pages. No API proxy is implemented.
3. Resolve role-by-role expectations including assigned manager, platform owner and role/permission changes; sources show navigation differences that may not mirror all API decisions.
4. The 20 SQL files end at 0019 but the journal has 19 entries ending 0018; determine each isolated environment's applied state and approved reconciliation before replay. No migration was run.
5. Prove restricted-role RLS/transaction isolation and object-level read/write/download denial. Static query predicates and helper presence are not proof of effective DB enforcement.
6. Provider abstractions for email/billing/malware exist; non-test initializer call sites were not found by name search. External bootstrapping is UNKNOWN. Preserve getMalwareScanner's fail-closed 503 behavior and private download checks.
7. Explicitly decide how side-effecting GET behavior is preserved/refactored before prefetch/cache/retry adoption. All mutating workflow owners must remain singular.
8. Cookie low-advisory acceptance/upgrade decision and esbuild build-script policy remain separate work. This inventory changes neither.
9. Authorize browser/test artifacts, output location, retention/redaction and baseline performance acceptance thresholds. No screenshots, traces, HAR or measurements exist yet.
10. Screenshots cannot establish keyboard, accessibility, authorization or mutation correctness. All are separate gates.

No performance improvement, visual parity or production security assurance is claimed. Stop at inventory; UI/application migration has not begun.
