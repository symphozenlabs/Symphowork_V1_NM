import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('./src'),
    }
  },
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});