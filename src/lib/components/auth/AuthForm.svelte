<script lang="ts">
 import {page} from '$app/state';
 import {onMount} from 'svelte';
 import {mutation,api} from '$lib/client/api';
 import {notify} from '$lib/client/toast';
 import Input from '../ui/Input.svelte';
 import Button from '../ui/Button.svelte';
 import Icon from '../ui/Icon.svelte';
 export type AuthMode='login'|'platform-login'|'register'|'forgot-password'|'reset-password'|'change-password'|'verify-email'|'invitation';
 let {mode}:{mode:AuthMode}=$props();
 let email=$state(''), fullName=$state(''), password=$state(''), confirmPassword=$state('');
 let show=$state(false),showConfirm=$state(false),busy=$state(false),error=$state(''),message=$state(''),delivery=$state('');
 let preview=$state<{organization:{name:string};invitedEmail:string;expiresAt:string;fullName?:string}|null>(null);
 const token=$derived(page.url.searchParams.get('token')??'');
 const login=$derived(mode==='login'||mode==='platform-login');
 const newPassword=$derived(['register','reset-password','change-password','invitation'].includes(mode));
 const checks=$derived([{label:'12+ characters',pass:password.length>=12},{label:'Uppercase letter',pass:/[A-Z]/.test(password)},{label:'Lowercase letter',pass:/[a-z]/.test(password)},{label:'Number',pass:/\d/.test(password)}]);
 onMount(()=>{if(mode==='invitation'&&token)void api<{invitation:NonNullable<typeof preview>}>('/api/auth/invitations/accept/preview?token='+encodeURIComponent(token)).then(b=>{preview=b.invitation;fullName=preview.fullName??'';}).catch(e=>error=e.message);});
 type Result={message?:string;delivery?:string;user?:{id?:string;mustChangePassword?:boolean;platformRole?:string}};
 async function submit(e:SubmitEvent,resend=false){
  e.preventDefault();if(busy)return;error='';message='';
  if(newPassword&&password!==confirmPassword){error='Passwords do not match.';notify(error,'error');return;}
  if(newPassword&&!resend&&!checks.every(c=>c.pass)){error='Password must be 12 characters with upper, lower, and numeric characters.';return;}
  busy=true;
  try{
   const endpoint=mode==='platform-login'?'/api/platform/auth/login':mode==='invitation'?'/api/auth/invitations/accept':mode==='verify-email'&&resend?'/api/auth/verify-email/resend':'/api/auth/'+mode;
   const payload=login?{email,password}:mode==='register'?{fullName,email,password}:mode==='forgot-password'||resend?{email}:mode==='reset-password'?{token,password}:mode==='change-password'?{password,confirmPassword}:mode==='verify-email'?{token}:{token,fullName:fullName||undefined,password};
   const result=await mutation<Result>(endpoint,'POST',payload);
   if(login && (!result.user?.id || typeof result.user.platformRole!=='string'))throw new Error('The authentication service returned an invalid sign-in response.');
   if(login){notify('Signed in successfully. Redirecting…','success');window.location.assign(result.user?.mustChangePassword?'/change-password':result.user?.platformRole&&result.user.platformRole!=='NONE'?'/platform':'/app');return;}
   if(mode==='change-password'){notify('Your password has been updated successfully.','success');window.location.assign('/platform');return;}
   delivery=result.delivery??'';
   message=result.message??(mode==='register'?'Account created. Check your email for verification instructions.':mode==='forgot-password'?'If that email is registered, reset instructions will be sent.':mode==='reset-password'?'Your password was reset successfully.':mode==='verify-email'?(resend?'If the account is eligible, verification instructions will be sent.':'Email verified successfully. You can now sign in.'):'Invitation accepted successfully.');
   notify(message,'success');password='';confirmPassword='';
  }catch(e){error=(e as Error).message;notify(error,'error');}finally{busy=false;}
 }
