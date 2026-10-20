import {test,expect} from '@playwright/test';
const claim={id:'draft-1',claimNumber:'EXP-1',title:'Travel',totalAmount:100,status:'draft',reimbursementStatus:'pending'};
const item={id:'item-1',description:'Taxi',amount:100,expenseDate:'2026-10-20'};
test('draft receipt recovery submits once, then removes draft controls',async({page})=>{
 let submitted=false;const writes:string[]=[];
 await page.route('**/api/**',async route=>{
  const req=route.request();const path=new URL(req.url()).pathname;
  if(req.method()==='POST'){
   writes.push(path);
   if(path.endsWith('/receipt'))expect(req.postData()).toContain('receipt.pdf');
   if(path.endsWith('/submit'))submitted=true;
   await route.fulfill({json:{success:true}});return;
  }
  await route.fulfill({json:{success:true,claim:{...claim,status:submitted?'pending_approval':'draft'},items:[item],receipts:[],history:[]}});
 });
 await page.goto('/');
 await page.getByLabel('Receipt for Taxi').setInputFiles({name:'receipt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7 fixture')});
 await page.getByRole('button',{name:'Upload receipt'}).click();
 await expect(page.getByRole('button',{name:'Submit draft for approval'})).toBeEnabled();
 await page.getByRole('button',{name:'Submit draft for approval'}).click();
 await expect(page.getByRole('button',{name:'Submit draft for approval'})).toHaveCount(0);
 expect(writes).toEqual(['/api/app/expenses/items/item-1/receipt','/api/app/expenses/draft-1/submit']);
});
test('denied fixture hides expense submit and cancel actions',async({page})=>{
 await page.route('**/api/**',r=>r.fulfill({json:{success:true,claim,items:[item],receipts:[],history:[]}}));
 await page.goto('/?denied');
 await expect(page.getByText('EXP-1',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Submit draft for approval'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Cancel claim',exact:true})).toHaveCount(0);
});
test('failed draft submission retains recovery controls and shows backend error',async({page})=>{
 let submissions=0;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST'){submissions++;await r.fulfill({status:422,json:{success:false,error:{message:'Receipt is required.'}}});}
  else await r.fulfill({json:{success:true,claim,items:[item],receipts:[],history:[]}});
 });
 await page.goto('/');await page.getByRole('button',{name:'Submit draft for approval'}).click();
 await expect(page.getByRole('alert')).toContainText('Receipt is required.');
 await expect(page.getByRole('button',{name:'Submit draft for approval'})).toBeEnabled();
 expect(submissions).toBe(1);
});
test('document upload rejects metadata mismatch before sending bytes',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{
  if(r.request().method()==='POST')writes++;
  await r.fulfill({json:{success:true,types:[{id:'type-1',name:'Identity'}],documents:[]}});
 });
 await page.goto('/?view=documents');await page.getByLabel('Document type').selectOption('type-1');
 await page.getByLabel('Document file').setInputFiles({name:'wrong.exe',mimeType:'application/pdf',buffer:Buffer.from('%PDF- fixture')});
 await page.getByRole('button',{name:'Upload',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('matching extension');expect(writes).toBe(0);
});
test('partial expense creation exposes its draft and prevents duplicate creation',async({page})=>{
 let creations=0;
 await page.route('**/api/**',async r=>{
  const path=new URL(r.request().url()).pathname;
  if(r.request().method()==='POST'){creations++;await r.fulfill({json:{success:true,claim}});return;}
  if(path.endsWith('/draft-1')){await r.fulfill({status:503,json:{success:false,error:{message:'Draft temporarily unavailable.'}}});return;}
  await r.fulfill({json:{success:true,categories:[{id:'travel',name:'Travel'}],claims:[]}});
 });
 await page.goto('/?view=expenses');await page.getByLabel('Title',{exact:true}).fill('Travel');await page.getByLabel('Expense date',{exact:true}).fill('2026-10-20');
 await page.locator('select').first().selectOption('travel');
 await page.getByLabel('Expense date 1',{exact:true}).fill('2026-10-20');await page.getByLabel('Description 1',{exact:true}).fill('Taxi');await page.getByLabel('Amount 1',{exact:true}).fill('100');
 await page.getByRole('button',{name:'Submit claim'}).click();await expect(page.getByRole('link',{name:'Open draft to finish receipts and submit'})).toHaveAttribute('href','/app/expenses/draft-1');
 await expect(page.getByRole('button',{name:'Submit claim'})).toBeDisabled();expect(creations).toBe(1);
});
