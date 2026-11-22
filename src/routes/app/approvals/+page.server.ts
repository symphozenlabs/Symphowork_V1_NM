import {redirect} from '@sveltejs/kit';import {can} from '$lib/auth/policy';import {APPROVAL_PERMISSIONS} from '$lib/domain/rbac/permissions';
export const load:import('./$types').PageServerLoad=async({locals})=>{
 const context=await locals.context;
 if(!APPROVAL_PERMISSIONS.some(p=>can(context??null,p)))redirect(303,'/app');
 return {};
};

