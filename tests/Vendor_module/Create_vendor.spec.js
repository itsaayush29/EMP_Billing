import { test, expect } from '@playwright/test';
import { vendorData } from '../test-data/vendor-data.js';
import { loginToApplication, safeClick, safeFill, waitForPostResponse } from '../test-helpers.js';

test('Vendor Creation Flow', async ({ page }) => {
  test.setTimeout(120000);

  console.log('🚀 Starting vendor creation test...');

  await loginToApplication(page, vendorData.login);

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

  const responsePromise = waitForPostResponse(page, '/vendors');

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
