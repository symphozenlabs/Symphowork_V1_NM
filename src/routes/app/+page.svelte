<script lang="ts">import Overview from '$lib/components/dashboard/Overview.svelte';let{data}=$props();</script>
<Overview fullName={data.fullName} canReadEmployees={data.canReadEmployees} canViewApprovals={data.canViewApprovals} canViewAts={data.canViewAts} initialMetrics={data.initialMetrics}/>

