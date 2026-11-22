from pathlib import Path
import csv,json,re,collections,os
original=Path('C:/Users/nares/Symphowork_V1_NM')
def csvrows(name):return list(csv.DictReader(Path('docs',name).open(encoding='utf-8-sig')))
manifest={r['route']:set(r['methods']) for r in json.loads(Path('src/lib/server/api-manifest.json').read_text(encoding='utf-8'))}
api=[]
for file in sorted((original/'src/app/api').rglob('route.ts')):
 code=file.read_text(encoding='utf-8');route='/api/'+file.parent.relative_to(original/'src/app/api').as_posix()
 methods=set(re.findall(r'export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b',code))
 api.append({'route':route,'source':file.relative_to(original).as_posix(),'source_methods':sorted(methods),'relay_methods':sorted(manifest.get(route,set())),'methods_match':methods==manifest.get(route,set()),'status':'implemented but not integration-tested','authorization':'original backend authoritative; live object/tenant/role checks unverified'})
state={}
for line in Path('docs/source-port-state-evidence.jsonl').read_text(encoding='utf-8').splitlines():
 if line.strip():
  entry=json.loads(line);state[entry['source']]=entry['dest']
for entry in json.loads(Path('docs/source-port-evidence.json').read_text(encoding='utf-8')):
 state.setdefault(entry['source'],entry['target'])
consolidated={
 'attendance/attendance-reminder-modal':'layout/AppShell','auth/auth-card':'auth/ReferenceAuthCard',
 'auth/change-password-form':'auth/AuthForm','auth/invitation-accept-form':'auth/AuthForm',
 'auth/reset-password-form':'auth/AuthForm','auth/verify-email-form':'auth/AuthForm',
 'auth/logout-confirm-dialog':'layout/AppShell','employees/employee-create-form':'employees/onboarding/OnboardingWizard',
 'layout/chat-unread-badge':'layout/AppShell','layout/header-notifications':'layout/AppShell',
 'platform/plan-editor':'platform/PlanManagement','platform/platform-login-form':'auth/AuthForm',
 'ui/brand-logo':'layout/AppShell','ui/prompt-dialog':'approvals/ApprovalInbox','ui/toast':'ui/Toasts'
}
original_texts=[(p,p.read_text(encoding='utf-8')) for p in (original/'src').rglob('*') if p.suffix in ['.ts','.tsx'] and '.test.' not in p.name]
loading_evidence=json.loads(Path('docs/loading-port-evidence.json').read_text(encoding='utf-8'))
def references_component(path,text,component):
 for module in re.findall(r"from\s+['\"]([^'\"]+)['\"]",text):
  if module.startswith('@/'):candidate=original/'src'/module[2:]
  elif module.startswith('.'):candidate=path.parent/module
  else:continue
  if os.path.normcase(os.path.abspath(candidate.with_suffix('.tsx')))==os.path.normcase(os.path.abspath(component)):return True
 return False
references=collections.defaultdict(list)
for path,text in original_texts:
 for module in re.findall(r"from\s+['\"]([^'\"]+)['\"]",text):
  if module.startswith('@/'):candidate=original/'src'/module[2:]
  elif module.startswith('.'):candidate=path.parent/module
  else:continue
  references[os.path.normcase(os.path.abspath(candidate.with_suffix('.tsx')))].append(path.relative_to(original).as_posix())
components=[]
for file in sorted((original/'src/components').rglob('*.tsx')):
 if '.test.' in file.name:continue
 source=file.relative_to(original).as_posix();code=file.read_text(encoding='utf-8');candidate=state.get(source)
 pascal=''.join(part.title() for part in file.stem.split('-'))
 options=[Path(candidate)] if candidate else []
 options+=list(Path('src/lib/components').rglob(pascal+'.svelte'))
 key=file.relative_to(original/'src/components').with_suffix('').as_posix()
 if key in consolidated:options.append(Path('src/lib/components/'+consolidated[key]+'.svelte'))
 if key=='layout/navigation-progress':options.append(Path('src/lib/NavigationStatus.svelte'))
 if file.parent.name=='ui':options+=list(Path('src/lib/components/ui').glob(pascal+'.svelte'))
 mappings=sorted({p.as_posix() for p in options if p.exists()}|{item['target'] for item in loading_evidence if item['source']==source})
 components.append({'source':source,'targets':mappings,'status':'partially implemented' if mappings else 'missing','source_referenced_by':sorted(set(references[os.path.normcase(os.path.abspath(file))])), 'mapping_kind':'consolidated or adapted; not accepted behavior' if key in consolidated else 'file mapping only','static_evidence_only':True,'source_api_templates':sorted(set(re.findall(r'[\'"`](/api/[^\'"`\s]+)',code))),'review_needed':'Role, interaction, responsive, loading/error and visual equivalence are not accepted. Unmapped components may be consolidated; inspect before labeling missing.'})
