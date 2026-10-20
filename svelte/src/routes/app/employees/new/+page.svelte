<script lang="ts">
let{data}=$props();const tenant=$derived(data.tenant);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import OnboardingWizard from "$lib/components/employees/onboarding/OnboardingWizard.svelte";

</script>
<div class="mx-auto max-w-5xl py-2">
      <OnboardingWizard currentUserRole={tenant.role?.key} organizationId={tenant.organization.id} />
    </div>
