<script lang="ts">
import {navigating} from '$app/state';
import PendingContent from '$lib/components/loading/PendingContent.svelte';
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import type { Snippet } from 'svelte';
 import { can, type Context } from '$lib/auth/policy';
 import { APPROVAL_PERMISSIONS } from '$lib/domain/rbac/permissions';
 import { api,mutation } from '$lib/client/api';
 import { shouldPollChatUnread } from '$lib/components/chat/unread-event';
 import Icon from '../ui/Icon.svelte';
 import Modal from '../ui/Modal.svelte';
 import Button from '../ui/Button.svelte';
 import { notify } from '$lib/client/toast';
 let { context, children }: {context:Context;children:Snippet} = $props();
 let drawer=$state(false), logoutOpen=$state(false), reminder=$state(false), loggingOut=$state(false);
 let unread=$state(0), chatUnread=$state(0);
 let reminderText=$state(''), workDate=$state('');
 const allowed=(p:string)=>context.navigationPermissions ? context.navigationPermissions.includes(p) : can(context,p);
 const owner=$derived(context.role?.key==='ORGANIZATION_OWNER');
 const groups=$derived([
 { title:'Core Modules',items:[
 ['Overview','/app','LayoutDashboard'],
 allowed('employee.read')?['People','/app/employees','UsersRound']:['Directory','/app/directory','UsersRound'],
 ['Attendance','/app/attendance','Clock3'],['Leave','/app/leave','CalendarCheck2'],
 ...(owner||APPROVAL_PERMISSIONS.some(allowed)?[['Approvals','/app/approvals','ClipboardCheck']]:[]),
 ['Expenses','/app/expenses','ReceiptText'],
 ...(allowed('payroll.view')||allowed('payroll.manage')?[['Payroll','/app/payroll','Banknote']]:[]),
 ['Payslips','/app/payroll/payslips','FileText'],
 ...(allowed('ats.view')?[['Recruitment','/app/recruitment','BriefcaseBusiness']]:[]),
 ['Projects & tasks','/app/work','ListTodo'],['Internal chat','/app/chat','MessageCircle']] },
 { title:'Intelligence & Finance',items:[
 ...(allowed('billing.view')?[['Billing & usage','/app/settings/billing','Banknote']]:[]),
 ...(allowed('report.employee')?[['Reports','/app/reports','BarChart3']]:[])] },
 { title:'Administration',items:[
 ...(owner||context.isDepartmentManager||allowed('department.create')||allowed('department.manage')?[['Departments','/app/departments','Building2']]:[]),
 ...(allowed('organization.settings.read')?[['Organization settings','/app/settings','Settings2']]:[]),
 ...(allowed('workflow.manage')?[['Workflow settings','/app/settings/workflows','Settings2']]:[])] }
 ]);
 const active=(href:string)=>href==='/app'?String(page.url.pathname)===href:String(page.url.pathname)===href||String(page.url.pathname).startsWith(href+'/');
 $effect(()=>{page.url.pathname;drawer=false;});
 onMount(()=>{
  let alive=true;
  async function notifications(){try{const b=await api<{unreadCount:number}>('/api/app/notifications');if(alive)unread=b.unreadCount;}catch{/* page surfaces full errors */}}
  async function chat(){try{const b=await api<{unreadCount?:number;count?:number}>('/api/app/chat/unread-count');if(alive)chatUnread=b.unreadCount??b.count??0;}catch{/* no automatic retry */}}
  // These calls match legacy shell behavior. No prefetch/retry or duplicated server load.
   void notifications();if(shouldPollChatUnread(page.url.pathname,document.hidden))void chat();
  void api<{eligible:boolean;required?:boolean;completed?:boolean;shift?:{name:string;startTime:string;endTime:string};workDate?:string}>('/api/app/attendance/reminder').then(b=>{
   if(!alive)return;workDate=b.workDate??'';reminderText='You have not recorded attendance for your scheduled shift today. Please punch in to accurately capture your work hours and maintain compliance with organization attendance policies.';
   reminder=Boolean(b.eligible&&b.required&&!b.completed&&b.shift&&b.workDate)&&localStorage.getItem('sw_attendance_reminder_dismissed_'+workDate)!=='dismissed';
  }).catch(()=>{});
  const poll=setInterval(()=>{void notifications();},30000);
   const chatPoll=setInterval(()=>{if(shouldPollChatUnread(page.url.pathname,document.hidden))void chat();},15000);
  const update=(event:Event)=>{chatUnread=(event as CustomEvent<{count:number}>).detail.count;};
   const visible=()=>{if(shouldPollChatUnread(page.url.pathname,document.hidden))void chat();};
  window.addEventListener('symphowork:chat-unread-count',update);document.addEventListener('visibilitychange',visible);
  return()=>{alive=false;clearInterval(poll);clearInterval(chatPoll);window.removeEventListener('symphowork:chat-unread-count',update);document.removeEventListener('visibilitychange',visible);};
 });
 async function logout(){if(loggingOut)return;loggingOut=true;try{await mutation('/api/auth/logout','POST');window.location.assign('/login');}catch(e){notify((e as Error).message,'error');loggingOut=false;}}
