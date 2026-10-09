<script lang="ts">import { page } from "$app/state"; import RouteDataPage from "$lib/RouteDataPage.svelte";</script>
<RouteDataPage title="Open position" description="Review a public job posting." endpoint={`/api/public/jobs/${page.params.slug}`} />
