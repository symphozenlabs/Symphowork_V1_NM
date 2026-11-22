from pathlib import Path
import re,csv,json,hashlib,subprocess,datetime,collections
from functools import lru_cache
old=Path(r'C:\Users\nares\Symphowork_V1_NM')
new=Path(r'C:\Users\nares\Symphowork_Svelte_V1')
docs=new/'docs'
assert old.resolve()!=new.resolve()
def read(p):return p.read_text(encoding='utf-8-sig')
def rel(p):return p.relative_to(old).as_posix()
src={p:read(p) for p in (old/'src').rglob('*') if p.is_file() and p.suffix in ('.ts','.tsx','.css')}
pages=sorted(p for p in src if p.name=='page.tsx')
apis=sorted(p for p in src if p.name=='route.ts')
components=sorted(p for p in src if '/components/' in p.as_posix() and p.suffix=='.tsx')
imp_re=re.compile(r'\bimport\s+(?:type\s+)?([^;\'"]+?)\s+from\s+[\'"]([^\'"]+)[\'"]')
url_re=re.compile(r'([\'"\x60])(/api/[^\'"\x60\s]*)\1')
def imports(p):return [(re.sub(r'\s+',' ',n).strip(),s) for n,s in imp_re.findall(src.get(p,''))]
def resolve(p,s):
 base=old/'src'/s[2:] if s.startswith('@/') else p.parent/s if s.startswith('.') else None
 if base is None:return None
 for c in [base,Path(str(base)+'.tsx'),Path(str(base)+'.ts'),base/'index.tsx',base/'index.ts']:
  c=c.resolve()
  if c in src:return c
 return None
def closure(roots):
 done=set(); todo=list(roots)
 while todo:
  p=todo.pop()
  if p in done:continue
  done.add(p)
  for _,s in imports(p):
   q=resolve(p,s)
   if q and (q.is_relative_to(old/'src/components') or q.is_relative_to(old/'src/app') and not q.is_relative_to(old/'src/app/api')):todo.append(q)
 return done
def route(p):return '/'+p.parent.relative_to(old/'src/app').as_posix().replace('.','')
def ancestors(p):
 out=[];d=p.parent
 while d.is_relative_to(old/'src/app'):
  for name in ['layout.tsx']:
   q=d/name
   if q in src:out.append(q)
  if d==old/'src/app':break
  d=d.parent
 return out
def boundary_files(p):
 out=[];d=p.parent
 while d.is_relative_to(old/'src/app'):
  for name in ['layout.tsx','loading.tsx','error.tsx','not-found.tsx']:
   q=d/name
   if q in src:out.append(rel(q))
  if d==old/'src/app':break
  d=d.parent
 return '; '.join(out)
def apiurls(t):return sorted(set(u for _,u in url_re.findall(t)))
def methods(t):return list(re.finditer(r'\bexport\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b',t))
def bodies(t):
 ms=methods(t);return {m.group(1):t[m.start():ms[i+1].start() if i+1<len(ms) else len(t)] for i,m in enumerate(ms)}
def guards(t):return '; '.join(sorted(set(re.findall(r'\b(getSessionUser|requireSession|resolveTenantContext|authorizePlatformTargetOrganization|authorizePlatform|authorizeAny|authorize|canAny|can)\s*\(',t))))
def permissions(t):
 return '; '.join(sorted(set(re.findall(r'permission:\s*[\'"]([^\'"]+)',t)+re.findall(r'PLATFORM_PERMISSIONS\.(\w+)',t))))
patterns={'form':r'<form\b|useForm\(','table':r'<table\b|<Table\b','dialog/modal':r'role=["\x27]dialog|<\w*(?:Dialog|Modal)\b|Dialog\.','filter':r'filter|Filter','search':r'[Ss]earch','pagination':r'pageSize|pagination|[Pp]ageCount|[Nn]ext[Pp]age|[Pp]revious[Pp]age|[Tt]otal[Pp]ages','upload':r'type=["\x27]file|FormData|[Uu]pload','download/export':r'[Dd]ownload|[Ee]xport|createObjectURL','polling':r'setInterval','keyboard':r'onKeyDown|Escape|keydown','audio':r'MediaRecorder|<audio|[Vv]oice','pending':r'[Pp]ending|[Bb]usy|[Ll]oading','empty-state':r'[Ee]mpty|[Nn]o .*found|\.length === 0','error-state':r'[Ee]rror|[Ff]ailed'}
def cues(t):return '; '.join(k for k,pat in patterns.items() if re.search(pat,t))
page_closures={p:closure([p]+ancestors(p)) for p in pages}
page_only={p:closure([p]) for p in pages}
callrows=[]
for p,t in sorted(src.items()):
 if p.suffix not in ('.tsx','.ts') or '.test.' in p.name or p.is_relative_to(old/'src/app/api'):continue
 for m in url_re.finditer(t):
  routes=sorted(route(pg) for pg,cl in page_closures.items() if p in cl)
  callrows.append({'source':rel(p),'line':t.count('\n',0,m.start())+1,'url_template':m.group(2),'candidate_pages_including_inherited_layouts':'; '.join(routes) or 'UNKNOWN: no static page import path found','confidence':'literal reference plus static local-import reachability; not observed traffic; method/conditional execution UNKNOWN'})
