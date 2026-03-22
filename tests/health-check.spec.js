import { test, expect } from '@playwright/test';

test('Application Health Check', async ({ page }) => {
  await page.goto('/', { timeout: 30000 });

  const loginForm = page.locator('form').first();
  await expect(loginForm).toBeVisible({ timeout: 10000 });

  console.log('Application is accessible');
});
