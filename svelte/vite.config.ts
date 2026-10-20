import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // Prevent a parent Next.js PostCSS config from being auto-discovered when nested in the monorepo.
  // Tailwind is integrated above through its Vite plugin.
  css: { postcss: { plugins: [] } },
  plugins: [tailwindcss(), sveltekit()]
});
