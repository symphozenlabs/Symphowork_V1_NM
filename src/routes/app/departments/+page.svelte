<script lang="ts">
let{data}=$props();const result=$derived(data.result);const canManage=$derived(data.canManage);
import SvgIcon from "$lib/components/ui/Icon.svelte";
import DepartmentListTable from "$lib/components/departments/DepartmentListTable.svelte";

</script>
<div class="space-y-6">
      <DepartmentListTable initialItems={result.items} initialDateContext={result.dateContext} isOrganizationOwner={canManage} />
    </div>
