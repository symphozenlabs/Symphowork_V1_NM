import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({database:vi.fn()}));
vi.mock('./database',()=>({database:mocks.database}));
import {resolveContext} from './context';
const user={id:'user-a',email:'synthetic@example.invalid',fullName:'Fixture',platformRole:'PLATFORM_OWNER',mustChangePassword:false};
function query(result:unknown){const q:any={};for(const method of ['from','innerJoin','where','limit'])q[method]=()=>q;q.then=(a:any,b:any)=>Promise.resolve(result).then(a,b);return q;}
function setup(rows:unknown[]){const select=vi.fn(()=>query(rows.shift()));const db={select,transaction:vi.fn(async(fn:any)=>fn({select,execute:vi.fn()}))};mocks.database.mockReturnValue(db);return db;}
beforeEach(()=>vi.clearAllMocks());
describe('request-local authorization',()=>{
 it('does not log SQL parameters or session-derived data when the database is unavailable',async()=>{
  const q:any={};for(const method of ['from','innerJoin','where','limit'])q[method]=()=>q;q.then=(resolve:any,reject:any)=>Promise.reject(new Error('SQL parameter session-hash-must-not-log')).then(resolve,reject);
  mocks.database.mockReturnValue({select:vi.fn(()=>q)});
  const log=vi.spyOn(console,'error').mockImplementation(()=>{});
  await expect(resolveContext('session-secret-must-not-log')).rejects.toMatchObject({status:503});
  expect(log).toHaveBeenCalledWith('ResolveContext failed; details withheld.');
  expect(JSON.stringify(log.mock.calls)).not.toContain('session-hash-must-not-log');
  expect(JSON.stringify(log.mock.calls)).not.toContain('session-secret-must-not-log');
 });
 it('checks revoked or suspended sessions again on every request',async()=>{
  const db=setup([[user],[]]);expect(await resolveContext('fixture')).not.toBeNull();expect(await resolveContext('fixture')).toBeNull();expect(db.select).toHaveBeenCalledTimes(2);
 });
 it('cannot repopulate authorization after an in-flight lookup completes following logout',async()=>{
  let release!:(value:unknown)=>void;const pending=new Promise(r=>release=r);
  setup([pending,[],[]]);const old=resolveContext('fixture');expect(await resolveContext('fixture')).toBeNull();release([user]);await old;expect(await resolveContext('fixture')).toBeNull();
 });
 it('does not share concurrent users or requests',async()=>{
  const db=setup([[user],[{...user,id:'user-b'}]]);const [a,b]=await Promise.all([resolveContext('a'),resolveContext('b')]);expect(a?.user.id).toBe('user-a');expect(b?.user.id).toBe('user-b');expect(db.select).toHaveBeenCalledTimes(2);
 });
 it('reloads permissions and denies suspended organizations and missing memberships',async()=>{
  const tenant={...user,platformRole:'NONE'};
  const membership={organizationId:'org-a',roleId:'role-a',status:'active'};
  const org={id:'org-a',name:'Fixture',timezone:'UTC'};
  const role={id:'role-a',key:'EMPLOYEE'};
  setup([[tenant],[membership],[org],[role],[{key:'employee.view'}],[],[tenant],[membership],[org],[role],[{key:'leave.view'}],[],[tenant],[membership],[],[role],[],[],[tenant],[]]);
  expect((await resolveContext('a'))?.permissions).toEqual(['employee.view']);
  expect((await resolveContext('a'))?.permissions).toEqual(['leave.view']);
  await expect(resolveContext('a')).rejects.toMatchObject({status:403});
  await expect(resolveContext('a')).rejects.toMatchObject({status:403});
 });
});
