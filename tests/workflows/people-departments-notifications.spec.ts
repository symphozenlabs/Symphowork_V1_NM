import {test,expect} from '@playwright/test';
test('department dependency check failure exposes no destructive action',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{if(r.request().method()==='DELETE')writes++;await r.fulfill({status:503,json:{success:false,error:{message:'Dependency check unavailable.'}}});});
 await page.goto('/?view=department-delete');await expect(page.getByRole('alert')).toContainText('Dependency check unavailable.');
 await expect(page.getByRole('button',{name:'Permanently Delete Department'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Deactivate (Safe Archive)'})).toHaveCount(0);expect(writes).toBe(0);
});
test('dependent department supports only explicit soft archive',async({page})=>{
 const writes:string[]=[];
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='DELETE'){writes.push(r.request().url());await r.fulfill({json:{success:true}});return;}
  await r.fulfill({json:{success:true,safe:false,reasons:['Two active teams'],activeEmployeesCount:0,activeTeamsCount:2,activeRequisitionsCount:0,activeExpensePoliciesCount:0}});
 });
 await page.goto('/?view=department-delete');await expect(page.getByText('Two active teams')).toBeVisible();await expect(page.getByRole('button',{name:'Permanently Delete Department'})).toHaveCount(0);
 await page.getByRole('button',{name:'Deactivate (Safe Archive)'}).click();await expect(page.getByRole('status')).toHaveText('Fixture saved');expect(writes).toHaveLength(1);expect(writes[0]).toContain('?mode=soft');
});
test('profile preserves middle name and failed changes',async({page})=>{
 let body:any;
 await page.route('**/api/**',async r=>{body=r.request().postDataJSON();await r.fulfill({status:422,json:{success:false,error:{message:'Email is already assigned.'}}});});
 await page.goto('/?view=profile');await expect(page.getByLabel('Middle name')).toHaveValue('Augusta');await page.getByLabel('Phone',{exact:true}).fill('12345');await page.getByRole('button',{name:'Save permitted details'}).click();await expect(page.getByRole('alert')).toContainText('already assigned');await expect(page.getByLabel('Phone',{exact:true})).toHaveValue('12345');expect(body.middleName).toBe('Augusta');
});
test('notification mark read preserves unread on failure and refreshes on explicit success',async({page})=>{
 let writes=0,read=false;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST'){writes++;if(writes===1){await r.fulfill({status:503,json:{success:false,error:{message:'Read service unavailable.'}}});return;}read=true;await r.fulfill({json:{success:true}});return;}
  await r.fulfill({json:{success:true,unreadCount:read?0:1,notifications:[{id:'n-1',title:'Approval',message:'Review request',createdAt:'2026-10-20T10:00:00Z',readAt:read?'2026-10-20T11:00:00Z':null,actionUrl:'/app/approvals'}]}});
 });
 await page.goto('/?view=notifications');await page.getByRole('button',{name:'Mark read',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Read service unavailable.');await expect(page.getByText('1 unread',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Mark read',exact:true}).click();await expect(page.getByText('0 unread',{exact:true})).toBeVisible();expect(writes).toBe(2);
});
test('department creation sends eligible manager and normalized code',async({page})=>{
 let body:any;
 await page.route('**/api/**',async r=>{if(r.request().method()==='POST'){body=r.request().postDataJSON();await r.fulfill({json:{success:true}});return;}await r.fulfill({json:{success:true,managers:[{id:'manager-1',displayName:'Grace',employeeId:'E-1',roleTitle:'Manager'}]}});});
 await page.goto('/?view=department-create');await page.getByLabel('Department Name',{exact:false}).fill('Engineering');await page.getByLabel('Department Code',{exact:false}).fill('eng');
 await page.getByRole('combobox').click();await page.getByRole('option').filter({hasText:'Grace'}).click();await page.getByRole('button',{name:'Create Department',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Fixture saved');expect(body).toMatchObject({name:'Engineering',code:'ENG',headEmployeeId:'manager-1'});
});
