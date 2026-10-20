import {test,expect} from '@playwright/test';
test('candidate authorization failure becomes an error instead of perpetual loading',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({status:403,json:{success:false,error:{message:'Candidate access denied.'}}}));
 await page.goto('/?view=resume');await expect(page.getByRole('alert')).toContainText('Candidate access denied.');await expect(page.getByText('Loading resume intelligence…')).toHaveCount(0);
});
test('resume processing failure shows backend error and allows explicit retry',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST'){writes++;expect(r.request().postDataJSON()).toEqual({retry:true});await r.fulfill({status:503,json:{success:false,error:{message:'Parser unavailable.'}}});return;}
  await r.fulfill({json:{success:true,candidate:{fullName:'Ada'},documents:[],jobs:[{id:'job-1',status:'processing_failed',attemptCount:1}],extractions:[{id:'extraction-1',reviewStatus:'pending',normalizedResume:{}}]}});
 });
 await page.goto('/?view=resume');await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Parser unavailable.');await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeEnabled();expect(writes).toBe(1);
});
test('platform configuration does not report success on an explicit failed envelope',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{writes++;expect(r.request().postDataJSON()).toEqual({key:'fixture.setting',value:'new value'});await r.fulfill({json:{success:false,error:{message:'Setting is not editable.'}}});});
 await page.goto('/?view=configuration');await page.getByLabel('fixture.setting').fill('new value');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Setting is not editable.');await expect(page.getByLabel('fixture.setting')).toHaveValue('new value');expect(writes).toBe(1);
});
test('interview scheduling preserves values after permission denial',async({page})=>{
 let body:any;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST'){body=r.request().postDataJSON();await r.fulfill({status:403,json:{success:false,error:{message:'Scheduling is not permitted.'}}});return;}
  await r.fulfill({json:{success:true,applications:[{application:{id:'a-1'},candidateName:'Ada',jobTitle:'Engineer'}],rows:[{id:'e-1',displayName:'Grace'}],interviews:[]}});
 });
 await page.goto('/?view=interviews');await page.getByLabel('Application to interview').selectOption('a-1');await page.getByLabel('Interviewer',{exact:true}).selectOption('e-1');await page.getByLabel('Interview date and time').fill('2026-10-21T12:00');await page.getByRole('button',{name:'Schedule interview',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Scheduling is not permitted.');await expect(page.getByLabel('Application to interview')).toHaveValue('a-1');expect(body).toMatchObject({applicationId:'a-1',interviewerEmployeeIds:['e-1'],durationMinutes:60,mode:'video'});expect(Number.isFinite(Date.parse(body.scheduledAt))).toBe(true);
});
test('platform organization suspension failure keeps original lifecycle action',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{writes++;expect(r.request().postDataJSON()).toEqual({status:'suspended'});await r.fulfill({json:{success:false,error:{message:'Organization has protected operations.'}}});});
 await page.goto('/?view=organization-status');await page.getByRole('button',{name:'Suspend',exact:true}).click();await page.getByRole('button',{name:'Suspend Organization',exact:true}).click();await expect(page.getByText('Organization has protected operations.')).toBeVisible();await expect(page.getByRole('button',{name:'Suspend',exact:true})).toBeEnabled();await expect(page.getByRole('button',{name:'Reactivate',exact:true})).toHaveCount(0);expect(writes).toBe(1);
});
test('provisioning shows failure instead of success for rejected envelope',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{writes++;expect(r.request().postDataJSON()).toEqual({primaryAdminEmail:'admin@example.test'});await r.fulfill({json:{success:false,error:{message:'Provisioning cannot proceed.'}}});});
 await page.goto('/?view=provisioning');await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Provisioning cannot proceed.');await expect(page.getByRole('status')).toHaveCount(0);expect(writes).toBe(1);
});
test('recruiter intelligence handles provider denial without crashing or staying busy',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{writes++;expect(r.request().postDataJSON()).toEqual({query:'Svelte engineers'});await r.fulfill({status:503,json:{success:false,error:{message:'Search provider unavailable.'}}});});
 await page.goto('/?view=intelligence');const input=page.getByPlaceholder('React developers with 4+ years in Chennai, available within 30 days');await input.fill('  Svelte engineers  ');await expect(page.getByRole('button',{name:'Search',exact:true})).toBeEnabled();await input.press('Enter');await expect(page.getByRole('alert')).toContainText('Search provider unavailable.');await expect(page.getByRole('button',{name:'Search',exact:true})).toBeEnabled();await expect(input).toHaveValue('  Svelte engineers  ');expect(writes).toBe(1);
});
test('recruiter intelligence displays structured fallback and empty results truthfully',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({json:{success:true,interpretation:{skills:['svelte'],locations:[],ambiguityFlags:[]},candidates:[],semanticUsed:false,providerStatus:'not_configured'}}));
 await page.goto('/?view=intelligence');await page.getByPlaceholder('React developers with 4+ years in Chennai, available within 30 days').fill('Svelte engineers');await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.getByText('No candidates match this search.')).toBeVisible();await expect(page.getByText('Structured search only — semantic provider not_configured.')).toBeVisible();
});
