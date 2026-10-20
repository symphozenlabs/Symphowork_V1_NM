<script lang="ts">
import AuthFrame from "$lib/components/auth/AuthFrame.svelte";
import AuthForm from "$lib/components/auth/AuthForm.svelte";
</script>
<AuthFrame title="Verify your email" description="Confirm your email address to activate your account." platform={false}><AuthForm mode="verify-email"/></AuthFrame>
