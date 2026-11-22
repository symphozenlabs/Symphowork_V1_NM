import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@/app/api': resolve('./src/lib/server/api'),
      '@': resolve('./src'),
      'next/headers': resolve('./src/lib/server/compat/headers.ts'),
      'next/server': resolve('./src/lib/server/compat/server.ts'),
      'next/cache': resolve('./src/lib/server/compat/cache.ts'),
      'react': resolve('./src/lib/server/compat/react.ts')
    }
  },
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});