def normalize_url(u):
 return re.sub(r'\$\{[^}]*\}',':dynamic',u.split('?')[0]).rstrip('/')
def route_regex(u):
 return '^'+re.sub(r'\\\[[^\]]+\\\]',r'[^/]+',re.escape(u.rstrip('/')))+'$'
@lru_cache(maxsize=None)
def candidates(u):
 u=normalize_url(u)
 return [route(p) for p in apis if re.match(route_regex(route(p)),u) or (':dynamic' in u and re.match('^'+re.escape(u).replace(':dynamic','[^/]+')+'$',re.sub(r'\[[^]]+\]','x',route(p))))]
known={
'/api/app/me/employee':'GET -> getOrEnsureEmployeeForUser -> conditional employee INSERT; employees/service.ts:1132 onward',
'/api/app/attendance':'GET -> getOrEnsureEmployeeForUser; also db.update(attendanceRecords) on missing_punch status correction',
'/api/app/attendance/regularization':'GET -> getOrEnsureEmployeeForUser -> conditional employee INSERT',
'/api/app/attendance/reminder':'GET -> checkAndEnsureAttendanceReminder -> employee setup and createNotification -> notifications/outbox/delivery/audit INSERTs',
'/api/app/leave':'GET -> getOrEnsureEmployeeForUser -> conditional employee INSERT',
'/api/app/expenses/[claimId]':'GET -> getOrEnsureEmployeeForUser -> conditional employee INSERT',
'/api/app/master-data/employment-types':'GET inserts standard employment types when empty (route.ts:38-49)',
'/api/app/expenses':'GET -> listExpenseClaims -> employeeForUser -> getOrEnsureEmployeeForUser',
'/api/app/payroll/payslips':'GET -> listEmployeePayslips -> getOrEnsureEmployeeForUser',
'/api/app/projects':'GET -> listProjects -> employeeForUser -> getOrEnsureEmployeeForUser',
'/api/app/projects/[projectId]':'GET -> getProject -> employeeForUser -> getOrEnsureEmployeeForUser',
'/api/app/chat/conversations':'GET -> listConversations -> employeeForUser -> getOrEnsureEmployeeForUser',
'/api/app/chat/unread-count':'GET -> getUnreadConversationCount -> employeeForUser -> getOrEnsureEmployeeForUser',
'/api/app/chat/conversations/[conversationId]/messages':'GET -> listMessages -> employeeForUser -> getOrEnsureEmployeeForUser',
'/api/app/chat/conversations/[conversationId]/attachments/[attachmentId]':'GET -> getChatAttachment -> employeeForUser -> getOrEnsureEmployeeForUser; private authorization/download also requires review',
'/api/app/chat/search':'GET -> searchMessages -> employeeForUser -> getOrEnsureEmployeeForUser',
'/api/app/chat/recipients':'GET -> listChatRecipients -> employeeForUser -> getOrEnsureEmployeeForUser'
}
apirows=[];getrows=[]
for p in apis:
 t=src[p];u=route(p);bs=bodies(t)
 cons=[c for c in callrows if u in candidates(c['url_template'])]
 risk=('CONFIRMED static conditional write path: '+known[u]) if u in known else 'UNREVIEWED full call graph; no safety inference from GET method'
 if 'GET' not in bs:risk='Not a GET handler; mutation ownership required'
 apirows.append({'route':u,'source':rel(p),'methods':'; '.join(bs),'family':'/'.join(u.split('/')[:4]),'direct_guard_calls':guards(t) or 'NONE detected in route; inspect delegated service enforcement','permission_cues':permissions(t) or 'UNKNOWN/delegated or custom checks','imports':'; '.join(s+' '+n for n,s in imports(p) if s.startswith('@/modules') or s.startswith('@/lib')),'candidate_ui_sources':'; '.join(sorted(set(c['source'] for c in cons))) or 'UNKNOWN/no literal match; may be API-only/server-rendered','candidate_page_routes':'; '.join(sorted(set(pg for c in cons for pg in c['candidate_pages_including_inherited_layouts'].split('; ') if not pg.startswith('UNKNOWN')))) or 'UNKNOWN/no static match','GET_review':risk,'target_ownership':'Retain Next API contract initially; transfer separately after authorization and integration gates'})
 if 'GET' in bs:
  getrows.append({'route':u,'source':rel(p),'risk':risk,'direct_GET_guard_calls':guards(bs['GET']),'awaited_function_cues':'; '.join(sorted(set(re.findall(r'\bawait\s+(\w+)\s*\(',bs['GET'])))),'policy':'NO automatic cache/retry/prefetch/repetition until explicit review; conditional writes still count as side effects','runtime_verification':'NOT RUN'})
