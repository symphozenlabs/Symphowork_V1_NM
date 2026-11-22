<script lang="ts">
import AuthFrame from "$lib/components/auth/AuthFrame.svelte";
import AuthForm from "$lib/components/auth/AuthForm.svelte";
</script>
<AuthFrame title="Update your password" description="Establish a new password before continuing." platform={false}><AuthForm mode="change-password"/></AuthFrame>
