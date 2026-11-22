export type IntegrationEnvironment=Readonly<Record<string,string|undefined>>;
export class IntegrationConfigurationError extends Error {
 readonly code='SESSION_CONFIGURATION_INVALID';
 constructor(){super('DATABASE_URL is missing or invalid. Supply DATABASE_URL through the approved secret configuration.');}
}
export function sessionDatabaseURL(values:IntegrationEnvironment):string|undefined {
 const url=values.DATABASE_URL?.trim();
 if(!url)return undefined;
 try{
  const parsed=new URL(url);
  if(!['postgres:','postgresql:'].includes(parsed.protocol)||!parsed.hostname)throw new Error();
  return url;
 }catch{
  throw new IntegrationConfigurationError();
 }
}