routerows=[];capturerows=[]
for p in pages:
 u=route(p);t=src[p];cl=page_only[p];allcl=page_closures[p]
 localapi=sorted(set(a for q in cl for a in apiurls(src.get(q,''))))
 shellapi=sorted(set(a for q in allcl-cl for a in apiurls(src.get(q,''))))
 ui=[(n,s) for n,s in imports(p) if s.startswith('@/components')]
 secure=('Platform roles allowed by specific page/service permission; PLATFORM_OWNER, PRODUCT_OWNER, PLATFORM_ADMIN, PLATFORM_SUPPORT, PLATFORM_BILLING plus denied organization-only user' if u.startswith('/platform') and u!='/platform/login' else
 'Active organization member by server/API permissions; ORGANIZATION_OWNER, HR_ADMIN, HR_EXECUTIVE, RECRUITER, MANAGER, TEAM_LEAD, EMPLOYEE, FINANCE_ADMIN, PROJECT_MANAGER; unauthorized role and second organization' if u.startswith('/app') else
 'Anonymous; authenticated redirect/session states where implemented; expired/invalid link state for token routes')
 target='src/routes'+('' if u=='/' else u)+'/+page.svelte'
 services=[s+' '+n for n,s in imports(p) if s.startswith('@/modules') or s.startswith('@/db')]
 routerows.append({'original_route':u,'source':rel(p),'proposed_route':u,'proposed_page_file':target,'direct_UI_imports':'; '.join(s+' '+n for n,s in ui) or 'Inline page markup; inspect source','proposed_component_mapping':'; '.join(s.replace('@/components/','src/lib/components/')+'.svelte' for _,s in ui) or 'Inline +page.svelte; component extraction TBD','server_data_or_security_imports':'; '.join(services) or 'NONE direct; inspect layout/API/delegated imports','direct_guard_calls':guards(t) or 'NONE direct; not proof of public/unguarded service','permission_cues':permissions(t),'page_tree_API_templates':'; '.join(localapi) or 'NONE found; server data may be direct DB/service','layout_only_API_templates':'; '.join(shellapi) or 'NONE found','inherited_boundaries':boundary_files(p),'interaction_cues_page_components':cues('\n'.join(src.get(q,'') for q in cl)),'role_validation_plan':secure,'status':'PROPOSED mapping; not implemented; runtime/UI parity UNKNOWN'})
 capturerows.append({'route':u,'source':rel(p),'roles_to_resolve_and_capture':secure,'states_to_capture':'Initial; populated/empty where applicable; focus; validation/pending/success/failure for forms; unauthorized and session-expired for protected routes; loading/error boundaries. Applicability and missing states must be confirmed in baseline.','viewports':'390x844; 768x1024; 1440x900; 639/640/641; 767/768/769; 1023/1024/1025 where source classes/media apply','side_effect_policy':'Block non-allowlisted requests; inherited attendance-reminder/chat badge can mutate; approved synthetic environment required for authenticated captures','reference_screenshot':'NOT CAPTURED','svelte_screenshot':'NOT CAPTURED','visual_acceptance':'NOT ASSESSED; same fixtures/fonts/browser/viewport/time; review overlays and all unmasked differences'})
comprows=[]
for p in components:
 t=src[p];name=p.relative_to(old/'src/components').with_suffix('').as_posix()
 comprows.append({'source':rel(p),'proposed_file':'src/lib/components/'+name+'.svelte','export_names':'; '.join(sorted(set(re.findall(r'\bexport\s+(?:async\s+)?(?:function|const|class)\s+(\w+)',t)))),'client_directive':str('"use client"' in t or "'use client'" in t),'interaction_cues_heuristic':cues(t),'API_templates':'; '.join(apiurls(t)),'next_imports':'; '.join(s for _,s in imports(p) if s.startswith('next')),'candidate_pages':'; '.join(sorted(route(pg) for pg,cl in page_closures.items() if p in cl)) or 'UNKNOWN/not statically imported by page/layout','adaptation':'Rewrite React state/effects/JSX and Next-specific imports; Svelte component splits/multiple exports TBD; no automatic code conversion'})
tokens=[]
for i,line in enumerate(src[old/'src/app/globals.css'].splitlines(),1):
 m=re.match(r'\s*(--[\w-]+)\s*:\s*(.+?);',line)
 if m:tokens.append({'source':'src/app/globals.css','line':i,'token':m.group(1),'value':m.group(2),'target':'Proposed src/app.css @theme/base tokens; not copied'})
