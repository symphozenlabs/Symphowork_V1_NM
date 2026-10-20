import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',
 fullyParallel:false,workers:1,
 reporter:[['list'],['json',{outputFile:'test-results/browser-report.json'}]],
 outputDir:'test-results/browser',
 use:{baseURL:'http://127.0.0.1:4187',channel:'msedge',headless:true,reducedMotion:'reduce',trace:'off',screenshot:'only-on-failure'},
 webServer:{
  command:'node build/index.js',url:'http://127.0.0.1:4187/login',reuseExistingServer:false,
  env:{HOST:'127.0.0.1',PORT:'4187',ORIGIN:'http://127.0.0.1:4187',DATABASE_URL:'',SYMPHOWORK_REFERENCE_ENV_FILE:'',LEGACY_BACKEND_ORIGIN:'',NODE_ENV:'production'}
 }
});

