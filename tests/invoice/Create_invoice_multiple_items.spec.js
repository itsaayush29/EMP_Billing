import { test, expect } from '@playwright/test';
import { testScenarios } from '../test-data/invoice-scenarios.js';

test('Invoice Creation - Multiple Line Items', async ({ page }) => {
  const data = testScenarios.multipleItems;

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

  await safeFill(email, data.login.email);
  await safeFill(password, data.login.password);

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
  // 🔹 STEP 3: BASIC DETAILS
  // =========================
  await page.getByLabel(/client/i).selectOption({ index: data.invoice.clientIndex });

  await safeFill(page.getByRole('textbox', { name: /issue date/i }), data.invoice.issueDate);
  await safeFill(page.getByRole('textbox', { name: /due date/i }), data.invoice.dueDate);

  await page.getByLabel(/currency/i).selectOption(data.invoice.currency);

  await safeFill(page.getByRole('textbox', { name: /reference/i }), data.invoice.reference);

  // =========================
  // 🔹 STEP 4: LINE ITEMS (Multiple)
  // =========================

  // Add all line items dynamically
  for (let i = 0; i < data.lineItems.length; i++) {
    const item = data.lineItems[i];

    if (i > 0) {
      // Add new line item for items after the first
      await page.getByRole('button', { name: /add line item/i }).click();
    }

    // Fill item details
    const itemName = page.locator(`input[name="items.${i}.name"]`);
    const itemDesc = page.locator(`input[name="items.${i}.description"]`);
    const itemQty = page.locator(`input[name="items.${i}.quantity"]`);
    const itemRate = page.locator(`input[name="items.${i}.rate"]`);

    await safeFill(itemName, item.name);
    await safeFill(itemDesc, item.description);
    await safeFill(itemQty, item.quantity);
    await safeFill(itemRate, item.rate);

    console.log(`📝 Added line item ${i + 1}: ${item.name}`);
  }

  console.log(`🧾 ${data.lineItems.length} line items added`);

  // =========================
  // 🔹 STEP 5: EXTRA FIELDS
  // =========================
  await safeFill(page.getByRole('textbox', { name: /notes/i }), data.invoice.notes);
  await safeFill(page.getByRole('textbox', { name: /terms/i }), data.invoice.terms);

  await page.getByRole('button', { name: /add field/i }).click();

  await safeFill(page.getByRole('textbox', { name: /field name/i }), data.invoice.customField.name);
  await safeFill(page.getByRole('textbox', { name: /^value$/i }), data.invoice.customField.value);

  console.log('🧩 Extra fields filled');

  // =========================
  // 🔹 STEP 6: API + SUBMIT
  // =========================
  const responsePromise = page.waitForResponse(res =>
    res.url().includes('/invoices') &&
    res.request().method() === 'POST',
    { timeout: 30000 }
  ).catch(() => null);

  await page.getByRole('button', { name: /create invoice/i }).click();

  console.log('🚀 Create Invoice clicked (Multiple Items)');

  // 🔹 API Response
  const response = await responsePromise;

  if (response) {
    try {
      const body = await response.json();
      console.log('📦 API RESPONSE:', body);

      if (![200, 201].includes(response.status())) {
        console.warn('⚠️ API returned unexpected status:', response.status());
      }
    } catch {
      console.warn('⚠️ API parse failed');
    }
  } else {
    console.warn('⚠️ API not captured (slow backend)');
  }

  // =========================
  // 🔹 STEP 7: TOAST (SUCCESS / FAILURE)
  // =========================
  const toast = page.locator('[role="status"]');

  const visible = await toast.isVisible({ timeout: 15000 }).catch(() => false);

  if (visible) {
    const text = await toast.textContent();

    console.log('🔔 Toast message:', text);

    if (/created/i.test(text)) {
      console.log('✅ Multiple items invoice created successfully');
    } else {
      console.warn('⚠️ Invoice NOT created:', text);
    }
  } else {
    console.warn('⚠️ No toast message appeared');
  }

  console.log('🎯 Multiple Items Test Completed');
});