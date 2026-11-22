import {test,expect} from '@playwright/test';
for(const action of ['Resend invitation','Revoke'])test(`${action} preserves backend rejection even on HTTP 200`,async({page})=>{
 await page.route('**/api/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:false,error:{message:'Synthetic permission denied'}})}));
 await page.goto('/?view=invitation');
 await page.getByRole('button',{name:action,exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Synthetic permission denied'})).toBeVisible();
 await expect(page.getByText('Invitation revoked.',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Invitation email sent.',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('dialog')).toHaveCount(0);
});

for(const failed of [true,false])test(`organization wizard retains draft after ${failed?'failed envelope':'missing organization identity'} (mock transport)`,async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('symphowork_create_org_draft_v1',JSON.stringify({name:'Fixture Company',slug:'fixture-company',ownerEmail:'fixture@example.test',planId:'plan-1'})));
 let writes=0;
 await page.route('**/api/**',async route=>{writes++;await route.fulfill({status:200,json:failed?{success:false,error:{message:'Synthetic organization denial'}}:{success:true}});});
 await page.goto('/?view=organization-wizard');
 for(const name of ['Next: Contact & Address','Next: Owner','Next: Plan','Next: Regional','Review'])await page.getByRole('button',{name,exact:true}).click();
 await page.getByRole('button',{name:'Create Pending Organization',exact:true}).click();
 await expect(page.getByText(failed?'Synthetic organization denial':'Unable to create organization. Please verify your input and try again.',{exact:true}).first()).toBeVisible();
 expect(writes).toBe(1);
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('symphowork_create_org_draft_v1')??'{}').name)).toBe('Fixture Company');
 await expect(page.getByRole('button',{name:'Create Pending Organization',exact:true})).toBeEnabled();
});

test('invitation delivery failure never reports that an email was sent',async({page})=>{
 await page.route('**/api/**',route=>route.fulfill({json:{success:true,invitation:{id:'invitation-1',status:'pending',delivery:'failed'}}}));
 await page.goto('/?view=invitation');await page.getByRole('button',{name:'Resend invitation',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('email delivery was not confirmed');
 await expect(page.getByText('Invitation email sent.',{exact:true})).toHaveCount(0);
});
