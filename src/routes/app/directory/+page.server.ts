import {error} from '@sveltejs/kit';
import {loadApiData} from '$lib/server/load-api-data';
import type {Entry} from '$lib/components/employees/CompanyDirectoryView.svelte';
import type {PageServerLoad} from './$types';
export const load:PageServerLoad=async({request})=>{
 try{return await loadApiData<{employees:Entry[]}>(request,'/api/app/directory');}
 catch{error(502,'The company directory could not be loaded from the application backend.');}
};

