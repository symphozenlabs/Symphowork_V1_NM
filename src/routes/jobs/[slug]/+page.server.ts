import{error}from'@sveltejs/kit';import{loadApiData}from'$lib/server/load-api-data';
type Job={publicTitle:string;publicDescription:string;slug:string;location?:string|null;workMode?:string|null;employmentType?:string|null;responsibilities?:string|null;qualifications?:string|null};
export const load:import('./$types').PageServerLoad=async({params,request})=>{
 try{return await loadApiData<{job:Job}>(request,'/api/public/jobs/'+encodeURIComponent(params.slug));}catch{error(404,'This job opportunity is not available.');}
};

