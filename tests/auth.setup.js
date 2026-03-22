import { test as setup, expect } from '@playwright/test';
import { credentials } from './test-data/credentials.js';

setup('login and save session', async ({ page }) => {
  await page.goto('/login');

  await page.locator('input[type="email"], input[name="email"]').first().fill(credentials.email);
  await page.locator('input[type="password"]').first().fill(credentials.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/dashboard/, { timeout: 60000 });
  await page.context().storageState({ path: 'playwright/.auth/user.json' });

  console.log('Auth session saved');
});
