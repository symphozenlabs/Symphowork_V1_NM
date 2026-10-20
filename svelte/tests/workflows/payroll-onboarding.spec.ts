import {test,expect} from '@playwright/test';
test('payroll structure save keeps entered data after server rejection',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST'){writes++;await r.fulfill({status:422,json:{success:false,error:{message:'Effective date is locked.'}}});return;}
  await r.fulfill({json:{success:true,periods:[],runs:[],employees:[],assignments:[],structures:[],components:[],profiles:[]}});
 });
 await page.goto('/?view=payroll');await page.getByRole('button',{name:'Salary structures & components'}).click();
 await page.getByPlaceholder('Structure name').fill('Engineering');
 await page.getByLabel('Structure effective date').fill('2026-10-20');
 await page.getByRole('button',{name:'Create draft structure',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Effective date is locked.');
 await expect(page.getByPlaceholder('Structure name')).toHaveValue('Engineering');
 await expect(page.getByLabel('Structure effective date')).toHaveValue('2026-10-20');expect(writes).toBe(1);
});
test('employee creation and invitation failure can recover without creating a second profile',async({page})=>{
 const writes:{path:string;body:any}[]=[];let invites=0;
 await page.route('**/api/**',async r=>{
  const req=r.request();const path=new URL(req.url()).pathname;
  if(req.method()==='POST'){
   writes.push({path,body:req.postDataJSON()});
   if(path.endsWith('/invite')){
    invites++;
    if(invites===1){await r.fulfill({status:503,json:{success:false,error:{message:'Mail provider unavailable.'}}});return;}
    await r.fulfill({json:{success:true,invitation:{delivery:'not_configured',status:'pending'},invitationUrl:'http://localhost/invitations/accept?token=synthetic'}});return;
   }
   await r.fulfill({json:{success:true,employee:{id:'new-employee',employeeId:'EMP-1',firstName:'Ada',lastName:'Lovelace'}}});return;
  }
  await r.fulfill({json:{success:true,items:[{id:'hr',name:'Human Resources',code:'HR'}],rows:[],teams:[]}});
 });
 await page.goto('/?view=onboarding');
 await page.getByRole('button',{name:'Next: Profile Details'}).click();
 await page.getByLabel('First name').fill('Ada');await page.getByLabel('Last name').fill('Lovelace');await page.getByLabel('Personal email').fill('ada@example.test');
 await page.locator('#onboarding-role-field-8').click();await page.getByRole('option').filter({hasText:'Human Resources'}).click();
 await page.getByRole('button',{name:'Next: Review & Confirm'}).click();
 await page.getByRole('button',{name:'Create Employee Profile',exact:true}).click();
 await page.getByRole('button',{name:'Send Account Invitation'}).click();
 await expect(page.getByRole('heading',{name:'Invitation Needs Attention for Ada Lovelace'})).toBeVisible();
 await expect(page.getByRole('alert')).toContainText('Mail provider unavailable.');
 await page.getByRole('button',{name:'Resend',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Invitation Link Ready for Ada Lovelace'})).toBeVisible();
 expect(writes.map(w=>w.path)).toEqual(['/api/app/employees','/api/app/employees/new-employee/invite','/api/app/employees/new-employee/invite']);
 expect(writes[0].body).toMatchObject({firstName:'Ada',lastName:'Lovelace',personalEmail:'ada@example.test',targetRole:'HR_ADMIN',departmentId:'hr'});
 expect(writes[2].body.resend).toBe(true);
});
test('payroll rejected payment retains reference and payment modal',async({page})=>{
 let posts=0;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST'){posts++;expect(r.request().url()).toContain('/runs/run-1/pay');expect(r.request().postDataJSON().paymentReference).toBe('FIXTURE-PAYMENT');await r.fulfill({status:409,json:{success:false,error:{message:'Payment cannot be recorded twice.'}}});return;}
  await r.fulfill({json:{success:true,periods:[],runs:[{id:'run-1',runNumber:'RUN-1',status:'finalized',employeeCount:1,grossTotal:100,deductionTotal:0,netTotal:100,employerContributionTotal:0,warningCount:0,errorCount:0}],employees:[],assignments:[],structures:[],components:[],profiles:[]}});
 });
 await page.goto('/?view=payroll');await page.getByRole('button',{name:'Record salary payment',exact:true}).click();await page.getByLabel('Payment Reference / UTR Number',{exact:true}).fill('FIXTURE-PAYMENT');await page.getByRole('button',{name:'Confirm & Record Payment'}).click();await expect(page.getByRole('alert')).toContainText('cannot be recorded twice');await expect(page.getByLabel('Payment Reference / UTR Number',{exact:true})).toHaveValue('FIXTURE-PAYMENT');await expect(page.getByRole('button',{name:'Confirm & Record Payment'})).toBeEnabled();expect(posts).toBe(1);
});
