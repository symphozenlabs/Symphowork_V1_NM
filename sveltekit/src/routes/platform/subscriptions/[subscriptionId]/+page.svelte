<script lang="ts">import { page } from "$app/state"; import RouteDataPage from "$lib/RouteDataPage.svelte";</script>
<RouteDataPage title="Subscription detail" description="Review an authorized subscription." endpoint={`/api/platform/subscriptions/${page.params.subscriptionId}`} />
