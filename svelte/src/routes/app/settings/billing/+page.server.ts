import{error}from'@sveltejs/kit';import{can}from'$lib/auth/policy';
export const load:import('./$types').PageServerLoad=async({locals})=>{if(!can(await locals.context??null,'billing.view'))error(403,'Billing access is required.');return{};};

