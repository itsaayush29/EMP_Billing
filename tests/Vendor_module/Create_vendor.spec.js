import { test, expect } from '@playwright/test';
import { vendorData } from '../test-data/vendor-data.js';

test('Vendor Creation Flow (Optimized)', async ({ page }) => {
  test.setTimeout(90000);

  console.log('Starting vendor creation test');

  await page.goto('/dashboard');
  await page.getByRole('link', { name: /vendors/i }).click();
  await page.getByRole('button', { name: /new vendor/i }).first().click();

  await expect(page.getByRole('heading', { name: /new vendor/i })).toBeVisible();

  await page.getByRole('textbox', { name: /vendor name\*/i }).fill(vendorData.vendor.name);
  await page.getByRole('textbox', { name: /^company$/i }).fill(vendorData.vendor.company);
  await page.getByRole('textbox', { name: /^email$/i }).fill(vendorData.vendor.email);
  await page.getByRole('textbox', { name: /^phone$/i }).fill(vendorData.vendor.phone);
  await page.getByRole('textbox', { name: /gstin \/ tax id/i }).fill(vendorData.vendor.taxId);
  await page.getByRole('textbox', { name: /address line 1/i }).fill(vendorData.vendor.addressLine1);
  await page.getByRole('textbox', { name: /address line 2/i }).fill(vendorData.vendor.addressLine2);
  await page.getByRole('textbox', { name: /^city$/i }).fill(vendorData.vendor.city);
  await page.getByRole('textbox', { name: /^state$/i }).fill(vendorData.vendor.state);
  await page.getByRole('textbox', { name: /postal code/i }).fill(vendorData.vendor.postalCode);
  await page.getByRole('textbox', { name: /^country$/i }).fill(vendorData.vendor.country);
  await page.getByRole('textbox', { name: /^notes$/i }).fill(vendorData.vendor.notes);

  const responsePromise = page.waitForResponse((response) => (
    response.url().includes('/vendors') && response.request().method() === 'POST'
  ));

  await page.getByRole('button', { name: /create vendor/i }).click();

  const response = await responsePromise;
  expect([200, 201]).toContain(response.status());

  await expect(page.getByRole('row', { name: /Aayush Globus random@gmail\./i })).toBeVisible({ timeout: 30000 });

  console.log('Vendor created successfully');
});
