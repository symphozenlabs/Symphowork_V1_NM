<script lang="ts">import DepartmentDetailsView from'$lib/components/departments/DepartmentDetailsView.svelte';let{data}=$props();</script>
<svelte:head><title>Department Details | SymphoWork</title></svelte:head>
<div class="space-y-6"><DepartmentDetailsView initialDepartment={data.department} isOrganizationOwner={data.canManage} canManageTeams={data.department.canManageTeams??data.canManage}/></div>