</script>
{#if error}<div role="alert" class="mb-5 flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-destructive"><Icon name="AlertCircle" class="mt-0.5 size-4 shrink-0"/>{error}</div>{/if}
{#if message}
 <div role="status" class="space-y-4 rounded-xl border border-success-border bg-success-bg p-6 text-sm text-success"><Icon name="CheckCircle2" class="size-5"/><p>{message}</p>{#if delivery==='not_configured'}<p class="text-xs text-muted">Email delivery is not configured, so no email was sent.</p>{/if}<a class="font-semibold underline" href="/login">Back to sign in</a></div>
{:else}
 {#if preview}<div class="mb-5 rounded-xl border bg-background p-4 text-sm"><p class="font-bold">{preview.organization.name}</p><p class="text-muted">{preview.invitedEmail}</p></div>{/if}
 {#if mode==='verify-email'&&token}<form onsubmit={e=>submit(e)} class="mb-6"><Button type="submit" disabled={busy}>{busy?'Verifying…':'Verify email address'}</Button></form>{/if}
 {#if ['reset-password','invitation'].includes(mode)&&!token}
 <p role="alert" class="rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger">This link is invalid or incomplete. Request a new link to continue.</p>
 {:else}
 <form onsubmit={e=>submit(e,mode==='verify-email')} class="space-y-5 sm:space-y-5.5">
  {#if mode==='register'||mode==='invitation'}<label class="grid gap-2 text-sm font-semibold">Full name<Input required bind:value={fullName} autocomplete="name" placeholder="Your full name" disabled={busy}/></label>{/if}
  {#if login||['register','forgot-password','verify-email'].includes(mode)}<label class="grid gap-2 text-sm font-semibold">Email address<Input required type="email" bind:value={email} autocomplete="email" placeholder="name@company.com" disabled={busy} class="h-11 sm:h-12 text-sm sm:text-base px-3.5 rounded-xl shadow-xs"/></label>{/if}
  {#if login||newPassword}
   <div class="space-y-2"><div class="flex items-center justify-between"><label for="auth-password" class="text-sm font-semibold">{newPassword?'New password':'Password'}</label>{#if login}<a class="text-xs font-semibold text-primary hover:underline" href="/forgot-password">Forgot password?</a>{/if}</div>
   <div class="relative"><Input id="auth-password" type={show?'text':'password'} required bind:value={password} autocomplete={login?'current-password':'new-password'} minlength={newPassword?12:undefined} placeholder="••••••••••••" disabled={busy} class="h-11 sm:h-12 text-sm sm:text-base px-3.5 pr-11 rounded-xl shadow-xs"/><button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted" aria-label={show?'Hide password':'Show password'} onclick={()=>show=!show}><Icon name={show?'EyeOff':'Eye'}/></button></div></div>
  {/if}
  {#if newPassword}<div class="space-y-2"><label for="auth-confirm" class="text-sm font-semibold">Confirm password</label><div class="relative"><Input id="auth-confirm" type={showConfirm?'text':'password'} required bind:value={confirmPassword} autocomplete="new-password" disabled={busy} class="h-11 sm:h-12 pr-11 rounded-xl"/><button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-muted" aria-label={showConfirm?'Hide confirm password':'Show confirm password'} onclick={()=>showConfirm=!showConfirm}><Icon name={showConfirm?'EyeOff':'Eye'}/></button></div></div>
   <ul class="grid grid-cols-2 gap-2 text-xs">{#each checks as check}<li class={check.pass?'text-success':'text-muted'}>{check.pass?'✓':'○'} {check.label}</li>{/each}</ul>
  {/if}
  <Button type="submit" disabled={busy} class="mt-3 w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl shadow-xs">
  {#if busy}<Icon name="Loader2" class="size-4 animate-spin"/>{login?'Signing in…':'Submitting…'}{:else}{login?(mode==='platform-login'?'Sign in to console':'Sign in to workspace'):mode==='register'?'Create account':mode==='forgot-password'?'Send reset instructions':mode==='reset-password'?'Reset password':mode==='change-password'?'Update password':mode==='invitation'?'Accept invitation':'Resend verification email'}{/if}</Button>
 </form>{/if}
 <footer class="mt-6 border-t pt-5 text-center text-sm text-muted">{#if login}New to SymphoWork? <a class="font-semibold text-primary hover:underline" href="/register">Create an account</a>{:else}<a class="font-semibold text-primary hover:underline" href="/login">Back to sign in</a>{/if}</footer>
{/if}

