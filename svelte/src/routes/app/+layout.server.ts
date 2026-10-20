import { error } from '@sveltejs/kit';
export const load = async ({ locals }: import('./$types').LayoutServerLoadEvent) => {
 const context = await locals.context;
 if (!context?.organization) error(403,'Organization context is required.');
 return { context };
};

