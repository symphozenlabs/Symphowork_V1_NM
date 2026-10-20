<script lang="ts">
 import{page}from'$app/state';import Icon from'../ui/Icon.svelte';
 let{type='workspace',class:className=''}:{type?:'workspace'|'platform';class?:string}=$props();
 const workspace:Record<string,string>={app:'Overview',employees:'People',attendance:'Attendance',leave:'Leave',approvals:'Approvals',expenses:'Expenses',payroll:'Payroll',payslips:'Payslips',recruitment:'Recruitment',work:'Projects & tasks',chat:'Internal chat',reports:'Reports',settings:'Organization settings',billing:'Billing & usage',workflows:'Workflow settings',profile:'Profile',notifications:'Notifications'};
 const platform:Record<string,string>={platform:'Overview',organizations:'Organizations',provisioning:'Provisioning',plans:'Plans',subscriptions:'Subscriptions',usage:'Usage',analytics:'Analytics',features:'Features',support:'Support',health:'Health',configuration:'Configuration',users:'Platform users',audit:'Audit'};
 const segments=$derived([type==='platform'?'Console':'Workspace',...(page.url.pathname.split('/').filter(Boolean).length<=1?['Overview']:page.url.pathname.split('/').filter(Boolean).slice(1).map(part=>(type==='platform'?platform:workspace)[part]??part.split('-').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ')))]);
</script>
<nav aria-label="Breadcrumb" class={'hidden items-center gap-2 text-sm md:flex '+className}>{#each segments as segment,index}{#if index>0}<Icon name="ChevronRight" class="size-3.5 shrink-0 text-slate-400"/>{/if}<span class={index===segments.length-1?'font-semibold text-foreground':'text-muted'}>{segment}</span>{/each}</nav>

