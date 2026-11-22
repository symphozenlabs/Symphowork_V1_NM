import {test,expect} from '@playwright/test';
test('chat sends current typed message on Enter without blur',async({page})=>{
 await page.goto('/?view=composer');const composer=page.getByRole('textbox');
 await composer.fill('Current draft without a blur');await composer.press('Enter');
 await expect(page.getByRole('status')).toHaveText('Sent: Current draft without a blur');await expect(composer).toHaveValue('');
});
test('voice send failure retains recording and retries the same File',async({page})=>{
 await page.addInitScript(()=>{
  const tracks=[{stop(){}}];
  Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>tracks})}});
  class FakeRecorder {
   static isTypeSupported(){return true;}
   state='inactive';mimeType='audio/webm;codecs=opus';ondataavailable:any;onstop:any;
   constructor(_stream:any,_options:any){}
   start(){this.state='recording';}
   stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['synthetic-audio'],{type:this.mimeType})});this.onstop?.();});}
  }
  Object.defineProperty(window,'MediaRecorder',{value:FakeRecorder});
 });
 await page.goto('/?view=voice');await expect(page.getByLabel('Review recording')).toBeVisible();
 await page.getByLabel('Send voice message',{exact:true}).click();await expect(page.getByRole('alert')).toContainText('Synthetic upload unavailable.');
 await expect(page.getByLabel('Play preview')).toBeVisible();await expect(page.getByRole('status')).toHaveText('Attempts: 1');
 await page.getByLabel('Send voice message',{exact:true}).click();await expect(page.getByText('Voice sent',{exact:true})).toBeVisible();await expect(page.getByRole('status')).toHaveText('Attempts: 2');
});
test('attachment retry sends the original bytes and idempotency key rather than caption text',async({page})=>{
 const attempts:string[]=[];let textWrites=0;
 const now='2026-10-20T10:00:00Z';
 await page.route('**/api/**',async r=>{
  const req=r.request();const path=new URL(req.url()).pathname;
  if(path.endsWith('/attachments')){
   attempts.push(req.postData()??'');
   if(attempts.length===1){await r.fulfill({status:503,json:{success:false,error:{message:'Synthetic attachment failure'}}});return;}
   await r.fulfill({json:{success:true,message:{id:'sent-1',conversationId:'conversation-1',senderEmployeeId:'me',content:'Receipt caption',type:'file',createdAt:now,sender:{id:'me',displayName:'You'},attachment:{id:'att-1',fileName:'receipt.pdf',mimeType:'application/pdf',fileSize:13,category:'document'},reactions:[]}}});return;
  }
  if(path.endsWith('/messages')&&req.method()==='POST')textWrites++;
  if(path.endsWith('/conversations')){await r.fulfill({json:{success:true,conversations:[{conversation:{id:'conversation-1',type:'direct',updatedAt:now},member:{id:'m',role:'member',employeeId:'me'},employee:{id:'me',displayName:'Me'},recipient:{id:'other',displayName:'Colleague'},unreadCount:0}]}});return;}
  await r.fulfill({json:{success:true,employee:{id:'me'},messages:[],typers:[]}});
 });
 await page.goto('/?view=workspace&conversationId=conversation-1');
 await page.locator('input[type=file]').setInputFiles({name:'receipt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF- fixture')});
 await page.getByLabel('Write a message').fill('Receipt caption');await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('button',{name:'Retry',exact:true})).toHaveCount(0);
 expect(attempts).toHaveLength(2);expect(textWrites).toBe(0);
 for(const body of attempts){expect(body).toContain('%PDF- fixture');expect(body).toContain('Receipt caption');}
 const key=(body:string)=>body.match(/name="clientIdempotencyKey"\r\n\r\n([^\r]+)/)?.[1];
 expect(key(attempts[0])).toBeTruthy();expect(key(attempts[1])).toBe(key(attempts[0]));
});
