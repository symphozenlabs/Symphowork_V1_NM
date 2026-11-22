import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      '@': './src',
      '@/*': './src/*',
      '@/app/api': './src/lib/server/api',
      '@/app/api/*': './src/lib/server/api/*',
      'next/headers': './src/lib/server/compat/headers.ts',
      'next/server': './src/lib/server/compat/server.ts',
      'next/cache': './src/lib/server/compat/cache.ts',
      'react': './src/lib/server/compat/react.ts'
    },
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'], 'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'], 'img-src': ['self', 'data:', 'https:'],
        'font-src': ['self', 'data:'], 'connect-src': ['self', 'https:'],
        'object-src': ['none'], 'base-uri': ['self'], 'frame-ancestors': ['none'], 'form-action': ['self']
      }
    }
  }
};

export default config;