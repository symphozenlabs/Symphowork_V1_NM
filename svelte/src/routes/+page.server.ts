import{redirect}from'@sveltejs/kit';import{resolveContext}from'$lib/server/context';import{SESSION_COOKIE}from'$lib/server/proxy-policy';
export const load:import('./$types').PageServerLoad=async({cookies})=>{const context=await resolveContext(cookies.get(SESSION_COOKIE));if(context)redirect(303,context.user.platformRole!=='NONE'?'/platform':'/app');return{};};