assets=[{'source':rel(p),'bytes':p.stat().st_size,'target':'Proposed static/'+p.relative_to(old/'public').as_posix(),'status':'Not copied; rendered size/alt/variants must be captured'} for p in sorted((old/'public').rglob('*')) if p.is_file()]
roletext=src[old/'src/modules/rbac/permissions.ts']
permmap=dict(re.findall(r'(\w+):\s*"([^"]+)"',roletext.split('export type Permission')[0]))
roleblock=roletext.split('export const ROLE_PERMISSIONS:')[1].split('export const ASSIGNABLE_ROLES')[0]
roles=[]
for key,expr in re.findall(r'^\s*(\w+):\s*(ALL_PERMISSION_KEYS|\[[^\]]*\])',roleblock,re.M):
 ps=sorted(permmap.values()) if expr=='ALL_PERMISSION_KEYS' else sorted(set(permmap.get(x,'UNKNOWN:'+x) for x in re.findall(r'PERMISSIONS\.(\w+)',expr)))
 roles.append({'role':key,'scope':'organization','default_permission_count':len(ps),'default_permission_keys':'; '.join(ps),'dashboard':'/app shared Overview; permissions alter cards/nav; no distinct role URL found','caution':'Source defaults only; runtime roles/role_permissions and assigned-manager semantics require fixture verification'})
for key in ['PLATFORM_OWNER','PRODUCT_OWNER','PLATFORM_ADMIN','PLATFORM_SUPPORT','PLATFORM_BILLING']:
 roles.append({'role':key,'scope':'platform','default_permission_count':'TBD from computed set','default_permission_keys':'See src/modules/platform/authorization.ts:10 computed rolePermissions; do not equate with organization roles','dashboard':'/platform; title from PLATFORM_ROLE_CONSOLE_TITLES; per-page/service authorizePlatform','caution':'PLATFORM_OWNER special tenant bypass exists; platform menus not evidence of endpoint entitlement'})
oldpkg=json.loads(read(old/'package.json'));newpkg=json.loads(read(new/'package.json'))
journal=json.loads(read(old/'drizzle/meta/_journal.json'))
counts={'pages':len(pages),'API_route_files':len(apis),'GET_route_files':len(getrows),'TSX_files':sum(p.suffix=='.tsx' for p in src),'unit_test_files':sum(p.name.endswith('.test.ts') for p in src),'e2e_specs':len(list((old/'tests/e2e').glob('*.spec.ts'))),'business_module_folders':len(list((old/'src/modules').iterdir())),'component_TSX_files':len(components),'API_literal_call_sites':len(callrows),'confirmed_GET_write_paths':sum(row['route'] in known for row in getrows),'SQL_migrations':len(list((old/'drizzle').glob('*.sql'))),'journal_entries':len(journal['entries'])}
git_start=subprocess.check_output(['git','status','--short','--branch'],cwd=old,text=True).strip()
commit=subprocess.check_output(['git','log','-1','--format=%h %s'],cwd=old,text=True).strip()
def fingerprint(root,paths):
 h=hashlib.sha256()
 for p in sorted(paths):
  h.update(p.relative_to(root).as_posix().encode());h.update(p.read_bytes())
 return h.hexdigest()
