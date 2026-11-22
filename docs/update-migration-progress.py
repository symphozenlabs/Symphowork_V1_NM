from pathlib import Path
import csv,json,hashlib,datetime,subprocess,re
root=Path(__file__).resolve().parents[1]; docs=root/'docs'; original=Path(r'C:\Users\nares\Symphowork_V1_NM')
def rows(name):return list(csv.DictReader((docs/name).open(encoding='utf-8-sig')))
inventories={name:rows(name) for name in ['routes.csv','components.csv','roles.csv','api-routes.csv','api-call-sites.csv','get-risk-register.csv','design-tokens.csv','capture-plan.csv']}
for name in ['baseline-report.md','module-matrix.md','baseline-validation-plan.md','evidence-and-commands.md']:
 (docs/name).read_text(encoding='utf-8')
routes=[]
for row in inventories['routes.csv']:
 p=root/row['proposed_page_file']; implemented=p.exists() and (row['original_route']!='/' or (root/'src/lib/components/journey/EnterpriseJourneyMap.svelte').exists())
 routes.append({'route':row['original_route'],'source':row['source'],'target':row['proposed_page_file'],'implementation':'implemented-awaiting-parity' if implemented else 'not-implemented','functional_parity':'NOT VERIFIED','visual_parity':'NOT COMPARED','security_integration':'NOT VERIFIED','API_dependencies':row['page_tree_API_templates'],'layout_API_dependencies':row['layout_only_API_templates'],'interactions':[{'name':s,'status':'browser verification pending'} for s in row['interaction_cues_page_components'].split('; ') if s]})
component_files=list((root/'src/lib/components').rglob('*.svelte'))
normalize=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
consolidated={'loginform':'auth/LoginForm.svelte','registerform':'auth/RegisterForm.svelte','forgotpasswordform':'auth/ForgotPasswordForm.svelte','resetpasswordform':'auth/AuthForm.svelte','changePasswordform'.lower():'auth/AuthForm.svelte','verifyemailform':'auth/AuthForm.svelte','invitationacceptform':'auth/AuthForm.svelte','platformloginform':'auth/AuthForm.svelte','authcard':'auth/AuthFrame.svelte'}
components=[]
for row in inventories['components.csv']:
 stem=normalize(Path(row['source']).stem)
 candidates=[p.relative_to(root).as_posix() for p in component_files if normalize(p.stem)==stem]
 if stem in consolidated:candidates=['src/lib/components/'+consolidated[stem]]
 components.append({'source':row['source'],'candidates':candidates,'implementation':'partial-or-unverified' if candidates else 'not-implemented','interaction_cues':row['interaction_cues_heuristic'],'visual_and_keyboard_parity':'NOT VERIFIED'})
api=[{'route':r['route'],'methods':r['methods'],'owner':'original Next backend','target':'src/routes/api/[...path]/+server.ts','implementation':'allowlisted streaming relay','verification':'inventory/method routing tested with mock transport; live contracts NOT VERIFIED','GET_risk':r['GET_review']} for r in inventories['api-routes.csv']]
roles=[{'role':r['role'],'scope':r['scope'],'status':'organization source defaults reused and unit tested; browser/DB NOT VERIFIED' if r['scope']=='organization' else 'source platform permission matrix unit tested; browser/DB NOT VERIFIED','source_dashboard':r['dashboard']} for r in inventories['roles.csv']]
verification_path=docs/'verification-latest.json'
verification=json.loads(verification_path.read_text(encoding='utf-8-sig')) if verification_path.exists() else {'current_tree':'verification in progress; no current-tree production-build claim','prior_unit_run':'181 tests passed before latest module additions','integration':'not executed','visual':'not compared','performance':'not measured'}
git=subprocess.check_output(['git','status','--short','--branch'],cwd=original,text=True).strip()
checklist={'updated_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'acceptance':'INCOMPLETE','routes':routes,'components':components,'roles':roles,'apis':api,'API_call_sites':inventories['api-call-sites.csv'],'GET_review_register':inventories['get-risk-register.csv'],'verification':verification,'original_git_status':git}
(docs/'migration-checklist.json').write_text(json.dumps(checklist,indent=2),encoding='utf-8')
ready=[r['route'] for r in routes if r['implementation']!='not-implemented'];pending=[r['route'] for r in routes if r['implementation']=='not-implemented']
changed=[p.relative_to(root).as_posix() for base in ['src','static'] for p in (root/base).rglob('*') if p.is_file()]
text="""# Consolidated migration progress

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
"""
text+='\nSource templates/state exist for '+str(len(ready))+'/52 required routes; no route has passed the full acceptance gate.\n\n'+', '.join(ready)+'\n\n## Routes not implemented\n\n'+', '.join(pending)+'\n'
text+='\n## Verification\n\n'+json.dumps(verification,indent=2)+'\n'
text+='\n## Files and preservation\n\nApplication/asset file list (includes existing starter files; source ownership is documented by source-port evidence):\n\n'+'\n'.join('- '+p for p in sorted(changed))+'\n'
text+='\nOriginal Git status:\n\n    '+git.replace('\n','\n    ')+'\n\nNo commits, pushes, database migrations, seeds, production mutations or install-script approvals were performed. See migration-checklist.json for every source route/component/role/API/interaction reference and its unverified state.\n'
(docs/'migration-progress.md').write_text(text,encoding='utf-8')
print('Progress recorded:',len(ready),'implemented/unverified routes;',len(pending),'unimplemented routes;',len(components),'components;',len(roles),'roles;',len(api),'API files accounted for.')
