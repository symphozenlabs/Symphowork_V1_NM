import {test,expect} from '@playwright/test';
test('older searches cannot replace newer results; failures are visible and retryable',async({page})=>{
 // Resolve aborted requests anyway to exercise generation checks independently of transport cancellation.
 await page.addInitScript(()=>{
  const nativeFetch=window.fetch.bind(window);let failed=false;
  window.fetch=async(input,init)=>{
   const url=String(input);
   if(!url.startsWith('/api/app/employees?'))return nativeFetch(input,init);
   const search=new URL(url,location.origin).searchParams.get('search');
   if(search==='old')await new Promise(r=>setTimeout(r,1500));
   if(search==='fail'&&!failed){failed=true;return Response.json({success:false},{status:503});}
   return Response.json({success:true,total:1,rows:[{id:'fixture',organizationId:'org',userId:null,employeeId:'E1',firstName:'Fixture',lastName:'User',displayName:search==='old'?'Old Result':search==='fail'?'Recovered Result':'New Result',status:'active'}]});
  };
 });
 await page.goto('/?view=directory');
 const search=page.getByRole('textbox',{name:'Search directory by name, email, employee ID, or role'});
 await search.fill('old');await expect(page.getByRole('status')).toHaveText('Loading employees…');
 await search.fill('new');await expect(page.getByRole('link',{name:'New Result'})).toBeVisible();
 await page.waitForTimeout(1600);
 await expect(page.getByRole('link',{name:'New Result'})).toBeVisible();await expect(page.getByRole('link',{name:'Old Result'})).toHaveCount(0);
 await search.fill('fail');await expect(page.getByRole('alert')).toContainText('Unable to load employees');await expect(page.getByRole('link',{name:'New Result'})).toHaveCount(0);
 await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('link',{name:'Recovered Result'})).toBeVisible();
});
