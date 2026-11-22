<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";
import OrganizationCreateWizard from "$lib/components/platform/OrganizationCreateWizard.svelte";
import type { PageProps } from './$types';
let { data }: PageProps = $props();
const plansData = $derived(data.plans);
</script>
<div class="mx-auto max-w-4xl py-2">
      <OrganizationCreateWizard initialPlans={plansData} />
    </div>
