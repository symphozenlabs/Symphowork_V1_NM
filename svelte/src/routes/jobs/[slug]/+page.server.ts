import{error}from'@sveltejs/kit';import{legacyJSON}from'$lib/server/legacy';
type Job={publicTitle:string;publicDescription:string;slug:string;location?:string|null;workMode?:string|null;employmentType?:string|null;responsibilities?:string|null;qualifications?:string|null};
export const load:import('./$types').PageServerLoad=async({params,request})=>{
 try{return await legacyJSON<{job:Job}>(request,'/api/public/jobs/'+encodeURIComponent(params.slug));}catch{error(404,'This job opportunity is not available.');}
};

