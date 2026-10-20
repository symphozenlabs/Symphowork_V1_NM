// Target-only review launcher. Never loads the reference project's configuration.
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {parseEnv} from 'node:util';
import {spawn} from 'node:child_process';
import {sessionDatabaseURL} from '../src/lib/server/integration-configuration.ts';
const root=fileURLToPath(new URL('../',import.meta.url));
const start=process.argv.includes('--start');
let values={},databaseURL,backend;
function stop(message){console.error(message);process.exit(2);}
try{
 for(const name of ['.env','.env.local','.env.development','.env.development.local']){
  const file=resolve(root,name);if(existsSync(file))Object.assign(values,parseEnv(readFileSync(file,'utf8')));
 }
 Object.assign(values,process.env);
 databaseURL=sessionDatabaseURL(values);
 if(!databaseURL)stop('Blocked: approved DATABASE_URL is missing. No service was started.');
 const database=new URL(databaseURL);
 if(!['postgres:','postgresql:'].includes(database.protocol)||!['localhost','127.0.0.1','[::1]'].includes(database.hostname))stop('Blocked: this local-only launcher requires an approved loopback PostgreSQL configuration. Remote access remains disabled.');
 if(!values.LEGACY_BACKEND_ORIGIN)stop('Blocked: LEGACY_BACKEND_ORIGIN is missing. Start and confirm the approved backend first.');
 backend=new URL(values.LEGACY_BACKEND_ORIGIN);
 if(backend.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(backend.hostname)||backend.username||backend.password||backend.search||backend.hash||backend.pathname!=='/'||(backend.hostname==='127.0.0.1'&&backend.port==='5173')||(backend.hostname==='localhost'&&backend.port==='5173'))stop('Blocked: a distinct confirmed loopback backend origin is required.');
}catch{stop('Blocked: local integration configuration could not be parsed. No configuration values were logged.');}
console.log('Local configuration parsed. This does not verify database identity, access authorization, connectivity, credentials or backend availability.');
if(!start){console.log('Check only: no server started and no network request sent. After operator approval, use --start to launch the target.');process.exit(0);}
// The operator must approve the destination, including any local tunnel, before --start.
// Passing DATABASE_URL directly gives both the readiness check and lazy DB pool the same value.
const vite=resolve(root,'node_modules/vite/bin/vite.js');
if(!existsSync(vite))stop('Blocked: installed Vite is unavailable; no dependency installation was attempted.');
const child=spawn(process.execPath,[vite,'dev','--host','127.0.0.1','--port','5173','--strictPort'],{cwd:root,env:{...process.env,...values,DATABASE_URL:databaseURL,NODE_ENV:'development'},stdio:'inherit',windowsHide:true});
child.on('error',()=>stop('Target server could not be started.'));
child.on('exit',code=>{process.exitCode=code??1;});
process.on('SIGINT',()=>{if(!child.killed)child.kill('SIGINT');});
process.on('SIGTERM',()=>{if(!child.killed)child.kill('SIGTERM');});
