// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const isCI = Boolean(process.env.CI);
const timeout = Number.parseInt(process.env.TIMEOUT ?? '60000', 10);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : 4,
  reporter: isCI
    ? [['json'], ['./reporters/four-line-summary-reporter.js']]
    : [['html', { open: 'never' }], ['./reporters/four-line-summary-reporter.js']],
  timeout: Number.isFinite(timeout) ? timeout : 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'https://test-billing.empcloud.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: process.env.HEADLESS !== 'false',
    storageState: 'playwright/.auth/user.json',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
