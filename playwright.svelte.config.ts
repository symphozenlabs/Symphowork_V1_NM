import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  testMatch: /sveltekit-.*\.spec\.ts/,
  use: { baseURL: "http://127.0.0.1:4173", trace: "on-first-retry" },
  webServer: { command: "./node_modules/.bin/vite dev --config sveltekit/vite.config.ts --host 127.0.0.1 --port 4173", url: "http://127.0.0.1:4173", reuseExistingServer: true },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
