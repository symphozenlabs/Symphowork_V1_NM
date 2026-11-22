import {describe,it,expect} from 'vitest';import {can,type Context} from './policy';
const context:Context={user:{id:'u1',email:'synthetic@example.invalid',fullName:'Synthetic User',platformRole:'NONE',mustChangePassword:false},organization:{id:'org-a',name:'Synthetic A',timezone:'UTC'},membership:{organizationId:'org-a',status:'active'},role:{id:'r1',key:'EMPLOYEE'},permissions:[],isDepartmentManager:false};
describe('tenant and role policy',()=>{
 it('denies anonymous callers',()=>expect(can(null,'employee.read')).toBe(false));
 it('preserves employee self-service defaults without granting administrative reads',()=>{expect(can(context,'leave.apply')).toBe(true);expect(can(context,'employee.create')).toBe(false);});
 it('denies a second organization even when a permission is present',()=>expect(can({...context,permissions:['employee.create']},'employee.create','org-b')).toBe(false));
 it('denies mismatched or inactive membership',()=>{
  expect(can({...context,membership:{organizationId:'org-b',status:'active'}},'leave.apply')).toBe(false);
  expect(can({...context,membership:{organizationId:'org-a',status:'suspended'}},'leave.apply')).toBe(false);
 });
 it('preserves the explicit platform-owner policy, not other platform-role bypasses',()=>{
  expect(can({...context,user:{...context.user,platformRole:'PLATFORM_OWNER'}},'employee.create')).toBe(true);
  expect(can({...context,user:{...context.user,platformRole:'PLATFORM_SUPPORT'}},'employee.create')).toBe(false);
 });
});

