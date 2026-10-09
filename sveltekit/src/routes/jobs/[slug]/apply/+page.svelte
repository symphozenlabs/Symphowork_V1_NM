<script lang="ts">import { page } from "$app/state"; import RouteDataPage from "$lib/RouteDataPage.svelte";</script>
<RouteDataPage title="Apply for a position" description="Submit an application through the public ATS workflow." endpoint={`/api/public/jobs/${page.params.slug}`} />
