import {test,expect} from '@playwright/test';
test('regularization supports a missing date using the existing API contract',async({page})=>{
 const posts:any[]=[];
 await page.route('**/api/**',async r=>{if(r.request().method()==='POST')posts.push(r.request().postDataJSON());await r.fulfill({json:{success:true,records:[],requests:[]}});});
 await page.goto('/?view=regularization');await page.getByLabel('Request correction for a date not listed').check();
 await page.getByLabel('Attendance date',{exact:true}).fill('2026-10-19');await page.getByLabel('Requested in',{exact:true}).fill('2026-10-19T09:00');await page.getByLabel('Requested out',{exact:true}).fill('2026-10-19T18:00');
 await page.getByPlaceholder('Reason',{exact:true}).fill('  Missed punches  ');await page.getByRole('button',{name:'Submit request'}).click();
 await expect(page.getByRole('status')).toContainText('submitted for approval');
 expect(posts).toEqual([{attendanceDate:'2026-10-19',requestedIn:'2026-10-19T09:00',requestedOut:'2026-10-19T18:00',reason:'Missed punches'}]);
});
test('approval rejection preserves justification and modal when backend rejects',async({page})=>{
 let posts=0;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST'){posts++;expect(r.request().postDataJSON()).toEqual({action:'reject',comment:'Invalid receipt'});await r.fulfill({status:409,json:{success:false,error:{message:'Approval was already resolved.'}}});}
  else await r.fulfill({json:{success:true,tasks:[{id:'task-1',entityType:'expense_claim',stepName:'Manager',status:'pending'}]}});
 });
 await page.goto('/?view=approvals');await page.getByRole('button',{name:'Reject',exact:true}).click();
 await page.getByLabel('Reason for rejection').fill('  Invalid receipt  ');await page.getByRole('button',{name:'Confirm Rejection'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByLabel('Reason for rejection')).toHaveValue('  Invalid receipt  ');await expect(page.getByRole('alert')).toContainText('already resolved');expect(posts).toBe(1);
});
test('leave failure keeps dates and reason without reserving an optimistic balance',async({page})=>{
 let posts=0;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST'){posts++;await r.fulfill({status:409,json:{success:false,error:{message:'Insufficient leave balance.'}}});return;}
  await r.fulfill({json:{success:true,leaveTypes:[{id:'annual',name:'Annual',halfDayAllowed:true}],applications:[],balances:[{typeName:'Annual',balance:{id:'b',openingBalance:2,accrued:0,adjusted:0,consumed:0,pending:0,leaveYear:2026}}]}});
 });
 await page.goto('/?view=leave');await page.getByLabel('Leave type').selectOption('annual');await page.getByLabel('Start date').fill('2026-10-21');await page.getByLabel('End date').fill('2026-10-23');await page.getByLabel('Reason',{exact:true}).fill('Vacation');await page.getByRole('button',{name:'Submit request'}).click();
 await expect(page.getByRole('alert')).toContainText('Insufficient leave balance');await expect(page.getByLabel('Reason',{exact:true})).toHaveValue('Vacation');await expect(page.getByText('Available: 2.0 days',{exact:false})).toBeVisible();expect(posts).toBe(1);
});
