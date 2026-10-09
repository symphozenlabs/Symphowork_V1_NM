<script lang="ts">import { page } from "$app/state"; import RouteDataPage from "$lib/RouteDataPage.svelte";</script>
<RouteDataPage title="Organization detail" description="Review an authorized organization and its lifecycle." endpoint={`/api/platform/organizations/${page.params.organizationId}`} />
