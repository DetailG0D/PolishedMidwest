// @ts-check
import { defineConfig } from '@playwright/test';

/**
 * E2E tests for the lead-capture modal, run against the BUILT site
 * (`npm run build` first — `npm run test:e2e` does both).
 *
 * The Fieldd submit endpoint is stubbed inside the tests, so no real lead is
 * ever created. The Fieldd component script itself (fieldd.me) and its config
 * fetch (api.fieldd.co/lead-form/company/*) are allowed through — the tests
 * exercise the real component, only the final POST is intercepted.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx astro preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
