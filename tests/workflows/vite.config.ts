import {defineConfig} from 'vite';
import {svelte, vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import {fileURLToPath} from 'node:url';
const path=(value:string)=>fileURLToPath(new URL(value,import.meta.url));
export default defineConfig({root:path('./harness'),plugins:[svelte({configFile:false,preprocess:vitePreprocess()})],resolve:{alias:{'$lib':path('../../src/lib'),'$app/state':path('./harness/state.ts'),'$app/navigation':path('./harness/navigation.ts')}},server:{host:'127.0.0.1',port:4188,strictPort:true,fs:{allow:[path('../../')]}}});
