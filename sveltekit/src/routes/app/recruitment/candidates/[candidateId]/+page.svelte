<script lang="ts">import { page } from "$app/state"; import RouteDataPage from "$lib/RouteDataPage.svelte";</script>
<RouteDataPage title="Candidate" description="Review an authorized candidate record." endpoint={`/api/app/ats/candidates/${page.params.candidateId}`} />
