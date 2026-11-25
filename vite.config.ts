import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('./src'),
    }
  },
  server: {
    watch: { ignored: ['**/scratch/**', '**/test-results/**', '**/build/**', '**/.next/**', '**/.storage/**'] }
  },
  plugins: [tailwindcss(), sveltekit()]
});