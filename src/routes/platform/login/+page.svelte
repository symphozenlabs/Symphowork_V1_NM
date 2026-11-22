<script lang="ts">
import AuthFrame from "$lib/components/auth/AuthFrame.svelte";
import AuthForm from "$lib/components/auth/AuthForm.svelte";
</script>
<AuthFrame title="Platform console" description="Sign in with your authorized platform operator account." platform={true}><AuthForm mode="platform-login"/></AuthFrame>
