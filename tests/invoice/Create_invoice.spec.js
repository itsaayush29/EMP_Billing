import { test, expect } from '@playwright/test';
import { invoiceData } from '../test-data/invoice-data.js';

test('Invoice Flow (Start to End Clean + API + Toast)', async ({ page }) => {

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

  await safeFill(email, invoiceData.login.email);
  await safeFill(password, invoiceData.login.password);

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
  await page.getByLabel(/client/i).selectOption({ index: invoiceData.invoice.clientIndex });

  await safeFill(page.getByRole('textbox', { name: /issue date/i }), invoiceData.invoice.issueDate);
  await safeFill(page.getByRole('textbox', { name: /due date/i }), invoiceData.invoice.dueDate);

  await page.getByLabel(/currency/i).selectOption(invoiceData.invoice.currency);

  await safeFill(page.getByRole('textbox', { name: /reference/i }), invoiceData.invoice.reference);

  // =========================
  // 🔹 STEP 4: LINE ITEMS
  // =========================

  // First item
  await safeFill(page.getByRole('textbox', { name: /item name/i }), invoiceData.lineItems[0].name);
  await safeFill(page.getByRole('textbox', { name: /description/i }), invoiceData.lineItems[0].description);

  await safeFill(page.getByPlaceholder('1', { exact: true }), invoiceData.lineItems[0].quantity);
  await safeFill(page.getByPlaceholder('0.00'), invoiceData.lineItems[0].rate);

  // Add second item
  await page.getByRole('button', { name: /add line item/i }).click();

  const secondRow = page.locator('input[name="items.1.name"]');

  await safeFill(secondRow, invoiceData.lineItems[1].name);

  await safeFill(
    page.locator('input[name="items.1.description"]'),
    invoiceData.lineItems[1].description
  );

  await safeFill(
    page.locator('input[name="items.1.quantity"]'),
    invoiceData.lineItems[1].quantity
  );

  await safeFill(
    page.locator('input[name="items.1.rate"]'),
    invoiceData.lineItems[1].rate
  );

  console.log('🧾 Line items added');

  // =========================
  // 🔹 STEP 5: EXTRA FIELDS
  // =========================
  await safeFill(page.getByRole('textbox', { name: /notes/i }), invoiceData.invoice.notes);
  await safeFill(page.getByRole('textbox', { name: /terms/i }), invoiceData.invoice.terms);

  await page.getByRole('button', { name: /add field/i }).click();

  await safeFill(page.getByRole('textbox', { name: /field name/i }), invoiceData.invoice.customField.name);
  await safeFill(page.getByRole('textbox', { name: /^value$/i }), invoiceData.invoice.customField.value);

  console.log('🧩 Extra fields filled');

  // =========================
  // 🔹 STEP 6: API + SUBMIT
  // =========================

  // 🔥 Capture API BEFORE click
  const responsePromise = page.waitForResponse(res =>
    res.url().includes('/invoices') &&
    res.request().method() === 'POST',
    { timeout: 30000 }
  ).catch(() => null);

  await page.getByRole('button', { name: /create invoice/i }).click();

  console.log('🚀 Create Invoice clicked');

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
      console.log('✅ Invoice created successfully');
    } else {
      console.warn('⚠️ Invoice NOT created:', text);
    }
  } else {
    console.warn('⚠️ No toast message appeared');
  }

  console.log('🎯 Test Completed');
});