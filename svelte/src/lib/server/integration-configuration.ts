import {readFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
import {parseEnv} from 'node:util';
export type IntegrationEnvironment=Readonly<Record<string,string|undefined>>;
export class IntegrationConfigurationError extends Error {
 readonly code='SESSION_CONFIGURATION_INVALID';
 constructor(){super('The shared database reference could not be loaded. Check SYMPHOWORK_REFERENCE_ENV_FILE or supply DATABASE_URL through the approved secret configuration.');}
}
// Explicit opt-in only: no default reference path, no provider/credential-file imports,
// no writes, no network connections, and no source-file error text exposed to callers.
export function sessionDatabaseURL(values:IntegrationEnvironment,read:(path:string)=>string=path=>readFileSync(path,'utf8')):string|undefined {
 if(values.DATABASE_URL?.trim())return values.DATABASE_URL.trim();
 const file=values.SYMPHOWORK_REFERENCE_ENV_FILE?.trim();if(!file)return undefined;
 try{
  if(!isAbsolute(file))throw new Error();
  const text=read(file);if(text.length>65536)throw new Error();
  const value=parseEnv(text).DATABASE_URL?.trim();
  if(!value||value.includes('${'))throw new Error();
  const parsed=new URL(value);if(!['postgres:','postgresql:'].includes(parsed.protocol)||!parsed.hostname)throw new Error();
  return value;
 }catch{throw new IntegrationConfigurationError();}
}
