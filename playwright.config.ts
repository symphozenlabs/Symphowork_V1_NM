import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',
 fullyParallel:false,workers:1,
 reporter:[['list'],['json',{outputFile:'test-results/browser-report.json'}]],
 outputDir:'test-results/browser',
 use:{baseURL:'http://127.0.0.1:4187',channel:'msedge',headless:true,reducedMotion:'reduce',trace:'off',screenshot:'only-on-failure'},
 webServer:{
  command:'node '+JSON.stringify(resolve('build/index.js')),cwd:mkdtempSync(join(tmpdir(),'symphowork-browser-server-')),url:'http://127.0.0.1:4187/login',reuseExistingServer:false,
  env:{HOST:'127.0.0.1',PORT:'4187',ORIGIN:'http://127.0.0.1:4187',DATABASE_URL:'',NODE_ENV:'production'}
 }
});

