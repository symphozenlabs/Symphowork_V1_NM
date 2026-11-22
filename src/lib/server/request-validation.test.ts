import {describe,it,expect,vi} from 'vitest';
import {relay} from './legacy';
function request(path:string,method:string,body?:unknown){return new Request('https://app.invalid'+path,{method,headers:{origin:'https://app.invalid','content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});}
describe('relay validation without business mutations',()=>{
 it.each([['/api/app/departments','POST',{}],['/api/app/departments','POST',{name:'Engineering',code:'ENG',status:['active']}],['/api/app/employees/not-a-uuid','PATCH',{}],['/api/app/departments/not-a-uuid','DELETE',undefined]])('rejects invalid %s %s before transport',async(path,method,body)=>{
  const transport=vi.fn();const response=await relay(request(path as string,method as string,body),transport,'https://backend.invalid');expect(response.status).toBe(400);expect(transport).not.toHaveBeenCalled();
 });
 it('preserves a valid missing-record 404 and request body',async()=>{
  const transport=vi.fn(async(_url:unknown,init?:RequestInit)=>{expect(await new Response(init?.body).json()).toEqual({phone:'123'});return Response.json({success:false,error:{code:'NOT_FOUND',message:'Employee not found.'}},{status:404});});
  const response=await relay(request('/api/app/employees/11111111-1111-4111-8111-111111111111','PATCH',{phone:'123'}),transport as typeof fetch,'https://backend.invalid');expect(response.status).toBe(404);
 });
 it('forwards valid department creation to authoritative permission checks',async()=>{
  const transport=vi.fn(async()=>Response.json({success:false,error:{code:'FORBIDDEN'}},{status:403}));
  const response=await relay(request('/api/app/departments','POST',{name:'Engineering',code:'ENG'}),transport,'https://backend.invalid');expect(response.status).toBe(403);expect(transport).toHaveBeenCalledTimes(1);
 });
});
