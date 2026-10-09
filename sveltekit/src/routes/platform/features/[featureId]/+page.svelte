<script lang="ts">import { page } from "$app/state"; import RouteDataPage from "$lib/RouteDataPage.svelte";</script>
<RouteDataPage title="Feature detail" description="Review and manage an authorized feature flag." endpoint={`/api/platform/features/${page.params.featureId}`} />
