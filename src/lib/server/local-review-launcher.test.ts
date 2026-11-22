import {describe,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
function run(values:Record<string,string>,args:string[]=[]){
 const root=mkdtempSync(join(tmpdir(),'symphowork-launcher-test-'));
 try{
  mkdirSync(join(root,'scripts'));mkdirSync(join(root,'src/lib/server'),{recursive:true});
  copyFileSync(resolve('scripts/start-local-review.mjs'),join(root,'scripts/start-local-review.mjs'));
  copyFileSync(resolve('src/lib/server/integration-configuration.ts'),join(root,'src/lib/server/integration-configuration.ts'));
  return spawnSync(process.execPath,[join(root,'scripts/start-local-review.mjs'),...args],{encoding:'utf8',env:{...process.env,DATABASE_URL:'',...values}});
 }finally{rmSync(root,{recursive:true,force:true});}
}
describe('local review startup safeguards (isolated files; no services)',()=>{
 it('refuses --start without approved configuration',()=>{const result=run({},['--start']);expect(result.status).toBe(2);expect(result.stderr).toContain('DATABASE_URL is missing');});
 it('refuses a remote database before startup without exposing its URL',()=>{const result=run({DATABASE_URL:'postgresql://synthetic-user:synthetic-secret@fixture.invalid/fixture'},['--start']);expect(result.status).toBe(2);expect(result.stderr).toContain('Remote access remains disabled');expect(result.stderr).not.toContain('synthetic-secret');});
 it('performs configuration-only validation without launching Vite or contacting the fixture',()=>{const result=run({DATABASE_URL:'postgresql://127.0.0.1/fixture'});expect(result.status).toBe(0);expect(result.stdout).toContain('no network request sent');});
});
