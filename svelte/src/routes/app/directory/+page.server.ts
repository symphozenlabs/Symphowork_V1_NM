import {error} from '@sveltejs/kit';
import {legacyJSON} from '$lib/server/legacy';
import type {Entry} from '$lib/components/employees/CompanyDirectoryView.svelte';
import type {PageServerLoad} from './$types';
export const load:PageServerLoad=async({request})=>{
 try{return await legacyJSON<{employees:Entry[]}>(request,'/api/app/directory');}
 catch{error(502,'The company directory could not be loaded from the application backend.');}
};