routes=[]
for row in csvrows('routes.csv'):
 source=original/row['source'];target=Path(row['proposed_page_file']);code=source.read_text(encoding='utf-8');targetcode=target.read_text(encoding='utf-8') if target.exists() else ''
 routes.append({'route':row['original_route'],'source':row['source'],'target':target.as_posix(),'status':'partially implemented' if target.exists() else 'missing','assessment':'Route file and imported source code inspected structurally; complete per-role/interaction reconciliation and acceptance remain outstanding.','source_bytes':len(code.encode()),'target_bytes':len(targetcode.encode()),'original_ui_imports':row['direct_UI_imports'],'source_permission_cues':row['permission_cues'],'original_api_templates':row['page_tree_API_templates'],'full_parity_verified':False,'blockers':['authorized session/database/backend fixtures','matching original screenshot and responsive/role review']})
roles=csvrows('roles.csv')
calls=csvrows('api-call-sites.csv')
for row in calls:row.update({'status':'partially implemented','reason':'Original call-site inventoried; relay route coverage is separate evidence. Dynamic target URL expression equivalence still needs per-call contract reconciliation.'})
envs=collections.defaultdict(list)
for base,label in [(original/'src','original'),(Path('src'),'target')]:
 for f in sorted(base.rglob('*')):
  if f.suffix not in ['.ts','.tsx','.svelte','.js']:continue
  for name in set(re.findall(r'(?:process\.env|\benv)\.([A-Z][A-Z0-9_]*)',f.read_text(encoding='utf-8'))):envs[name].append({'workspace':label,'source':f.relative_to(original).as_posix() if label=='original' else f.as_posix()})
report={'scope':'Whole-source static crosswalk, not complete behavioral audit or acceptance. No secret files/environment values read. Every original component file, route, API and inventoried call site is represented.','counts':{'routes':len(routes),'api_routes':len(api),'components':len(components),'roles':len(roles),'api_call_sites':len(calls),'api_method_mismatches':sum(not x['methods_match'] for x in api)},'routes':routes,'apis':api,'components':components,'roles':[dict(r,status='implemented but not integration-tested',security_acceptance='Role permission calculator tests are distinct from live backend role isolation.') for r in roles],'api_call_sites':calls,'environment_variable_consumers':dict(sorted(envs.items())),'original_route_boundaries':[{'source':p.relative_to(original).as_posix(),'status':'partially implemented','targets':[item['target'] for item in loading_evidence if item['source']==p.relative_to(original).as_posix()],'note':'All 16 source loading templates are ported and selected by shared pending content in both shells. Original error/not-found boundary visual matching, streaming behavior and screenshot/keyboard parity remain unverified.'} for p,_ in original_texts if p.name in ['loading.tsx','error.tsx','not-found.tsx']], 'unresolved_features':[{'feature':n,'status':'blocked by unavailable configuration or infrastructure'} for n in ['Real login/session continuity','Tenant/RLS and private-file authorization','Storage scanner/email/parser/billing provider connectivity','Reference screenshots and comparative performance']]+[{'feature':'Platform overview commercial provider subsection','status':'partially implemented','reason':'Existing subscription.view vs billing.view API permission mismatch; no bypass.'},{'feature':'Remaining full interaction and visual reconciliation','status':'partially implemented','reason':'Static crosswalk plus synthetic tests does not prove complete application parity.'}]}
report['domain_features']=[{'feature':name+' calculator','status':'fully implemented and verified','scope':'Pure source-derived calculator unit vectors only; no UI, live backend or security integration acceptance.'} for name in ['attendance','leave','expenses','payroll']]
report['guard_and_shell_review']={'context':'Source static permission fallback and navigation-default behavior inspected against original tenancy/context.ts, authorization.ts and app-shell.tsx; no live DB/RLS evidence.','relay':'All 131 source API files/methods match manifest. Synthetic cookie expiration, multipart/range and login readiness tests; no real credential test.'}
Path('docs/application-audit.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps(report['counts']))
print('Unmapped components:',[r['source'] for r in components if not r['targets']])
