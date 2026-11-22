import{legacyJSON}from'$lib/server/legacy';
export const load:import('./$types').PageServerLoad=async({request,parent})=>{await parent();const body=await legacyJSON<{configuration:{key:string;value:string|null}[]}>(request,'/api/platform/configuration');return{configuration:body.configuration};};
