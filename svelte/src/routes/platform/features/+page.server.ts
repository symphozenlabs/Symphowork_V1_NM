import{legacyJSON}from'$lib/server/legacy';
export const load:import('./$types').PageServerLoad=async({request,parent})=>{await parent();const body=await legacyJSON<{features:{id:string;key:string;name:string;description:string|null;enabled:boolean;updatedAt:string}[]}>(request,'/api/platform/features');return{features:body.features};};
