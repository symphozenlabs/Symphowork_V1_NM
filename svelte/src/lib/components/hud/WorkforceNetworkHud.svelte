<script lang="ts">
  import LoginIdentityHud from './LoginIdentityHud.svelte';
  import RegisterOnboardingHud from './RegisterOnboardingHud.svelte';
  import RecoveryPipelineHud from './RecoveryPipelineHud.svelte';
  import EnterpriseGrowthHud from './EnterpriseGrowthHud.svelte';

  export type HudVariant = 'ecosystem' | 'auth' | 'onboarding' | 'recovery';

  let {
    variant = 'ecosystem',
    class: className,
    showTelemetry = true,
  }: {
    variant?: HudVariant;
    class?: string;
    showTelemetry?: boolean;
  } = $props();
</script>

{#if variant === 'auth'}
  <LoginIdentityHud class={className} {showTelemetry} />
{:else if variant === 'onboarding'}
  <RegisterOnboardingHud class={className} {showTelemetry} />
{:else if variant === 'recovery'}
  <RecoveryPipelineHud class={className} {showTelemetry} />
{:else}
  <EnterpriseGrowthHud class={className} {showTelemetry} />
{/if}
