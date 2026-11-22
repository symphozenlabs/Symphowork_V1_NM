import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const sourceRoot='C:/Users/nares/Symphowork_V1_NM';
const targetRoot='C:/Users/nares/Symphowork_Svelte_V1';
const mappings = {
 Card:'ui/Card', CardHeader:'ui/CardHeader', CardContent:'ui/CardContent',CardTitle:'ui/CardTitle',CardDescription:'ui/CardDescription',CardFooter:'ui/CardFooter',
 Badge:'ui/Badge',Button:'ui/Button',Reveal:'ui/Reveal',EnterpriseJourneyMap:'journey/EnterpriseJourneyMap',
 LeaveApplicationForm:'leave/LeaveApplicationForm',NotificationCenter:'notifications/NotificationCenter',DocumentCenter:'documents/DocumentCenter',ApprovalInbox:'approvals/ApprovalInbox',
 WorkflowSettings:'workflows/WorkflowSettings',CollaborationWorkspace:'collaboration/CollaborationWorkspace',BillingOverview:'billing/BillingOverview',ReportDashboard:'reports/ReportDashboard',CompanyDirectoryView:'employees/CompanyDirectoryView',WorkforceDirectoryTable:'employees/WorkforceDirectoryTable',EmployeeInvitationActions:'employees/EmployeeInvitationActions',Input:'ui/Input',BarList:'reports/BarList',ConfirmDialog:'ui/ConfirmDialog',ExpenseDetail:'expenses/ExpenseDetail',SelfProfileForm:'employees/SelfProfileForm',OnboardingChecklist:'employees/OnboardingChecklist',EditEmployeeDialog:'employees/EditEmployeeDialog',ExpenseDashboard:'expenses/ExpenseDashboard',SidebarNav:'layout/SidebarNav',MobileNav:'layout/MobileNav',Breadcrumb:'layout/Breadcrumb',LogoutButton:'layout/LogoutButton',ConfigurationEditor:'platform/ConfigurationEditor',FeatureFlagToggle:'platform/FeatureFlagToggle',PlatformUserList:'platform/PlatformUserList',SubscriptionManagement:'platform/SubscriptionManagement',UsageManagement:'platform/UsageManagement',PlatformAuditList:'platform/PlatformAuditList',PayslipList:'payroll/PayslipList',PayrollDashboard:'payroll/PayrollDashboard',DialogFrame:'ui/DialogFrame',ShiftFormDialog:'settings/ShiftFormDialog',MasterDataEditDialog:'settings/MasterDataEditDialog',MasterDataManager:'settings/MasterDataManager',CustomSelect:'ui/CustomSelect',DepartmentListTable:'departments/DepartmentListTable',DepartmentCreateDialog:'departments/DepartmentCreateDialog',DepartmentDetailsView:'departments/DepartmentDetailsView',DepartmentDeleteDialog:'departments/DepartmentDeleteDialog',DepartmentTeamDialog:'departments/DepartmentTeamDialog',DepartmentTeamDeleteDialog:'departments/DepartmentTeamDeleteDialog',OnboardingWizard:'employees/onboarding/OnboardingWizard',OnboardingVerticalStepNav:'employees/onboarding/OnboardingVerticalStepNav',OnboardingCompactStepProgress:'employees/onboarding/OnboardingCompactStepProgress',Step1RoleSelection:'employees/onboarding/Step1RoleSelection',Step2RoleDetails:'employees/onboarding/Step2RoleDetails',Step3ReviewConfirm:'employees/onboarding/Step3ReviewConfirm',Step4ProfileCreated:'employees/onboarding/Step4ProfileCreated',Step5InvitationStatus:'employees/onboarding/Step5InvitationStatus',RoleIllustration:'employees/onboarding/RoleIllustration',AuthFlipView:'auth/AuthFlipView',LoginForm:'auth/LoginForm',RegisterForm:'auth/RegisterForm',ForgotPasswordForm:'auth/ForgotPasswordForm',AuthCommandCanvas:'auth/AuthCommandCanvas',WorkforceNetworkHud:'hud/WorkforceNetworkHud',SupportOrganizationList:'platform/SupportOrganizationList',AttendanceViewContainer:'attendance/AttendanceViewContainer',AttendanceActions:'attendance/AttendanceActions',RegularizationPanel:'attendance/RegularizationPanel',OrganizationAttendanceDashboard:'attendance/OrganizationAttendanceDashboard'
};
Object.assign(mappings,{
 ChatWorkspace:'chat/ChatWorkspace',ChatHeader:'chat/ChatHeader',ChatThread:'chat/ChatThread',ConversationSidebar:'chat/ConversationSidebar',NewDirectChatDialog:'chat/NewDirectChatDialog',NewGroupChatDialog:'chat/NewGroupChatDialog',MessageToTaskDialog:'chat/MessageToTaskDialog',ChatProfileModal:'chat/ChatProfileModal',ChatSearchDialog:'chat/ChatSearchDialog',MessageList:'chat/MessageList',MessageBubble:'chat/MessageBubble',ConversationListItem:'chat/ConversationListItem',ChatInputBar:'chat/ChatInputBar',VoiceRecorder:'chat/VoiceRecorder',AudioPlayer:'chat/AudioPlayer',EmojiPicker:'chat/EmojiPicker',ImageLightboxModal:'chat/ImageLightboxModal',
 AtsDashboard:'ats/AtsDashboard',AtsInterviewPanel:'ats/AtsInterviewPanel',RecruiterIntelligenceSearch:'ats/RecruiterIntelligenceSearch',ResumeIntelligencePanel:'ats/ResumeIntelligencePanel',CardShell:'ats/CardShell',
 OrganizationListTable:'platform/OrganizationListTable',OrganizationCreateDialog:'platform/OrganizationCreateDialog',OrganizationCreateForm:'platform/OrganizationCreateForm',OrganizationStatusActions:'platform/OrganizationStatusActions',OrganizationInvitationActions:'platform/OrganizationInvitationActions',OrganizationSupportNotes:'platform/OrganizationSupportNotes',OrganizationCreateWizard:'platform/OrganizationCreateWizard',PlanManagement:'platform/PlanManagement',FeatureEditor:'platform/FeatureEditor',ProvisioningManager:'platform/ProvisioningManager',ProvisioningJobActions:'platform/ProvisioningJobActions',ProvisioningProgressModal:'platform/ProvisioningProgressModal'
 ,VerticalStepNav:'platform/VerticalStepNav',CompactStepProgress:'platform/CompactStepProgress',WizardStepOrganization:'platform/WizardStepOrganization',WizardStepContactAddress:'platform/WizardStepContactAddress',WizardStepOwner:'platform/WizardStepOwner',WizardStepPlan:'platform/WizardStepPlan',WizardStepRegional:'platform/WizardStepRegional',WizardStepReview:'platform/WizardStepReview'
});
const sourceRelative=process.argv[2], destination=process.argv[3];
if(!sourceRelative||!destination||!['src/routes/','src/lib/components/'].some(p=>destination.startsWith(p))) throw Error('Expected explicit original source and target');
const text=fs.readFileSync(path.join(sourceRoot,sourceRelative),'utf8');
const file=ts.createSourceFile(sourceRelative,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const iconNames=new Set(); const used=new Set();
for(const n of file.statements) if(ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='lucide-react') for(const e of n.importClause?.namedBindings?.elements??[]) iconNames.add(e.name.text);
const expr=n=>(n?.getText(file)??'').replace(/\bicon:\s*(\w+)/g,(text,name)=>iconNames.has(name)?'icon: "'+name+'"':text);
function tagName(n){return expr(n);}
function renderStatements(stmts){if(!stmts.length)return '';const[st,...rest]=stmts;if(ts.isReturnStatement(st))return render(st.expression);if(ts.isVariableStatement(st))return st.declarationList.declarations.map(v=>'{@const '+expr(v.name)+' = '+expr(v.initializer)+'}').join('')+renderStatements(rest);if(ts.isIfStatement(st)){const branch=node=>node?ts.isBlock(node)?[...node.statements]:[node]:[];return '{#if '+expr(st.expression)+'}'+renderStatements([...branch(st.thenStatement),...rest])+'{:else}'+renderStatements([...branch(st.elseStatement),...rest])+'{/if}';}throw Error('Map statement requires review: '+expr(st).slice(0,90));}
function containsReturn(n){if(ts.isReturnStatement(n))return true;let found=false;ts.forEachChild(n,c=>{if(containsReturn(c))found=true;});return found;}
function render(n){
 if(!n)return '';
 if(ts.isParenthesizedExpression(n))return render(n.expression);
 if(ts.isJsxText(n)) return n.text;
 if(ts.isJsxFragment(n))return n.children.map(render).join('');
 if(ts.isJsxExpression(n))return render(n.expression);
 if(ts.isIdentifier(n)&&['children','footer'].includes(n.text))return '{@render '+n.text+'?.()}';
 if(ts.isConditionalExpression(n))return '{#if '+expr(n.condition)+'}'+render(n.whenTrue)+'{:else}'+render(n.whenFalse)+'{/if}';
 if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken)return '{#if '+expr(n.left)+'}'+render(n.right)+'{/if}';
 if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='map'){
  const fn=n.arguments[0];if(!ts.isArrowFunction(fn))throw Error('Unsupported map');
  let body=fn.body,pre='';
  if(ts.isBlock(body)&&body.statements.some(st=>ts.isIfStatement(st)&&containsReturn(st)))return '{#each '+expr(n.expression.expression)+' as '+fn.parameters.map(p=>expr(p.name)).join(', ')+'}'+renderStatements([...body.statements])+'{/each}';
  if(ts.isBlock(body)){
   const before=body.statements.filter(st=>!ts.isReturnStatement(st));
   if(before.some(st=>!ts.isVariableStatement(st))){const names=before.filter(ts.isVariableStatement).flatMap(st=>st.declarationList.declarations.map(v=>expr(v.name)));pre='{@const {'+names.join(',')+'} = (()=>{'+before.map(expr).join('\n')+';return {'+names.join(',')+'};})()}';}
   else for(const st of before)for(const v of st.declarationList.declarations)pre+='{@const '+expr(v.name)+' = '+expr(v.initializer)+'}';
   body=body.statements.find(ts.isReturnStatement)?.expression;
  }
  return '{#each '+expr(n.expression.expression)+' as '+fn.parameters.map(p=>expr(p.name)).join(', ')+'}'+pre+render(body)+'{/each}';
 }
 if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){
  const opening=ts.isJsxElement(n)?n.openingElement:n;
  const original=tagName(opening.tagName);let tag=original,extra='';
  if(original==='React.Fragment')return n.children.map(render).join('');
  if(original==='Dialog.Root'){used.add('DialogFrame');return '<DialogFrame'+attributes(opening.attributes)+'>'+n.children.map(render).join('')+'</DialogFrame>';}
  if(original==='Dialog.Portal')return n.children.map(render).join('');
  if(original==='Dialog.Overlay')return '';
  if(original==='Dialog.Close')return n.children.map(render).join('');
  if(original==='Dialog.Content')return '<div'+attributes(opening.attributes)+'>'+n.children.map(render).join('')+'</div>';
  if(original==='Dialog.Title')return '<h2'+attributes(opening.attributes)+'>'+n.children.map(render).join('')+'</h2>';
  if(original==='Dialog.Description')return '<p'+attributes(opening.attributes)+'>'+n.children.map(render).join('')+'</p>';
  if(original==='Suspense')return n.children.map(render).join('');
  if(original==='Link')tag='a';else if(original==='Image')tag='img';
  else if(iconNames.has(original)){tag='SvgIcon';extra=' name="'+original+'"';}
  else if(original==='Icon'||original==='StatusIcon'||original.endsWith('.icon')){tag='SvgIcon';extra=' name={'+original+'}';}
  else if(mappings[original])used.add(original);
  else if(/^[A-Z]/.test(original))throw Error('Unknown component '+original);
  const asChild=opening.attributes.properties.some(a=>ts.isJsxAttribute(a)&&expr(a.name)==='asChild');
  if(original==='Button'&&asChild){
   used.delete('Button');used.add('LinkButton');
   const child=n.children?.find(c=>ts.isJsxElement(c));if(!child)throw Error('asChild without element');
   const attrs=attributes(opening.attributes,true);
   return '<LinkButton'+attrs+attributes(child.openingElement.attributes)+'>'+child.children.map(render).join('')+'</LinkButton>';
  }
  const snippets=opening.attributes.properties.filter(a=>ts.isJsxAttribute(a)&&a.initializer&&ts.isJsxExpression(a.initializer)&&(ts.isJsxElement(a.initializer.expression)||ts.isJsxFragment(a.initializer.expression))).map(a=>'{#snippet '+expr(a.name)+'()}'+render(a.initializer.expression)+'{/snippet}').join('');
  const attrs=attributes(opening.attributes,false,!/^[a-z]/.test(tag)&&!['Button','Input','LinkButton','SvgIcon'].includes(tag));
  if(snippets)return '<'+tag+extra+attrs+'>'+snippets+(n.children?.map(render).join('')??'')+'</'+tag+'>';
  if(ts.isJsxSelfClosingElement(n))return /^[a-z]/.test(tag)&&!['img','input','br','hr','meta','link','area','source','wbr'].includes(tag)?'<'+tag+extra+attrs+'></'+tag+'>':'<'+tag+extra+attrs+' />';
  return '<'+tag+extra+attrs+'>'+n.children.map(render).join('')+'</'+tag+'>';
 }
 if(n.kind===ts.SyntaxKind.NullKeyword||n.kind===ts.SyntaxKind.FalseKeyword)return '';
 if(ts.isObjectLiteralExpression(n))throw Error('Object child unsupported');
 return '{'+expr(n)+'}';
}
function attributes(node,skipAsChild=false,customEvents=false){
 let out='';
 for(const a of node.properties){
  if(ts.isJsxSpreadAttribute(a)){out+=' {...'+expr(a.expression)+'}';continue;}
  let name=expr(a.name);
  if(['key','priority','asChild','onPointerDownOutside','onEscapeKeyDown'].includes(name))continue;
  if(name==='ref'){out+=' bind:this={'+expr(a.initializer.expression)+'.current}';continue;}
  name=customEvents&&/^on[A-Z]/.test(name)?name:({className:'class',stopColor:'stop-color',stopOpacity:'stop-opacity',strokeDasharray:'stroke-dasharray',strokeDashoffset:'stroke-dashoffset',htmlFor:'for',strokeWidth:'stroke-width',strokeLinecap:'stroke-linecap',strokeLinejoin:'stroke-linejoin',fillRule:'fill-rule',clipRule:'clip-rule',tabIndex:'tabindex',colSpan:'colspan',onClick:'onclick',onSubmit:'onsubmit',onChange:'onchange',onInput:'oninput'})[name]??name;
  if(['onMouseEnter','onMouseLeave','onPointerDown','onFocus','onBlur','onKeyDown','onKeyUp','onScroll','onDragOver','onDrop'].includes(name))name=name.toLowerCase();
  const v=a.initializer;
  if(v&&ts.isJsxExpression(v)&&(ts.isJsxElement(v.expression)||ts.isJsxFragment(v.expression)))continue;
  if(name==='style'&&v&&ts.isJsxExpression(v)&&ts.isObjectLiteralExpression(v.expression)){
   for(const prop of v.expression.properties)out+=' style:'+expr(prop.name).replace(/[A-Z]/g,x=>'-'+x.toLowerCase())+'={'+expr(prop.initializer)+'}';
  }else if(!v)out+=' '+name;
  else if(ts.isStringLiteral(v))out+=' '+name+'='+JSON.stringify(v.text);
  else if(ts.isJsxExpression(v))out+=' '+name+'={'+expr(v.expression).replaceAll('event.target.value','event.currentTarget.value')+'}';
 }
 return out;
}
Object.assign(mappings,{Skeleton:'ui/Skeleton',PageHeaderSkeleton:'ui/PageHeaderSkeleton',KpiGridSkeleton:'ui/KpiGridSkeleton',TableCardSkeleton:'ui/TableCardSkeleton',CardGridSkeleton:'ui/CardGridSkeleton',BrandedLoader:'ui/BrandedLoader'});
const main=file.statements.find(n=>ts.isFunctionDeclaration(n)&&(process.argv[4]?n.name?.text===process.argv[4]:n.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword)));
if(!main)throw Error('No default page function');
const ret=main.body.statements.find(ts.isReturnStatement);if(!ret)throw Error('No top-level JSX return');
let markup=render(ret.expression);
for(const st of [...main.body.statements].slice(0,main.body.statements.indexOf(ret)).reverse())if(ts.isIfStatement(st)){const branch=ts.isBlock(st.thenStatement)?st.thenStatement.statements.find(ts.isReturnStatement):ts.isReturnStatement(st.thenStatement)?st.thenStatement:null;if(branch)markup='{#if '+expr(st.expression)+'}'+render(branch.expression)+'{:else}'+markup+'{/if}';}
const declarations=[];
for(const st of main.body.statements)if(ts.isVariableStatement(st))for(const v of st.declarationList.declarations){
 if(v.initializer&&ts.isArrayLiteralExpression(v.initializer))declarations.push('const '+expr(v.name)+' = $derived('+expr(v.initializer).replace(/icon:\s*(\w+)/g,'icon: "$1"')+');');
}
mappings.LinkButton='ui/LinkButton';
const imports=[...used].map(name=>'import '+name+' from "$lib/components/'+mappings[name]+'.svelte";').join('\n');
let result='<script lang="ts">\nimport SvgIcon from "$lib/components/ui/Icon.svelte";\n'+imports+'\n'+declarations.join('\n')+'\n</script>\n'+markup+'\n';
const dest=path.join(targetRoot,destination);
if(fs.existsSync(dest)&&process.argv.includes('--refresh-template')){const existing=fs.readFileSync(dest,'utf8');result=existing.slice(0,existing.indexOf('</script>')+9)+'\n'+markup+'\n';}
if(fs.existsSync(dest)&&!process.argv.includes('--refresh-template')&&!process.argv.includes('--replace-template')&&destination!=='src/routes/+page.svelte')throw Error('Refusing overwrite '+destination);
fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,result);
console.log('Ported source template '+sourceRelative+' -> '+destination);
