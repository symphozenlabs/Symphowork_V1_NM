import { sveltekit } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-vercel";
import { defineConfig } from "vite";

export default defineConfig({
  root: new URL(".", import.meta.url).pathname,
  plugins: [sveltekit({ adapter: adapter() })],
  resolve: { alias: { "$lib": new URL("./src/lib", import.meta.url).pathname, "@": new URL("../src", import.meta.url).pathname } },
  server: {
    proxy: {
      "/api": process.env.LEGACY_API_ORIGIN ?? "http://localhost:3000"
    }
  }
});
