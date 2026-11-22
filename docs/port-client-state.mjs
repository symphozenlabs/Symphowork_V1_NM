import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='C:/Users/nares/Symphowork_V1_NM',target='C:/Users/nares/Symphowork_Svelte_V1';
const [source,dest,name]=process.argv.slice(2);
if(!dest?.startsWith('src/'))throw Error('Expected explicit target source path');
const original=fs.readFileSync(path.join(root,source),'utf8');
const file=ts.createSourceFile(source,original,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const fn=file.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
if(!fn)throw Error('Component function not found');
const txt=n=>n.getText(file);
const iconNames=new Set();for(const n of file.statements)if(ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='lucide-react')for(const e of n.importClause?.namedBindings?.elements??[])iconNames.add(e.name.text);
const reactEvent=s=>s.replace(/React.KeyboardEvent(?:<[^>]+>)?/g,'KeyboardEvent').replace(/React.MouseEvent(?:<[^>]+>)?/g,'MouseEvent').replace(/React.ElementType/g,'string').replace(/icon:\s*(\w+)/g,(match,name)=>iconNames.has(name)?'icon: "'+name+'"':match).replace(/React\.FormEvent<HTMLFormElement>/g,'SubmitEvent & {currentTarget:HTMLFormElement}').replace(/React\.FormEvent/g,'SubmitEvent').replace(/React\.ChangeEvent<HTMLInputElement>/g,'Event & {currentTarget:HTMLInputElement}').replaceAll('event.target.value','event.currentTarget.value');
const script=[];const cleanup=[];
for(const st of file.statements){
 if(ts.isTypeAliasDeclaration(st)||ts.isInterfaceDeclaration(st))script.push(txt(st).replace(/^export /,''));
 else if(ts.isVariableStatement(st))script.push(txt(st).replace(/^export /,''));
 else if(ts.isFunctionDeclaration(st)&&st!==fn){
  let jsx=false;const walk=n=>{if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n))jsx=true;ts.forEachChild(n,walk);};walk(st);
  if(jsx&&process.argv.includes('--separate-components'))continue;
  if(jsx)throw Error('Helper contains JSX; port separately: '+st.name?.text);
  script.push(txt(st));
 }
}
let props='';
if(fn.parameters.length){
 const p=fn.parameters[0];
 if(!ts.isObjectBindingPattern(p.name))throw Error('Props must be explicit destructuring');
 props='let '+txt(p.name)+(p.type?':'+txt(p.type):'')+'=$props();';script.push(props);
}
for(const st of fn.body.statements){
 if(ts.isReturnStatement(st))continue;
 if(ts.isIfStatement(st)&&(ts.isReturnStatement(st.thenStatement)||(ts.isBlock(st.thenStatement)&&st.thenStatement.statements.length===1&&ts.isReturnStatement(st.thenStatement.statements[0])))) { cleanup.push('Early return requires template review: '+txt(st.expression));continue; }
 if(ts.isVariableStatement(st)){
  const dec=st.declarationList.declarations;
  if(dec.length!==1)throw Error('Multi-declaration must be reviewed');
  const d=dec[0],init=d.initializer;
  if(ts.isArrayBindingPattern(d.name)&&init&&ts.isCallExpression(init)&&txt(init.expression)==='useState'){
   const [state,set]=d.name.elements.map(txt);const type=init.typeArguments?.length?'<'+init.typeArguments.map(txt).join(',')+'>':'';
   let value=init.arguments[0];let initial=value?txt(value):'undefined';
   if(value&&(ts.isArrowFunction(value)||ts.isFunctionExpression(value)))initial='('+initial+')()';
   script.push('let '+state+'=$state'+type+'(untrack(()=>('+initial+')));');
   script.push('const '+set+'=(next:typeof '+state+'|((previous:typeof '+state+')=>typeof '+state+'))=>{'+state+'=typeof next==="function"?(next as (previous:typeof '+state+')=>typeof '+state+')('+state+'):next;};');
   continue;
  }
  if(init&&ts.isCallExpression(init)){
   const hook=txt(init.expression).replace(/^React\./,'');
   if(hook==='useToast'){script.push('const showToast=(toast:{type:"success"|"error"|"info";title?:string;message?:string})=>notify(toast.message??toast.title??"",toast.type);');continue;}
   if(hook==='useMemo'){script.push('const '+txt(d.name)+'=$derived.by('+txt(init.arguments[0])+');');continue;}
   if(hook==='useCallback'){
    script.push('const '+txt(d.name)+'=$derived.by(()=>{'+(init.arguments[1]?.elements??[]).map(x=>txt(x)+';').join('')+'return '+txt(init.arguments[0])+';});');continue;
   }
   if(hook==='useParams'){script.push('const '+txt(d.name)+'=$derived(routePage.params'+(init.typeArguments?.length?' as '+txt(init.typeArguments[0]):'')+');');continue;}
   if(hook==='usePathname'){script.push('const '+txt(d.name)+'=$derived(routePage.url.pathname);');continue;}
   if(hook==='useRouter'){script.push('const '+txt(d.name)+'={push:goto,replace:(href:string,options?:{scroll?:boolean})=>goto(href,{replaceState:true,noScroll:options?.scroll===false}),refresh:invalidateAll,back:()=>history.back()};');continue;}
   if(hook==='useId'){script.push('const '+txt(d.name)+'=$props.id();');continue;}
   if(hook==='useSearchParams'){script.push('const '+txt(d.name)+'=$derived(routePage.url.searchParams);');continue;}
   if(hook==='useTransition'&&ts.isArrayBindingPattern(d.name)){const [pending,start]=d.name.elements.map(txt);script.push('const '+pending+'=$derived(navigating.to!==null);const '+start+'=(action:()=>unknown)=>{action();};');continue;}
   if(hook==='useRef'){const type=init.typeArguments?.length?txt(init.typeArguments[0]):'unknown';script.push('let '+txt(d.name)+'=$state({current:'+txt(init.arguments[0])+' as '+type+(init.arguments[0]?.kind===ts.SyntaxKind.NullKeyword?'|null':'')+'});');continue;}
   if(hook.startsWith('use'))throw Error('Unsupported hook '+hook);
  }
  if(init&&ts.isIdentifier(d.name)&&!ts.isArrowFunction(init)&&!ts.isFunctionExpression(init)&&!(st.declarationList.flags&ts.NodeFlags.Let)){script.push('const '+txt(d.name)+(d.type?':'+txt(d.type):'')+'=$derived('+txt(init)+');');}else script.push(txt(st));continue;
 }
 if(ts.isExpressionStatement(st)&&ts.isCallExpression(st.expression)&&txt(st.expression.expression)==='useEffect'){
  const call=st.expression;const deps=call.arguments[1];
  if(!deps||!ts.isArrayLiteralExpression(deps))throw Error('Effect dependencies must be explicit');
  script.push('$effect(()=>{'+deps.elements.map(x=>txt(x)+';').join('')+'return untrack('+txt(call.arguments[0])+');});');continue;
 }
 if(ts.isFunctionDeclaration(st)){script.push(txt(st));continue;}
 if(ts.isExpressionStatement(st)&&ts.isBinaryExpression(st.expression)&&ts.isPropertyAccessExpression(st.expression.left)&&st.expression.left.name.text==='current'){script.push('$effect(()=>{const value='+txt(st.expression.right)+';untrack(()=>{'+txt(st.expression.left)+'=value;});});');continue;}
 if(source.endsWith('edit-employee-dialog.tsx')&&ts.isIfStatement(st)&&txt(st).includes('availableRoleKeys.push')){const declaration=fn.body.statements.filter(ts.isVariableStatement).flatMap(x=>x.declarationList.declarations).find(x=>txt(x.name)==='availableRoleKeys');const idx=script.findIndex(x=>x.startsWith('const availableRoleKeys:'));script[idx]='const availableRoleKeys=$derived.by(()=>{const availableRoleKeys:SystemRole[]='+txt(declaration.initializer)+';'+txt(st)+';return availableRoleKeys;});';continue;}
 if(source.endsWith('department-team-dialog.tsx')&&ts.isIfStatement(st)&&txt(st).includes('leadOptions.unshift')){const declaration=fn.body.statements.filter(ts.isVariableStatement).flatMap(x=>x.declarationList.declarations).find(x=>txt(x.name)==='leadOptions');const idx=script.findIndex(x=>x.startsWith('const leadOptions='));script[idx]='const leadOptions=$derived.by(()=>{const leadOptions='+txt(declaration.initializer)+';'+txt(st)+';return leadOptions;});';continue;}
 throw Error('Unsupported component statement: '+txt(st).slice(0,90));
}
const p=path.join(target,dest);let content=fs.readFileSync(p,'utf8');
const begin=content.indexOf('>')+1,end=content.indexOf('</script>');const oldScript=content.slice(begin,end);const ast=ts.createSourceFile('template.ts',oldScript,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);const names=new Set(fn.body.statements.filter(ts.isVariableStatement).flatMap(st=>st.declarationList.declarations.map(d=>txt(d.name))));const duplicate=ast.statements.filter(st=>ts.isVariableStatement(st)&&st.declarationList.declarations.some(d=>names.has(d.name.getText(ast))));let clean=oldScript;for(const st of duplicate.reverse())clean=clean.slice(0,st.pos)+clean.slice(st.end);content=content.slice(0,begin)+clean+content.slice(end);
const imported='import {untrack} from "svelte";\nimport {page as routePage,navigating} from "$app/state";\nimport {goto,invalidateAll} from "$app/navigation";\nimport {notify} from "$lib/client/toast";\n';
content=content.replace('</script>',imported+reactEvent(script.join('\n'))+'\n</script>');
if(/\buse(State|Effect|Memo|Callback|Toast|Params|Router|Pathname|Ref)\s*[(<]/.test(content))throw Error('Unconverted React hook remains');
fs.writeFileSync(p,content);
fs.appendFileSync(path.join(target,'docs/source-port-state-evidence.jsonl'),JSON.stringify({source,dest,sha256:crypto.createHash('sha256').update(original).digest('hex'),notes:cleanup})+'\n');
console.log('Ported state/actions '+source+'; review notes: '+cleanup.join('; '));
