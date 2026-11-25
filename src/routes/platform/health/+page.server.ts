import{loadApiData}from'$lib/server/load-api-data';
type Health={checkedAt:string;components:Record<string,{status:'healthy'|'degraded'|'unavailable'|'not_configured'|'unknown';detail?:string;checkedAt?:string}>};
// Explicit navigation only: this upstream GET performs database and storage probes.
export const load:import('./$types').PageServerLoad=async({request,parent})=>{await parent();const body=await loadApiData<{health:Health}>(request,'/api/platform/health');return{health:body.health};};
