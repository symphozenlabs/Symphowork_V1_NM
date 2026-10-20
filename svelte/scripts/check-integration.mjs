// Read local configuration without printing values or contacting a service.
import {readFileSync,existsSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {sessionDatabaseURL} from '../src/lib/server/integration-configuration.ts';
const values={};
for(const file of ['.env','.env.local','.env.development','.env.development.local']){
 if(existsSync(file))Object.assign(values,parseEnv(readFileSync(file,'utf8')));
}
Object.assign(values,process.env);
let originValid=false,databaseConfigured=false,configurationError=false;
try{
 const url=new URL(values.LEGACY_BACKEND_ORIGIN);
 originValid=!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/'&&(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname));
}catch{}
try{databaseConfigured=Boolean(sessionDatabaseURL(values));}catch{configurationError=true;}
console.log(JSON.stringify({
 LEGACY_BACKEND_ORIGIN_present:Boolean(values.LEGACY_BACKEND_ORIGIN),
 LEGACY_BACKEND_ORIGIN_format_valid:originValid,
 DATABASE_URL_available:databaseConfigured,
 SYMPHOWORK_REFERENCE_ENV_FILE_opted_in:Boolean(values.SYMPHOWORK_REFERENCE_ENV_FILE),
 database_configuration_error:configurationError,
 network_checks_performed:false,
 note:'Presence/format only. This does not verify server availability, login, database access or authorization.'
},null,2));
if(!originValid||!databaseConfigured||configurationError)process.exitCode=2;
