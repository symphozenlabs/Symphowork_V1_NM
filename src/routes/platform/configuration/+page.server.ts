import{loadApiData}from'$lib/server/load-api-data';
export const load:import('./$types').PageServerLoad=async({request,parent})=>{await parent();const body=await loadApiData<{configuration:{key:string;value:string|null}[]}>(request,'/api/platform/configuration');return{configuration:body.configuration};};
