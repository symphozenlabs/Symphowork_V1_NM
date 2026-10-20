import {describe,it,expect} from 'vitest';
import {loadingRoute} from './loader-map';
describe('source loading boundary selection',()=>{
 it.each([['/app','/app'],['/app/employees/new','/app/employees'],['/app/departments/department-1','/app/departments/[departmentId]'],['/platform/plans','/platform/plans'],['/app/documents','/app']])('selects inherited closest boundary for %s',(path,route)=>expect(loadingRoute(path)).toBe(route));
 it('does not match unrelated public paths',()=>{expect(loadingRoute('/application')).toBeUndefined();expect(loadingRoute('/login')).toBeUndefined();});
});
