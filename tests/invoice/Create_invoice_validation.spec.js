import { test, expect } from '@playwright/test';

test('Invoice Creation - Validation Scenarios', async ({ page }) => {

  // 🔹 Helper (safe fill for slow UI)
  async function safeFill(locator, value) {
    await locator.waitFor({ state: 'visible', timeout: 20000 });
    await locator.fill(value);
  }

  // =========================
  // 🔹 STEP 1: LOGIN
  // =========================
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();

  await expect(email).toBeVisible({ timeout: 30000 });

  await safeFill(email, 'admin@acme.com');
  await safeFill(password, 'Admin@123');

  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/dashboard/, { timeout: 60000 });
  console.log('✅ Logged in');

  // =========================
  // 🔹 STEP 2: NAVIGATE
  // =========================
  await page.getByRole('link', { name: /invoices/i }).click();
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /new invoice/i }).click();

  console.log('📄 Invoice page opened');

  // =========================
  // 🔹 SCENARIO 1: Try to submit empty form
  // =========================
  console.log('🧪 Testing empty form submission...');

  await page.getByRole('button', { name: /create invoice/i }).click();

  // Check for validation messages
  const validationMessages = page.locator('text=/required|cannot be empty|is required/i');
  const hasValidation = await validationMessages.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasValidation) {
    console.log('✅ Validation messages appeared for empty form');
  } else {
    console.log('⚠️ No validation messages for empty form');
  }

  // =========================
  // 🔹 SCENARIO 2: Invalid date formats
  // =========================
  console.log('🧪 Testing invalid date formats...');

  await page.getByLabel(/client/i).selectOption({ index: 1 });

  // Try invalid date format
  await safeFill(page.getByRole('textbox', { name: /issue date/i }), 'invalid-date');
  await safeFill(page.getByRole('textbox', { name: /due date/i }), '2026-13-45'); // Invalid month/day

  await page.getByLabel(/currency/i).selectOption('USD');

  // Add a line item
  await safeFill(page.getByRole('textbox', { name: /item name/i }), 'Test Item');
  await safeFill(page.getByRole('textbox', { name: /description/i }), 'Test Description');
  await safeFill(page.getByPlaceholder('1', { exact: true }), '1');
  await safeFill(page.getByPlaceholder('0.00'), '100');

  await page.getByRole('button', { name: /create invoice/i }).click();

  // Check for date validation
  const dateValidation = page.locator('text=/invalid date|date format|invalid/i');
  const hasDateValidation = await dateValidation.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasDateValidation) {
    console.log('✅ Date validation messages appeared');
  } else {
    console.log('⚠️ No date validation messages');
  }

  // =========================
  // 🔹 SCENARIO 3: Negative values
  // =========================
  console.log('🧪 Testing negative values...');

  await safeFill(page.getByRole('textbox', { name: /issue date/i }), '2026-03-06');
  await safeFill(page.getByRole('textbox', { name: /due date/i }), '2026-04-07');

  // Try negative quantity and rate
  await safeFill(page.getByPlaceholder('1', { exact: true }), '-5');
  await safeFill(page.getByPlaceholder('0.00'), '-100');

  await page.getByRole('button', { name: /create invoice/i }).click();

  // Check for negative value validation
  const negativeValidation = page.locator('text=/negative|cannot be negative|positive/i');
  const hasNegativeValidation = await negativeValidation.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasNegativeValidation) {
    console.log('✅ Negative value validation messages appeared');
  } else {
    console.log('⚠️ No negative value validation messages');
  }

  // =========================
  // 🔹 SCENARIO 4: Extremely long text
  // =========================
  console.log('🧪 Testing extremely long text inputs...');

  const longText = 'A'.repeat(1000); // 1000 character string

  await safeFill(page.getByPlaceholder('1', { exact: true }), '1');
  await safeFill(page.getByPlaceholder('0.00'), '100');

  await safeFill(page.getByRole('textbox', { name: /reference/i }), longText);
  await safeFill(page.getByRole('textbox', { name: /notes/i }), longText);
  await safeFill(page.getByRole('textbox', { name: /terms/i }), longText);

  await page.getByRole('button', { name: /create invoice/i }).click();

  // Check if the form handles long text gracefully
  const longTextError = page.locator('text=/too long|maximum length|exceeds limit/i');
  const hasLengthValidation = await longTextError.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasLengthValidation) {
    console.log('✅ Length validation messages appeared');
  } else {
    console.log('ℹ️ No length validation (long text accepted or truncated)');
  }

  // =========================
  // 🔹 SCENARIO 5: Special characters
  // =========================
  console.log('🧪 Testing special characters...');

  await safeFill(page.getByRole('textbox', { name: /reference/i }), '!@#$%^&*()');
  await safeFill(page.getByRole('textbox', { name: /item name/i }), '<script>alert("xss")</script>');

  await page.getByRole('button', { name: /create invoice/i }).click();

  // Check for any security-related validation
  const securityValidation = page.locator('text=/invalid characters|not allowed|special characters/i');
  const hasSecurityValidation = await securityValidation.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasSecurityValidation) {
    console.log('✅ Special character validation messages appeared');
  } else {
    console.log('ℹ️ Special characters accepted');
  }

  console.log('🎯 Validation Scenarios Test Completed');
});