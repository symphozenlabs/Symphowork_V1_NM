import { redirect } from '@sveltejs/kit';
import { can } from '$lib/auth/policy';

export const load: import('./$types').PageServerLoad = async ({ locals }) => {
  const context = await locals.context;
  if (!context) redirect(303, '/login');
  if (!context.organization) redirect(303, '/platform');
  if (!can(context, 'ats.view', context.organization.id)) redirect(303, '/app');
  return {};
};
