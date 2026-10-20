import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import LoginIdentityHud from './LoginIdentityHud.svelte';
import RegisterOnboardingHud from './RegisterOnboardingHud.svelte';
import RecoveryPipelineHud from './RecoveryPipelineHud.svelte';
import EnterpriseGrowthHud from './EnterpriseGrowthHud.svelte';
import EcosystemConstellationHud from './EcosystemConstellationHud.svelte';
import WorkforceNetworkHud from './WorkforceNetworkHud.svelte';

describe('Distinct Page-Specific Animated HUD System', () => {
  it('renders LoginIdentityHud as a concentric security gateway with radar scanner', () => {
    const { html } = render(LoginIdentityHud);
    expect(html).toContain('Identity Authentication Gateway');
    expect(html).toContain('SCANNER: ARMED');
    expect(html).toContain('IDENTITY GATEWAY');
    expect(html).toContain('CREDENTIAL DIGEST');
    expect(html).toContain('DEVICE TELEMETRY');
    expect(html).toContain('ZERO-TRUST RBAC');
    expect(html).toContain('SESSION ENCLAVE');
    expect(html).toContain('Verification Sequence');
    expect(html).toContain('AES-256-GCM');
  });

  it('renders RegisterOnboardingHud as a hierarchical organization tree blueprint', () => {
    const { html } = render(RegisterOnboardingHud);
    expect(html).toContain('Workforce Onboarding Tree');
    expect(html).toContain('TENANT: EXPANDING');
    expect(html).toContain('TENANT ROOT');
    expect(html).toContain('ORGANIZATION BOUNDARY');
    expect(html).toContain('OPERATIONS');
    expect(html).toContain('TECH &amp; CORE');
    expect(html).toContain('PEOPLE &amp; HR');
    expect(html).toContain('NEW OPERATOR');
    expect(html).toContain('Workspace Provisioning Blueprint');
  });

  it('renders RecoveryPipelineHud as a directional S-curve recovery pathway', () => {
    const { html } = render(RecoveryPipelineHud);
    expect(html).toContain('Account Recovery Pathway');
    expect(html).toContain('CHANNEL: SECURE');
    expect(html).toContain('IDENTITY ANCHOR');
    expect(html).toContain('TOKEN ENCLAVE');
    expect(html).toContain('SECURE DISPATCH');
    expect(html).toContain('ATOMIC RE-KEY');
    expect(html).toContain('Atomic Recovery Checklist');
    expect(html).toContain('hud-rail-dash');
  });

  it('renders EnterpriseGrowthHud as a continuous enterprise growth journey from genesis to scale', () => {
    const { html } = render(EnterpriseGrowthHud);
    expect(html).toContain('Enterprise Growth Journey');
    expect(html).toContain('Live Product Flow');
    expect(html).toContain('1. Genesis');
    expect(html).toContain('2. Executive Owner');
    expect(html).toContain('3. Onboarding');
    expect(html).toContain('4. Department Pods');
    expect(html).toContain('5. Daily Operations');
    expect(html).toContain('6. Enterprise BI');
    expect(html).toContain('Acme Global Technologies Inc.');
    expect(html).toContain('Stage 01 · Workspace Genesis');
    expect(html).toContain('Postgres RLS Active');
    expect(html).toContain('EMP0001');
  });

  it('renders EcosystemConstellationHud as a multi-phase workflow pipeline stream', () => {
    const { html } = render(EcosystemConstellationHud);
    expect(html).toContain('SymphoWork Workflow Command Engine');
    expect(html).toContain('END-TO-END PIPELINE');
    expect(html).toContain('STREAM: CONTINUOUS');
    expect(html).toContain('PHASE 1 · INGESTION');
    expect(html).toContain('PHASE 2 · ENROLLMENT');
    expect(html).toContain('PHASE 3 · OPS');
    expect(html).toContain('PHASE 4 · GATE');
    expect(html).toContain('PHASE 5 · SETTLE');
    expect(html).toContain('TENANT GENESIS');
    expect(html).toContain('CANDIDATE ATS');
    expect(html).toContain('APPROVAL NEXUS');
  });

  it('dispatches each variant in WorkforceNetworkHud to its distinct component', () => {
    const authHtml = render(WorkforceNetworkHud, { props: { variant: 'auth' } }).html;
    expect(authHtml).toContain('Identity Authentication Gateway');
    expect(authHtml).not.toContain('TENANT ROOT');

    const onboardHtml = render(WorkforceNetworkHud, { props: { variant: 'onboarding' } }).html;
    expect(onboardHtml).toContain('Workforce Onboarding Tree');
    expect(onboardHtml).not.toContain('Identity Authentication Gateway');

    const recoveryHtml = render(WorkforceNetworkHud, { props: { variant: 'recovery' } }).html;
    expect(recoveryHtml).toContain('Account Recovery Pathway');
    expect(recoveryHtml).not.toContain('Workforce Onboarding Tree');

    const ecosystemHtml = render(WorkforceNetworkHud, { props: { variant: 'ecosystem' } }).html;
    expect(ecosystemHtml).toContain('Enterprise Growth Journey');
    expect(ecosystemHtml).toContain('Acme Global Technologies Inc.');
    expect(ecosystemHtml).toContain('1. Genesis');

    // Default variant without specifying props is ecosystem
    const defaultHtml = render(WorkforceNetworkHud).html;
    expect(defaultHtml).toContain('Enterprise Growth Journey');
    expect(defaultHtml).toContain('Acme Global Technologies Inc.');
  });
});
