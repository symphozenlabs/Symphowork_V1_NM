<script lang="ts">
import AuthFrame from "$lib/components/auth/AuthFrame.svelte";
import AuthForm from "$lib/components/auth/AuthForm.svelte";
</script>
<AuthFrame title="Reset your password" description="Choose a new password for your account." platform={false}><AuthForm mode="reset-password"/></AuthFrame>
