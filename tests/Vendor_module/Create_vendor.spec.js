import { test, expect } from '@playwright/test';
import { vendorData } from '../test-data/vendor-data.js';

test('Vendor Creation Flow', async ({ page }) => {
  test.setTimeout(120000);

  async function safeFill(locator, value, fieldName = 'field') {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.click();
    await locator.fill(value);
    console.log(`✅ Filled ${fieldName}: ${value}`);
  }

  async function safeClick(locator, elementName = 'element') {
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.click();
    console.log(`✅ Clicked ${elementName}`);
  }

  console.log('🚀 Starting vendor creation test...');

  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();

  await expect(email).toBeVisible({ timeout: 30000 });

  await safeFill(email, vendorData.login.email, 'email');
  await safeFill(password, vendorData.login.password, 'password');

  await safeClick(page.getByRole('button', { name: /sign in/i }), 'sign in button');
  await expect(page).toHaveURL(/dashboard/, { timeout: 60000 });
  console.log('✅ Logged in successfully');

  await safeClick(page.getByRole('link', { name: /vendors/i }), 'vendors link');
  await safeClick(page.getByRole('button', { name: /new vendor/i }).first(), 'new vendor button');
  await expect(page.getByRole('heading', { name: /new vendor/i })).toBeVisible();

  await safeFill(page.getByRole('textbox', { name: /vendor name\*/i }), vendorData.vendor.name, 'vendor name');
  await safeFill(page.getByRole('textbox', { name: /^company$/i }), vendorData.vendor.company, 'company');
  await safeFill(page.getByRole('textbox', { name: /^email$/i }), vendorData.vendor.email, 'vendor email');
  await safeFill(page.getByRole('textbox', { name: /^phone$/i }), vendorData.vendor.phone, 'phone');
  await safeFill(page.getByRole('textbox', { name: /gstin \/ tax id/i }), vendorData.vendor.taxId, 'tax id');
  await safeFill(page.getByRole('textbox', { name: /address line 1/i }), vendorData.vendor.addressLine1, 'address line 1');
  await safeFill(page.getByRole('textbox', { name: /address line 2/i }), vendorData.vendor.addressLine2, 'address line 2');
  await safeFill(page.getByRole('textbox', { name: /^city$/i }), vendorData.vendor.city, 'city');
  await safeFill(page.getByRole('textbox', { name: /^state$/i }), vendorData.vendor.state, 'state');
  await safeFill(page.getByRole('textbox', { name: /postal code/i }), vendorData.vendor.postalCode, 'postal code');
  await safeFill(page.getByRole('textbox', { name: /^country$/i }), vendorData.vendor.country, 'country');
  await safeFill(page.getByRole('textbox', { name: /^notes$/i }), vendorData.vendor.notes, 'notes');

  const responsePromise = page.waitForResponse(
    response => response.url().includes('/vendors') && response.request().method() === 'POST',
    { timeout: 30000 }
  ).catch(() => null);

  await safeClick(page.getByRole('button', { name: /create vendor/i }), 'create vendor button');

  const response = await responsePromise;
  if (response) {
    console.log(`📦 Vendor API status: ${response.status()}`);
  } else {
    console.warn('⚠️ Vendor API not captured');
  }

  await expect(page.getByRole('row', { name: /Aayush Globus random@gmail\./i })).toBeVisible({ timeout: 30000 });
  await safeClick(page.getByRole('button', { name: /view/i }).first(), 'view button');
});
