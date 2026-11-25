from pathlib import Path
import json,hashlib
v=Path('docs/verification-latest.json');data=json.loads(v.read_text(encoding='utf-8'))
workflow=json.loads(Path('test-results/workflow-report.json').read_text(encoding='utf-8'))['stats'];browser=json.loads(Path('test-results/browser-report.json').read_text(encoding='utf-8'))['stats']
assert workflow['expected']==32 and workflow['unexpected']==0 and workflow['skipped']==0
assert browser['expected']==17 and browser['unexpected']==0 and browser['skipped']==0
files=json.loads(Path('test-results/current-migration-files.json').read_text(encoding='utf-8'))
audit=json.loads(Path('docs/application-audit.json').read_text(encoding='utf-8'))
current=json.loads(Path('test-results/target-navigation-timings.json').read_text(encoding='utf-8'))
prior=json.loads(Path('test-results/prior-public-login-baseline.json').read_text(encoding='utf-8'))
data.update({
 'checked_at_local':'2026-10-20',
 'scope':'Source comparison across both workspaces; target-only type/unit/build/public smoke tests and synthetic component/relay workflows. No original runtime, database, backend or provider connection.',
 'type_check':'Final npm run check passed: 0 errors, 0 warnings.',
 'unit_tests':'Final npm run test passed: 13 files, 221 tests. Added source loading-boundary selection, login configuration preflight, synthetic session/logout cookie continuity and multipart forwarding cases.',
 'production_build':'Final npm run build passed with adapter-node done; Vite reported server build stage 35.16s. No build ran concurrently with a dev server. The first captured build log was cleared by the previous workflow test output directory; process exit/output confirmed success. Workflow artifacts now have their own directory.',
 'browser_tests':f"Final npm run test:e2e passed: 17 tests in {browser['duration']/1000:.1f}s. Public pages, protected anonymous rejection, fail-closed auth/API, mocked login, target screenshots, CSP and target-only timings. Not authenticated integration.",
 'synthetic_workflow_tests':f"Final npm exec -- playwright test --config playwright.workflows.config.ts passed: 32 tests in {workflow['duration']/1000:.1f}s, no skips/failures. Actual Svelte components with fixture state and intercepted APIs; no production auth bypass. Dedicated test-results/workflows output verified to preserve the existing production report by SHA-256.",
 'api_relay':'All 131 original API route files and exported methods match the target allowlist (0 method mismatches), established by docs/audit-current.py. Synthetic forwarding/body/cookie/logout/binary/error/no-retry tests passed. 199 original call sites are accounted for, but per-call dynamic expression/response and live contracts remain partially reconciled.',
 'route_inventory':'52 original page files, 130 original shared component files, 131 original APIs, 199 inventoried API call sites and 14 roles have explicit records in docs/application-audit.json. All 52 route records are conservatively partially implemented; none accepted for complete route behavior, role, security or visual parity.',
 'whole_application_audit':{'path':'docs/application-audit.json','counts':audit['counts'],'assessment':'Whole-source structural crosswalk plus specific manual source/interaction reviews, not a completed behavioral audit. Existing files are not automatically labeled fully implemented. Remaining missing mappings: ecosystem-constellation-hud.tsx and enterprise-growth-hud.tsx; relative references/default ecosystem behavior are recorded, not classified as unused.'},
 'authentication':'Real login NOT VERIFIED: no approved backend/session DB/valid fixture credentials available. docs/auth-environment.md documents consumers/service owners and a safe operator procedure. A configured backend with missing DATABASE_URL now gives 503 before login is forwarded. Password policy is checked for all new-password form modes. Public/login screens remain usable without services.',
 'environment_requirements':'See docs/auth-environment.md and environment_variable_consumers in docs/application-audit.json. Only source variable names/consumers inspected; no secret files or environment values read or copied. Target needs LEGACY_BACKEND_ORIGIN and a shared authorized fixture DATABASE_URL for real login. Legacy APP_URL and injected email/scanner/storage/parser/billing configuration remain backend-owned.',
 'loading_states':'Ported 16 original loading templates and six source UI loading components, with source hashes/paths in docs/loading-port-evidence.json. Both shells use a lazy pending-content boundary that hides/inerts stale content during client navigation. Synthetic boundary and selector tests passed. Initial SSR streaming, exact error/not-found boundaries, reference screenshots, keyboard/screen-reader and device parity are NOT VERIFIED.',
 'performance':'Prior real target-only local public-login samples are preserved and current samples were measured. No controlled original baseline or authenticated performance comparison exists. The latest production smoke ran alongside synthetic browser tests; do not interpret these local timings as improvements or a controlled benchmark.',
 'performance_samples':current,
 'performance_observations':{'prior_target_only_samples':prior,'current_target_only_samples':current,'comparison_status':'Not a controlled original-versus-target baseline; no improvement claim.'},
 'visual_parity':'NOT COMPARED. Original runtime was not started. Source-derived loading markup and target-only screenshots do not establish visual parity.',
 'security_integration':'Static source permission/context behavior and production anonymous/fail-closed tests inspected. Synthetic role gating, cookie rebasing/expiration and forwarding tests passed. Actual login/session continuity, API RBAC/object authorization, two-tenant/RLS isolation, private files and provider behavior remain NOT VERIFIED.',
 'original_git':'Read-only status remains only the pre-existing untracked scratch/cookies.txt. No original workspace source or Git write was issued.',
 'database_and_providers':'No database, original backend or provider was contacted. No migrations/seeds/resets or production mutations. Backend business mutations and background jobs remain owned by the original service.',
 'dependency_versions':'No dependency, package manager, package manifest or lockfile changes in this run.',
 'accessibility':'Final compiler check has 0 warnings. New loading boundary hides/inerts stale content and source animations include reduced-motion handling. Full manual keyboard/screen-reader acceptance remains pending.',
 'batch_files_changed':files,
 'commands_executed':['python docs/audit-current.py — 52 pages, 130 components, 131 APIs, 199 call sites, 14 roles; 0 API method mismatches','npm run check — passed; 0 errors, 0 warnings','npm run test — passed; 13 files, 221 tests','npm run build — passed; adapter-node done','npm run test:e2e — passed; 17 tests','npm exec -- playwright test --config playwright.workflows.config.ts — passed; 32 tests'],
 'checks_final':'Final target source passed check (0 errors/warnings), 221 unit tests, adapter-node production build, 17 production foundation browser tests and 32 synthetic workflow browser tests. No route is accepted as full migration parity.'
})
data['latest_implementation_batch']={
 'date':'2026-10-20',
 'summary':'Substantial implementation/recovery across departments, self profile, projects/tasks/dependencies, recruiter intelligence/interviews, platform lifecycle/provisioning, authentication preflight/relay contracts and all 16 source route-loading templates. Whole-source crosswalk and secret-free environment handoff added.',
 'completed_features':[
 'Department deletion fails closed when dependency inspection fails; stale inspection responses are discarded. Explicit soft archive is retained. Department/team create handlers guard concurrent submissions.',
 'Self profile includes source API-supported middleName in both loader and form, preventing inadvertent erasure; names/email/length validation and failed-entry preservation added.',
 'Project lifecycle PATCH and task dependency POST controls now expose existing backend operations with UI permission gates. Cycle/object/role validation remains authoritative in the backend. Project/task reads discard stale responses; work mutations guard duplicates, preserve failures and use strict success envelopes/current text inputs.',
 'Recruiter intelligence handles failed APIs/provider/network errors without crashing or getting stuck, supports immediate Enter search, and reports structured fallback/empty results accurately. Interviews guard duplicate scheduling/feedback; platform organization/provisioning actions reject failed success envelopes.',
 'Login with configured backend but absent session database fails before forwarding; source password checks apply to every new-password mode. Added synthetic cookie/logout/multipart contracts and safe environment documentation.',
 '16 original route-loading templates plus Skeleton/PageHeader/KPI/Table/CardGrid and BrandedLoader source components ported; lazy PendingContent attached to both shells blocks stale-page actions during client navigation.'
 ],
 'verification':data['checks_final'],'files_changed':files,
 'remaining_work':[
 'Port the two original ecosystem/growth HUD implementations and restore the shared WorkforceNetworkHud ecosystem/default variant; finish exact original error/not-found/loading-streaming and responsive/keyboard behavior.',
 'Reconcile all 199 dynamic call sites and response schemas; extend real workflow coverage to employee owner-protection/edit, teams, payroll finalize/profile/assignment success paths, expense approval/reimbursement, ATS pipeline/jobs/candidate intake and remaining platform plans/subscriptions/usage/support/admin flows.',
 'Exercise the 88 side-effecting GET entries only with approved fixtures; do not introduce retries/caches/prefetch.',
 'Obtain authorized already-provisioned isolated backend/database/valid fixture accounts and provider sandboxes for real login, sessions, roles, tenant/RLS/private files, workflow concurrency and provider acceptance. No migrations or seeds.',
 'Capture matching original/target screenshots and comparable original/authenticated performance measurements. The current target-only measurements are not such a baseline.',
 'Resolve platform overview subscription.view/billing.view mismatch without bypass, backend provider bootstrap/configuration, and the previously documented migration journal issue.'
 ]}
v.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
section='''

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
- `npm exec -- playwright test --config playwright.workflows.config.ts`: **32 synthetic workflow tests passed**, no skips/failures. Coverage includes the previous expense/onboarding/chat/voice/leave/approval flows plus this run's departments/profile/notifications/work/payroll-payment/interview/platform/search/pending-state cases.
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
'''
p=Path('docs/migration-progress.md');existing=p.read_text(encoding='utf-8');marker='\n\n## Whole-application continuation and remaining acceptance — 2026-10-20';existing=existing.split(marker)[0];p.write_text(existing+section,encoding='utf-8')
print(data['checks_final'])
print('Changed project files:',len(files))
