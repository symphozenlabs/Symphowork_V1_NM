import {describe,it,expect,vi} from 'vitest';
import {sessionDatabaseURL,IntegrationConfigurationError} from './integration-configuration';
describe('explicit shared database configuration',()=>{
 it('does not discover or read a reference file without explicit opt-in',()=>{const read=vi.fn();expect(sessionDatabaseURL({},read)).toBeUndefined();expect(read).not.toHaveBeenCalled();});
 it('preserves an explicitly supplied DATABASE_URL without reading any file',()=>{const read=vi.fn();expect(sessionDatabaseURL({DATABASE_URL:'postgresql://fixture.invalid/approved',SYMPHOWORK_REFERENCE_ENV_FILE:'not-used'},read)).toBe('postgresql://fixture.invalid/approved');expect(read).not.toHaveBeenCalled();});
 it('reads only DATABASE_URL from an explicit absolute reference, without process mutation',()=>{
  const values={SYMPHOWORK_REFERENCE_ENV_FILE:'C:/authorized-fixture/.env.local'};const before=process.env.DATABASE_URL;
  expect(sessionDatabaseURL(values,()=> 'DATABASE_URL="postgresql://fixture.invalid/existing"\nAUTH_SECRET=synthetic-not-imported\nAPP_URL=https://public.invalid')).toBe('postgresql://fixture.invalid/existing');
  expect(process.env.DATABASE_URL).toBe(before);expect(values).toEqual({SYMPHOWORK_REFERENCE_ENV_FILE:'C:/authorized-fixture/.env.local'});
 });
 it.each(['relative.env','C:/authorized-fixture/missing.env'])('returns a sanitized error for an unusable reference %s',file=>{
  try{sessionDatabaseURL({SYMPHOWORK_REFERENCE_ENV_FILE:file},()=>{throw new Error('synthetic-secret-must-not-leak');});throw new Error('Expected failure');}
  catch(cause){expect(cause).toBeInstanceOf(IntegrationConfigurationError);expect((cause as Error).message).not.toContain('synthetic-secret-must-not-leak');}
 });
 it.each(['APP_URL=https://public.invalid','DATABASE_URL=${OTHER_SECRET}','DATABASE_URL=https://wrong.invalid'])('fails closed on missing, expanded or invalid database settings',text=>{
  expect(()=>sessionDatabaseURL({SYMPHOWORK_REFERENCE_ENV_FILE:'C:/authorized-fixture/.env.local'},()=>text)).toThrow(IntegrationConfigurationError);
 });
});
