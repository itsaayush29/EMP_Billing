// @ts-check
import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

const envFile = '.env';
if (existsSync(envFile)) {
  dotenv.config({ path: envFile, quiet: true });
}

const isCI = Boolean(process.env.CI);
const timeout = Number.parseInt(process.env.TIMEOUT ?? '60000', 10);

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: isCI ? 1 : 3,
  reporter: isCI
    ? [['line'], ['json']]
    : [['list'], ['html', { open: 'never' }], ['./reporters/four-line-summary-reporter.js']],
  timeout: Number.isFinite(timeout) ? timeout : 60000,
  expect: {
    timeout: 30000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'https://test-billing.empcloud.com',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: isCI ? 'off' : 'retain-on-failure',
    headless: process.env.HEADLESS !== 'false',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
