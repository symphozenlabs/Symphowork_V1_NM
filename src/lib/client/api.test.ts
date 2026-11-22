import {afterEach,describe,it,expect,vi} from 'vitest';
import {api,mutation} from './api';
afterEach(()=>vi.unstubAllGlobals());
describe('source API success envelopes',()=>{
 it.each([null,{}, {success:false}])('rejects an unconfirmed success response %j',async body=>{
  const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify(body),{status:200}));vi.stubGlobal('fetch',fetchMock);
  await expect(mutation('/api/app/leave','POST',{reason:'Vacation'})).rejects.toThrow();expect(fetchMock).toHaveBeenCalledTimes(1);
 });
 it('rejects HTML with status 200 instead of inventing mutation success',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<html>Sign in</html>',{status:200})));
  await expect(mutation('/api/app/payroll/config','POST',{})).rejects.toThrow();
 });
 it('preserves explicit backend validation messages and does not retry',async()=>{
  const f=vi.fn().mockResolvedValue(Response.json({success:false,error:{message:'Insufficient balance.'}},{status:409}));vi.stubGlobal('fetch',f);
  await expect(api('/api/app/leave')).rejects.toThrow('Insufficient balance.');expect(f).toHaveBeenCalledTimes(1);
 });
 it('sends multipart bytes without overriding the browser boundary',async()=>{
  const f=vi.fn().mockResolvedValue(Response.json({success:true,id:'uploaded'}));vi.stubGlobal('fetch',f);
  const form=new FormData();form.set('file',new File(['fixture'],'a.pdf',{type:'application/pdf'}));
  await expect(mutation('/api/app/documents','POST',form)).resolves.toMatchObject({id:'uploaded'});
  expect(f.mock.calls[0][1]).toEqual({method:'POST',body:form,cache:'no-store'});
 });
});

describe('uncached request isolation',()=>{
 it('issues separate requests even with the same path and differing identity/options',async()=>{
  const f=vi.fn().mockImplementation(async()=>Response.json({success:true}));vi.stubGlobal('fetch',f);
  const first={headers:{'x-context':'a'},credentials:'omit' as const};const second={headers:{'x-context':'b'},credentials:'include' as const};
  await Promise.all([api('/api/app/master-data/employment-types',first),api('/api/app/master-data/employment-types',second)]);
  expect(f).toHaveBeenCalledTimes(2);expect(f.mock.calls[0][1]).toMatchObject(first);expect(f.mock.calls[1][1]).toMatchObject(second);
 });
 it('cannot reuse an older in-flight result after mutation or logout',async()=>{
  let release!:(r:Response)=>void;
  const f=vi.fn().mockImplementationOnce(()=>new Promise(r=>release=r)).mockImplementation(async()=>Response.json({success:true,value:'fresh'}));vi.stubGlobal('fetch',f);
  const old=api('/api/app/documents/types');await mutation('/api/auth/logout','POST');release(Response.json({success:true,value:'old'}));await old;
  expect(await api('/api/app/documents/types')).toMatchObject({value:'fresh'});expect(f).toHaveBeenCalledTimes(3);
 });
});