oldpaths=list(src)+[old/'package.json',old/'pnpm-lock.yaml',old/'playwright.config.ts',old/'vitest.config.ts']+list((old/'public').rglob('*'))
oldpaths=[p for p in oldpaths if p.is_file()]
newpaths=[p for p in (new/'src').rglob('*') if p.is_file()]+[new/n for n in ['package.json','pnpm-lock.yaml','svelte.config.js','vite.config.ts','vitest.config.ts','pnpm-workspace.yaml','tsconfig.json','README.md','.gitignore']]
oldhash=fingerprint(old,oldpaths);newhash=fingerprint(new,newpaths)
stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
report="""# SymphoWork V1: migration baseline and UI inventory

Status: static inventory verified in this task; proposed migration mappings and capture plans are not implementation. No browser screenshots, performance measurements, database checks, provider checks or original-app tests were performed.

## Evidence and scope

Original: C:/Users/nares/Symphowork_V1_NM. Svelte: C:/Users/nares/Symphowork_Svelte_V1. Only new documentation under the Svelte docs directory is written. Source, dependencies, configuration and lockfiles are preserved. No secret/local credential file contents were read, copied or written. Git reports branch naresh-dev, commit 2e4eecd and an untracked scratch/cookies.txt; only its filename/status was inspected. Preserve it and do not include it in fixtures or screenshots.

Read routes.csv for every original page mapped to a proposed Svelte route/component; api-routes.csv for every API file and methods; api-call-sites.csv for literal client API references and candidate page consumers including layouts. Component, role, asset, design-token and capture inventories complete the UI mapping. Counts and hashes are in inventory-metadata.json.

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
"""
plan="""# Comparable screenshot and performance baseline plan

Status: proposed procedure; no captures, browser sessions, requests or benchmarks were executed in this task. See capture-plan.csv for all 52 route plans and role requirements.

## Entry gate and environment manifest
Approve a dedicated isolated non-production reference database and synthetic fixtures before any original app execution. Supply organization A/B, all organization and platform role identities, inactive membership, expired session, assigned department-manager and object-owner/non-owner cases. Include realistic empty/small/paginated datasets, long names, missing optional fields, attachment scan states and concurrent mutations. Record fixture schema/version, commit, package-lock hashes, OS, Node/pnpm, production versus dev build, machine resources, browser revision, viewport/DPR, locale/timezone, deterministic clock, network/CPU profile and server latency conditions.
Do not put credentials, storageState, cookies, tokens, signed download links, response bodies containing PII, HAR headers or environment values into docs or version control. Existing real local cookie/credential files are excluded. Create test accounts/fixtures only under separately authorized procedures.
Use separate origins/ports and explicit server identity checks; never let reuseExistingServer silently point at production or an unrelated local service. Source app must remain unchanged. Do not start it against inherited environment configuration.

## Screenshot procedure
For each route, resolve the allowed-role list through source defaults plus API/service permissions, then validate each role and one denied role. Authentication pages use anonymous and defined authenticated redirect cases. Dynamic detail pages use deterministic IDs owned by A, another user in A, B, missing and malformed IDs as applicable. Compare each permitted branch, not just a convenient admin account.
Capture 390x844, 768x1024 and 1440x900 at DPR 1 plus both sides of relevant actual breakpoints; initial probes 639/640/641, 767/768/769 and 1023/1024/1025. Confirm computed CSS before declaring breakpoint coverage. Match scroll position, browser/OS fonts, Manrope availability, logo asset, locale/timezone and clock. Wait for document.fonts.ready, explicit content-ready selectors and animation stabilization; networkidle alone is unsuitable for polling/chat pages.
Capture whole page plus key regions (shell, header, nav, form, modal/table) and separate hover, focus, open dropdown, invalid input, pending, success, failure, empty and loading states where present. Use fixtures/interception for failure/loading visuals; intercepted requests provide UI evidence only, never security/contract proof.
Visual pilot: /login initial face, input focus and show/hide-password; no submit. Local flip/back states optional and must not issue mutations. Keep form submission APIs blocked. Preserve unmodified reference behavior; do not edit source to suppress side effects. For protected captures, approved isolated backend is required, and all GET write risks must be accounted for in fixture reset strategy.
Store reference and candidate images under a separately approved artifacts directory, with manifest entries route/role/state/viewport/build/fixture/clock. Store only synthetic evidence. No session state in image filenames or manifests. Use overlays, pixel diff heatmaps and Playwright toHaveScreenshot-style comparisons in a future test harness. This task installs no Playwright or screenshot library.
Provisional diff threshold: <=0.5% unmasked pixels at a documented per-pixel tolerance, with manual review of every changed region. Threshold is a starting proposal, not approval to hide differences. No missing controls, text clipping, unexpected scrollbars, changed navigation permissions, keyboard failures or meaningful layout shifts may pass regardless of pixel score. Mask only named nondeterministic regions with written reason, never whole business panels.

## Navigation and requests
Collect separate cold entry, warm client navigation and back/forward journeys: anonymous / -> /login; local auth transitions; approved employee overview -> directory -> attendance -> leave; HR employees -> detail -> departments -> approvals; finance expenses -> payroll -> payslips; recruiter jobs -> candidate -> intelligence; platform organizations -> detail -> provisioning.
For each, record click timestamp, URL/route commit and first stable usable content selector. Report p50/p75/p95 click-to-content and route-commit-to-content. Distinguish browser-history flips from real route loads and compare actual full reloads versus client navigations. Confirm content selector correctness instead of timing only URL changes.
Instrument browser request/response timing (queue/TTFB/download where observable), status, method, normalized endpoint, sanitized parameter shape, request count and transferSize/encodedBodySize. Separate page GETs, framework route-data requests, layout polling, preloads, assets and mutation follow-up reads. Count duplicate semantic requests inside a defined one-navigation window, distinguishing expected 30s polling from accidental duplicates.
Do not collect live raw auth headers/bodies. Match safe parameter shapes without tenant/user IDs. Do not enable caching across users/tenants. Hold cache state constant for comparison and test invalidation after writes only in approved fixtures.
Every GET begins UNREVIEWED. get-risk-register.csv blocks automatic retry, hover preload, benchmark replay and caching of conditional write paths. Review source call graph and isolated side-effect assertions before allowlisting. Notifications GET itself appears to read, but reminder creation elsewhere and unread polling affect observed state. Do not infer safety from status code or idempotency keys.
Svelte app.html currently has data-sveltekit-preload-data=hover; decide opt-out/allowlist policy BEFORE business load functions are added. Use server load for protected data only after request auth/tenant design approval. Parallelize only independent, authorized, reviewed reads; prevent layout/page double fetching and cancel stale filter/search results. Pagination/filter/search parity must precede query optimization.

## Mutation timing and data correctness (later gate only)
No mutation is issued now. In an approved resettable fixture environment, measure submit-to-pending feedback, request TTFB/total, commit-to-visible-success, reconciliation read count and resulting database invariants. Include duplicate click, timeout/unknown-commit outcome, permission loss, conflict and rollback cases. Inventory current HTTP status/response contracts before optimizing.
Never automatically replay payroll finalization/pay, invitations, provisioning, notifications, uploads or jobs. Require one workflow owner and approved idempotency semantics. Optimistic UI is optional and only for reversible operations with explicit rollback; do not use it to pretend a payroll/payment operation committed.

## Repetition, metrics and targets
Use production-like builds for acceptance; record local development runs separately. Warm up five iterations; collect at least 30 warm navigation/read samples per representative journey and 10 independent cold starts, reporting sample sizes and distribution. Randomize app order where safe and keep backend/resources/network equal. Larger samples are needed for stable tail estimates; 30 samples alone do not establish production p95.
Record LCP, CLS and interaction latency from lab traces; field INP requires approved real-user measurement over representative interactions and is NOT established by one Playwright click. Record layout shifts and long tasks as diagnostic evidence. No framework speedup is assumed.
Provisional acceptance proposal: no route/API p95 regression beyond 10% against the matched baseline and measurement noise; target >=20% faster p95 click-to-usable-content on specifically selected slow journeys; pending UI visible within 100ms; zero unexplained duplicate business reads per navigation; transferred bytes no greater than baseline for equivalent data. Finalize after baseline. LCP/INP/CLS budgets should be agreed using collected distributions and representative hardware; no values are measured here.
Database query time/count, transaction time and lock wait require approved isolated server instrumentation; browser TTFB is not query latency. Existing src/lib/perf.ts and sanitized db transaction DEBUG_PERF hooks are inspection candidates, not measured evidence and not enabled now.

## Exit gates per route/module
Require reviewed route + role + state inventory, source-reference screenshots, matching Svelte screenshots, responsive/keyboard/accessibility checks, API-contract tests, two-tenant/object denial, session/permission-change tests, no unexplained read side effects and agreed performance budgets. Test dialogs for focus trap/restore, Escape, scroll lock and screen reader naming; forms for labels/errors/pending/double-submit; tables for sort/filter/pagination and export scope.
Use source-default roles plus actual isolated permission fixtures. Test 401/403/404 behavior without leaking tenant data. Private downloads must preserve object ownership and malware-scan admission. Attach visual and trace evidence to each gate. No route is complete merely because it builds or matches a screenshot.
Keep Next authoritative until each gate passes. Cut over one route/feature behind reversible routing with compatible session policy; roll back routing to Next on authorization, data-integrity or regression failure. Backend/schema evolution and cleanup require separate approval. Preserve the original application.
"""
module_doc="""# Proposed module migration matrix

All orders and Svelte component names are recommendations, not migrated implementation. Exact routes/components/API candidates are in CSV files. Current UI complexity reflects static source structure; runtime workflows remain unverified.

| Area / routes | Representative UI / API dependencies | Security / reusable logic / required tests | Proposed order |
|---|---|---|---|
| Shared design and shells | Root tokens/Manrope/assets; AppShell, PlatformShell, SidebarNav, MobileNav, Breadcrumb, notification/logout/reminder controls | React/Next rewrite; preserve role visibility, keyboard, reduced motion; shell includes side-effecting GETs; pure nav-utils may adapt | Before protected routes; only after pilot inventory |
| Public/auth /, /login, /register, /forgot-password, /reset-password, /verify-email, /change-password, /invitations/accept | AuthFlipView, AuthCard, HUDs, form states; /api/auth/* and platform login API | High auth sensitivity; Zod/password policy candidates with server-only boundary; expiry/single-use/session tests; visual pilot does not migrate authentication | First visual pilot /login; functional auth requires dedicated gate |
| Tenancy/RBAC | /app layout + all protected APIs; role/permission constants | Request locals, active membership/org, platform separation; reuse policy semantics but replace next/headers/cache; two orgs plus restricted DB role | Prerequisite for all protected Svelte pages |
| Platform governance /platform/* | Role console; organization list/detail/new wizard, plans/subscriptions, usage, support, audit, features/configuration, health/provisioning | High complexity and privileged writes; platform authorization computed sets; single invitation/provisioning owner; permission matrix and denied-role/target-org tests | Late, after organization modules |
| Overview /app | Shared role-filtered Overview cards and direct DB/service metrics | Employee/approval/ATS permission branches; data-scope/count tests; unread/reminder shell behavior; no separate HR URL | After shell/auth and safe reads |
| Employees/profile/directory /app/employees*, /app/profile, /app/directory | Workforce table, onboarding wizard, employee detail/edit/invite/checklist, self form; employees/me/directory APIs plus server DB reads | Tenant/object/owner protection; employment-type GET seeds, employee ensure reads; reusable validation/lifecycle rules; owner protection/invitation tests | Directory read candidate second; employee writes later |
| Departments /app/departments* | List metrics/date filters, detail/team dialogs/deletion checks; department/master-data APIs | Assigned manager, eligible leads/managers, team scope and deletion dependencies; reusable validation; permissions/scope/filter/deletion tests | After protected read pilot |
| Attendance /app/attendance | Personal/organization dashboards, punch/break/shift/regularization/reminder; attendance/master-data APIs | Date/timezone/overnight/DST and authorization; GET updates/reminders; calculator/types reusable with regression vectors; clock and idempotency tests | Workflow phase; resolve GET ownership first |
| Leave/approvals /app/leave, /app/approvals | Leave application/balances; approval inbox/actions; leave/workflow/approval APIs | Employee ensure GET, manager/team scope, approval transition races; calculators/policies reusable; cross-org approval denial and concurrent action tests | After employee/attendance context |
| Expenses /app/expenses* | Claim dashboard/detail/items/receipt/upload/submit; expense/category/document APIs | Private files, object scope, state transitions; employee ensure reads; calculator/policy candidates; duplicate submit/refund/ownership tests | Workflow phase after approvals/files |
| Payroll/payslips /app/payroll* | Tabs/config/profiles/periods/runs/calculate/review/finalize/pay; payslip list and download | Highest financial integrity; immutable finalization, rounding/effective dates/leave clipping; calculators reusable; single owner/transaction/idempotency tests; payslip GET can ensure employee | Late, after attendance/leave/expenses verified |
| Documents/private files /app/documents | Upload/type/status/verification/download components and document APIs | Fail-closed malware, private auth, size/type/content hash and scan races; upload-admission validation candidate; isolation/download tests | Before any module with file workflows |
| Notifications/reports /app/notifications, /app/reports | Center/preferences/read marks; report charts/filters/exports; notification/report APIs and shell polling | Recipient/tenant filtering; mark-read mutations; report permission/export scope and date consistency; side-effect ownership | Reads after shell; writes after contracts |
| Projects/tasks /app/work | CollaborationWorkspace, projects/tasks/forms/status/filter/comment/dependency controls | Project visibility/member assignment, cross-org object scope; project reads can ensure employee; policy/cycle checks reusable; object access/cycle tests | After core workflow/auth |
| Internal chat /app/chat | Sidebar/thread/search/groups/direct dialogs, reactions/read/presence/typing, attachments, voice/audio and message-to-task | Complex polling/concurrency; conditional employee setup reads; private membership/media download; microphone Permissions-Policy conflict; file validation/typing/policy candidates; member denial/read receipts/keyboard tests | Late after files/projects |
| ATS/recruitment /app/recruitment*, /jobs/[slug]* | Jobs/requisitions/candidate pipeline/interviews/feedback, intelligence/resume review, public consent upload | Tenant access, public rate limits/consent, private resumes, parser/provider boundaries; normalizer/matching/policies reusable; transition/provider-failure/malware/permission tests | Late after files/auth; public views separately gated |
| Billing/settings /app/settings*, workflows | Master data/shifts/working-days and workflow config; billing overview | Admin permissions/effective changes; employment-types GET seeds; provider fail/error states; validation/policies reusable; settings isolation and billing contract tests | After relevant core module; billing provider cutover separately |
"""
commands="""# Evidence, commands and limitations

This task ran static/read-only inspection commands from the two stated workspace roots, then one Python documentation generator writing only new docs files. No application modules were imported or executed.

Original workspace:
- Get-Location
- git status --short --branch
- git log -1 --format='%h %s'
- rg --files with source/component/module/test paths and exclusions for environment/credential/cookie files
- rg --files -g AGENTS.md and ancestor AGENTS.md existence checks
- Get-Content package.json, source layouts/pages/components/CSS, middleware, identity/tenant/platform authorization, db/client.ts, selected API routes and provider interfaces; only source configuration names were examined, not local environment values
- Get-ChildItem public -Recurse -File (names only); Get-ChildItem drizzle -Recurse -File (names only)
- Get-Content drizzle/meta/_journal.json
- rg -n for authorization/cache/transaction symbols, GET write/helper calls, API references, client effects/polling, providers and role keys
- python --version -> Python 3.13.1
- Inline Python static scans of all allowed source files: route/API/TSX/test/module counts; page imports/guards; GET method slices and helper calls; auth/shell/pilot evidence with source line references
- Final git status/log read-only checks; original source/config/lock hashes compared before/after docs generation

Svelte workspace:
- Get-ChildItem -Force (names only)
- rg --files src docs; docs did not exist initially (that rg command reported missing path; no file overwrite)
- Get-Content package.json, README.md, src/routes/+page.svelte, +layout.svelte, +error.svelte, src/lib/NavigationStatus.svelte, src/app.css, src/app.html, vite.config.ts, vitest.config.ts, svelte.config.js, .gitignore
- Get-FileHash pnpm-lock.yaml -Algorithm SHA256 -> 27F9453B3ECED2C8C8938118D46E4DBF6D40E3DF85068BE36F15CF1EB6F1572F
- pnpm list --depth 0 -> exit 0, 12 declared/installed direct dev dependencies matched the report
- Ancestor AGENTS.md checks returned no applicable files
- Inline Python generator: pathlib.read_text/read_bytes for approved code/manifests/lock/journal; regular expressions for imports, exported HTTP methods, API literals and interaction cues; recursive local UI-import closure; csv/json output; documentation files opened in exclusive-create mode; before/after SHA256 rollups compared
- Final Python validation: CSV row counts, all 52 unique source routes and 131 unique API routes present, API/method inventories and report references checked; no original or Svelte source/config/lock mismatch
- No current-task pnpm check/test/build/audit/dev/start; prior successful foundation-check output is explicitly labelled prior-session evidence in the report.

Some broad Get-Content/rg outputs were truncated by tool output limits; focused Python/regex summaries and full static inventory extraction were used to cover counts and files. An initial GET-summary scanner failed with TypeError (list-minus-set) after printing page inventory; later scanner/generator corrected it. This was an inspection-tool error and did not execute application code or modify either app.

Reproducible inspection commands (PowerShell):
    Set-Location 'C:/Users/nares/Symphowork_V1_NM'
    git status --short --branch
    git log -1 --format='%h %s'
    rg --files src/app -g page.tsx
    rg --files src/app/api -g route.ts
    rg -n 'getOrEnsureEmployeeForUser|checkAndEnsureAttendanceReminder' src -g '*.ts' -g '*.tsx' -g '!*.test.ts'
    Set-Location 'C:/Users/nares/Symphowork_Svelte_V1'
    pnpm list --depth 0
    Get-FileHash pnpm-lock.yaml -Algorithm SHA256

Do not run original tests/build/browser config as a supposedly read-only check: tsc/build/test tools may create output, load environment/configuration, start services or contact configured infrastructure. Current task does not authorize database/provider calls or UI mutation requests.

Parsing limitations: regex inventories are source evidence, not TypeScript AST/dataflow proof. Permission columns list direct calls/literals and platform keys, not full transitive authorization. Graph edges include conditional/hidden UI trees and layouts, so one page may have many potential API references without actually fetching them. Dynamic resource URLs can match several endpoint candidates. Generic backend functions or API-only endpoints may have no UI caller. Exported method slicing is lexical, not a formal proof that no helper can write; all unreviewed GETs stay blocked for automation. Counts exclude tests/e2e as application routes. Proposed components preserve source filenames but do not decide final Svelte composition.
"""
outputs={
'baseline-report.md':report,
'baseline-validation-plan.md':plan,
'module-matrix.md':module_doc,
'evidence-and-commands.md':commands
}
csvs={
'routes.csv':routerows,'api-routes.csv':apirows,'api-call-sites.csv':callrows,
'components.csv':comprows,'design-tokens.csv':tokens,'assets.csv':assets,
'roles.csv':roles,'capture-plan.csv':capturerows,'get-risk-register.csv':getrows}
metadata={'generated_at_utc':stamp,'scope':'static inspection; no runtime services, tests, audit or browser executed in this task','counts':counts,'original_git_status':git_start,'original_latest_commit':commit,'original_package_manifest':oldpkg,'svelte_package_manifest':newpkg,'original_inspected_files_sha256_rollup':oldhash,'svelte_application_files_sha256_rollup':newhash,'svelte_lockfile_sha256':hashlib.sha256((new/'pnpm-lock.yaml').read_bytes()).hexdigest(),'source_verification':'before/after fingerprints must match; documentation files excluded','algorithm':'regex-based imports/methods/literals plus recursive local UI imports; unknowns labelled; not AST/runtime proof','migration_ownership':'proposed route/component maps only; retain original API authority'}
names=list(outputs)+list(csvs)+['inventory-metadata.json']
metadata['documentation_files']=names+['generate-inventory.py']
if docs.exists() and any((docs/n).exists() for n in names):raise RuntimeError('Documentation filename exists; no overwrites permitted')
docs.mkdir(exist_ok=True)
for n,s in outputs.items():
 with (docs/n).open('x',encoding='utf-8',newline='\n') as f:f.write(s)
for n,rows in csvs.items():
 assert rows,n
 with (docs/n).open('x',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
assert len(set(r['original_route'] for r in routerows))==52
assert len(set(r['route'] for r in apirows))==131
assert all('GET' in bodies(src[next(p for p in apis if route(p)==r['route'])]) for r in getrows)
assert fingerprint(old,oldpaths)==oldhash,'Original files changed'
assert fingerprint(new,newpaths)==newhash,'Svelte app files changed'
git_end=subprocess.check_output(['git','status','--short','--branch'],cwd=old,text=True).strip()
assert git_end==git_start,'Original Git status changed'
metadata['source_verification']='PASS: before/after fingerprints match for inspected original files and Svelte application files; original git status unchanged'
with (docs/'inventory-metadata.json').open('x',encoding='utf-8') as f:json.dump(metadata,f,indent=2)
print(json.dumps({'counts':counts,'files_created':names,'source_and_git_preservation':'PASS','csv_rows':{n:len(v) for n,v in csvs.items()}},indent=2))
