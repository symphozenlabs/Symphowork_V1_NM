import { legacyJSON } from '$lib/server/legacy';

export const load: import('./$types').PageServerLoad = async ({ request, parent }) => {
  await parent();
  const { jobs } = await legacyJSON<{ jobs: Array<{ job: { id: string; organizationId: string; jobType: string; status: string; currentStep: string; attempts: number; startedAt: string | null; completedAt: string | null; failureMessage: string | null; createdAt: string }; organization: { id: string; name: string; slug: string; contactEmail: string | null } }> }>(request, '/api/platform/provisioning');
  return { rows: jobs };
};
