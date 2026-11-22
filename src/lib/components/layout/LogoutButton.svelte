<script lang="ts">
 import Button from'../ui/Button.svelte';import ConfirmDialog from'../ui/ConfirmDialog.svelte';import Icon from'../ui/Icon.svelte';import{mutation}from'$lib/client/api';import{notify}from'$lib/client/toast';
 let open=$state(false),busy=$state(false);
 async function logout(){if(busy)return;busy=true;try{await mutation('/api/auth/logout','POST');window.location.assign('/login');}catch(e){notify((e as Error).message,'error');busy=false;}}
</script>
<Button variant="ghost" size="sm" onclick={()=>open=true}><Icon name="LogOut"/>Sign out</Button>
<ConfirmDialog bind:open title="Sign out of SymphoWork?" description="You will need to sign in again to access your workspace." confirmText="Sign out" isLoading={busy} onConfirm={logout}/>

