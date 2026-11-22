import {test,expect} from '@playwright/test';
test('project and task creation use current input and preserve rejected forms',async({page})=>{
 const writes:{path:string;body:any}[]=[];
 await page.route('**/api/**',async r=>{
  const path=new URL(r.request().url()).pathname;
  if(r.request().method()==='POST'){writes.push({path,body:r.request().postDataJSON()});await r.fulfill({status:403,json:{success:false,error:{message:'Work action denied.'}}});return;}
  await r.fulfill({json:{success:true,projects:[],tasks:[],rows:[]}});
 });
 await page.goto('/?view=work');await page.getByLabel('Project name',{exact:true}).fill('Delivery');await page.getByRole('button',{name:'Create project',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Work action denied');await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('Delivery');
 await page.getByLabel('Task title',{exact:true}).fill('Ship feature');await page.getByRole('button',{name:'Create task',exact:true}).click();await expect(page.getByLabel('Task title',{exact:true})).toHaveValue('Ship feature');expect(writes.map(w=>w.path)).toEqual(['/api/app/projects','/api/app/tasks']);expect(writes[0].body.name).toBe('Delivery');expect(writes[1].body.title).toBe('Ship feature');
});
test('project member add sends employee identity and refreshes real detail',async({page})=>{
 let added=false;
 await page.route('**/api/**',async r=>{
  const path=new URL(r.request().url()).pathname;
  const project={id:'p-1',name:'Delivery',projectNumber:'P-1',status:'active',priority:'medium'};
  if(r.request().method()==='POST'){expect(r.request().postDataJSON()).toEqual({action:'add_member',employeeId:'e-1'});added=true;await r.fulfill({json:{success:true}});return;}
  if(path.endsWith('/p-1')){await r.fulfill({json:{success:true,project,members:added?[{membership:{employeeId:'e-1',role:'member'},employee:{id:'e-1',displayName:'Grace',employeeId:'E-1'}}]:[],tasks:[],activity:[]}});return;}
  await r.fulfill({json:{success:true,projects:[project],tasks:[],rows:[{id:'e-1',displayName:'Grace',employeeId:'E-1',status:'active'}]}});
 });
 await page.goto('/?view=work');await page.getByRole('button').filter({hasText:'Delivery'}).click();await page.getByLabel('Add project member').selectOption('e-1');await page.getByRole('button',{name:'Add',exact:true}).click();await expect(page.getByRole('button',{name:'Remove',exact:true})).toBeVisible();expect(added).toBe(true);
});
test('dependency creation keeps selection on a backend cycle rejection',async({page})=>{
 let writes=0;
 await page.route('**/api/**',async r=>{
  const path=new URL(r.request().url()).pathname;const task={id:'t-1',title:'Design',taskNumber:'T-1',status:'todo',priority:'medium'};
  if(r.request().method()==='POST'){writes++;expect(r.request().postDataJSON()).toEqual({action:'dependency',successorTaskId:'t-2'});await r.fulfill({status:400,json:{success:false,error:{message:'This dependency would create a cycle.'}}});return;}
  if(path.endsWith('/t-1')){await r.fulfill({json:{success:true,task,comments:[],activity:[]}});return;}
  await r.fulfill({json:{success:true,projects:[],tasks:[task,{...task,id:'t-2',title:'Build',taskNumber:'T-2'}],rows:[]}});
 });
 await page.goto('/?view=work');await page.getByRole('button').filter({hasText:'Design'}).click();await page.getByLabel('Successor task').selectOption('t-2');await page.getByRole('button',{name:'Add dependency',exact:true}).click();await expect(page.getByRole('alert')).toContainText('would create a cycle');await expect(page.getByLabel('Successor task')).toHaveValue('t-2');expect(writes).toBe(1);
});
test('project lifecycle uses existing PATCH contract',async({page})=>{
 let status='active',writes=0;
 await page.route('**/api/**',async r=>{
  const path=new URL(r.request().url()).pathname;const project={id:'p-1',name:'Lifecycle',projectNumber:'P-1',status,priority:'medium'};
  if(r.request().method()==='PATCH'){writes++;expect(r.request().postDataJSON()).toEqual({status:'on_hold'});status='on_hold';await r.fulfill({json:{success:true}});return;}
  if(path.endsWith('/p-1')){await r.fulfill({json:{success:true,project,members:[],tasks:[],activity:[]}});return;}
  await r.fulfill({json:{success:true,projects:[project],tasks:[],rows:[]}});
 });
 await page.goto('/?view=work');await page.getByRole('button').filter({hasText:'Lifecycle'}).click();await page.getByLabel('Project status',{exact:true}).selectOption('on_hold');await page.getByRole('button',{name:'Save project status'}).click();await expect(page.getByRole('status')).toContainText('Project status updated');await expect(page.getByLabel('Project status',{exact:true})).toHaveValue('on_hold');expect(writes).toBe(1);
});