</script>
{#snippet navigation()}
 <nav aria-label="Workspace navigation" class="space-y-6">
 {#each groups as group}
 {#if group.items.length}<section><h2 class="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{group.title}</h2>
 <div class="space-y-1">{#each group.items as [label,href,icon]}
 <a {href} aria-current={active(href)?'page':undefined} class={'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors '+(active(href)?'bg-white text-primary shadow-xs border border-[#D9E5D7]':'text-slate-600 hover:bg-[#E2EDE1] hover:text-primary')}>
 <Icon name={icon}/><span class="truncate">{label}</span>{#if href==='/app/chat'&&chatUnread>0}<span class="ml-auto rounded-full bg-primary px-1.5 text-xs text-white">{chatUnread}</span>{/if}
 </a>{/each}</div></section>{/if}{/each}</nav>
{/snippet}
<div class="min-h-screen bg-background">
 <aside class="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-[#D9E5D7] bg-[#EFF4EE] text-foreground lg:flex lg:flex-col shadow-xs">
 <div class="shrink-0 px-5 pt-6 pb-4 border-b border-[#D9E5D7] bg-[#E8F0E6]/70"><a href="/app" aria-label="SymphoWork Workspace Home"><img src="/symphowork-logo.png" alt="SymphoWork" width="160" height="44" class="h-10.5 w-auto object-contain"/></a></div>
 <div class="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden px-4 pb-6 pt-5 [scrollbar-width:thin]">{@render navigation()}
 <div class="mt-auto pt-6"><div class="flex items-center gap-3 rounded-xl border border-[#D9E5D7] bg-surface p-2.5 shadow-xs"><div class="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-white">{context.user.fullName.slice(0,2).toUpperCase()}</div><div class="min-w-0"><p class="truncate text-xs font-semibold">{context.user.fullName}</p><p class="truncate text-[11px] text-muted">{context.user.email}</p></div></div></div>
 </div></aside>
 <div class="flex min-h-screen flex-col lg:pl-64">
 <header class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-5 backdrop-blur-md md:px-8">
 <div class="flex items-center gap-3"><button class="rounded-lg p-2 lg:hidden" aria-label="Open navigation" onclick={()=>drawer=true}><Icon name="Menu"/></button>
 <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-sm text-muted"><a href="/app">Workspace</a>{#each page.url.pathname.split('/').slice(2) as part}<span>/</span><span class="capitalize">{part.replaceAll('-',' ')}</span>{/each}</nav></div>
 <div class="flex items-center gap-2 md:gap-3"><a href="/app/notifications" class="relative rounded-lg p-2" aria-label={'Notifications, '+unread+' unread'}><Icon name="Bell"/>{#if unread>0}<span class="absolute -top-1 -right-1 rounded-full bg-danger px-1 text-[10px] text-white">{unread}</span>{/if}</a><span class="hidden text-xs text-muted sm:inline">{context.user.fullName}</span>
 <button class="rounded-lg p-2" aria-label="Sign out" onclick={()=>logoutOpen=true}><Icon name="LogOut"/></button>
 <a href="/app/profile" aria-label="Open profile" class="grid size-8 place-items-center rounded-full bg-sidebar-active text-xs font-bold text-sidebar-active-text border border-primary/15">{context.user.fullName.slice(0,2).toUpperCase()}</a></div>
 </header>
 <main class="mx-auto w-full max-w-[1440px] flex-1 p-5 md:p-8"><PendingContent path={navigating.to?.url.pathname??null}>{@render children()}</PendingContent></main></div>
</div>
<Modal bind:open={drawer} title="Navigation drawer" class="mr-auto ml-0 h-screen max-h-screen max-w-72 rounded-none bg-[#EFF4EE]">{@render navigation()}</Modal>
<Modal bind:open={logoutOpen} title="Sign out of SymphoWork?"><p class="mb-6 text-sm text-muted">You will need to sign in again to access your workspace.</p><div class="flex justify-end gap-3"><Button variant="secondary" onclick={()=>logoutOpen=false}>Cancel</Button><Button disabled={loggingOut} onclick={logout}>{loggingOut?'Signing out…':'Sign out'}</Button></div></Modal>
<Modal bind:open={reminder} title="Daily Attendance Reminder"><p class="mb-5 text-sm text-muted">{reminderText}</p><div class="flex justify-end gap-3"><Button variant="secondary" onclick={()=>{localStorage.setItem('sw_attendance_reminder_dismissed_'+workDate,'dismissed');reminder=false;}}>Close</Button><a class="rounded-lg bg-primary px-4 py-2 text-sm text-white" href="/app/attendance" onclick={()=>{localStorage.setItem('sw_attendance_reminder_dismissed_'+workDate,'dismissed');reminder=false;}}>Go to Attendance</a></div></Modal>

