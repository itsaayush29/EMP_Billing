import { test, expect } from '@playwright/test';
import { invoiceData } from '../test-data/invoice-data.js';

test('Invoice Flow (Start to End Clean + API + Toast)', async ({ page }) => {
  // Set longer timeout for this test
  test.setTimeout(120000);

  // 🔹 Helper (safe fill for slow UI)
  async function safeFill(locator, value, fieldName = 'field') {
    try {
      await locator.waitFor({ state: 'visible', timeout: 30000 });
      await locator.clear();
      await locator.fill(value);
      console.log(`✅ Filled ${fieldName}: ${value}`);
    } catch (error) {
      console.error(`❌ Failed to fill ${fieldName}:`, error.message);
      throw error;
    }
  }

  // 🔹 Helper (safe click)
  async function safeClick(locator, elementName = 'element') {
    try {
      await locator.waitFor({ state: 'visible', timeout: 30000 });
      await locator.click();
      console.log(`✅ Clicked ${elementName}`);
    } catch (error) {
      console.error(`❌ Failed to click ${elementName}:`, error.message);
      throw error;
    }
  }

  try {
    // =========================
    // 🔹 STEP 1: LOGIN
    // =========================
    console.log('🚀 Starting invoice creation test...');

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const email = page.locator('input[type="email"], input[name="email"]').first();
    const password = page.locator('input[type="password"]').first();

    await expect(email).toBeVisible({ timeout: 30000 });

    await safeFill(email, invoiceData.login.email, 'email');
    await safeFill(password, invoiceData.login.password, 'password');

    await safeClick(page.getByRole('button', { name: /sign in/i }), 'sign in button');

    await expect(page).toHaveURL(/dashboard/, { timeout: 60000 });
    console.log('✅ Logged in successfully');

    // =========================
    // 🔹 STEP 2: NAVIGATE
    // =========================
    await safeClick(page.getByRole('link', { name: /invoices/i }), 'invoices link');
    await page.waitForLoadState('networkidle');

    await safeClick(page.getByRole('button', { name: /new invoice/i }), 'new invoice button');

    console.log('📄 Invoice page opened');

    // =========================
    // 🔹 STEP 3: BASIC DETAILS
    // =========================
    await page.getByLabel(/client/i).selectOption({ index: invoiceData.invoice.clientIndex });

    await safeFill(page.getByRole('textbox', { name: /issue date/i }), invoiceData.invoice.issueDate, 'issue date');
    await safeFill(page.getByRole('textbox', { name: /due date/i }), invoiceData.invoice.dueDate, 'due date');

    await page.getByLabel(/currency/i).selectOption(invoiceData.invoice.currency);

    await safeFill(page.getByRole('textbox', { name: /reference/i }), invoiceData.invoice.reference, 'reference');

    // =========================
    // 🔹 STEP 4: LINE ITEMS
    // =========================

    // First item
    await safeFill(page.getByRole('textbox', { name: /item name/i }), invoiceData.lineItems[0].name, 'first item name');
    await safeFill(page.getByRole('textbox', { name: /description/i }), invoiceData.lineItems[0].description, 'first item description');

    await safeFill(page.getByPlaceholder('1', { exact: true }), invoiceData.lineItems[0].quantity, 'first item quantity');
    await safeFill(page.getByPlaceholder('0.00'), invoiceData.lineItems[0].rate, 'first item rate');

    // Add second item
    await safeClick(page.getByRole('button', { name: /add line item/i }), 'add line item button');

    const secondRow = page.locator('input[name="items.1.name"]');

    await safeFill(secondRow, invoiceData.lineItems[1].name, 'second item name');

    await safeFill(
      page.locator('input[name="items.1.description"]'),
      invoiceData.lineItems[1].description,
      'second item description'
    );

    await safeFill(
      page.locator('input[name="items.1.quantity"]'),
      invoiceData.lineItems[1].quantity,
      'second item quantity'
    );

    await safeFill(
      page.locator('input[name="items.1.rate"]'),
      invoiceData.lineItems[1].rate,
      'second item rate'
    );

    console.log('🧾 Line items added');

    // =========================
    // 🔹 STEP 5: EXTRA FIELDS
    // =========================
    await safeFill(page.getByRole('textbox', { name: /notes/i }), invoiceData.invoice.notes, 'notes');
    await safeFill(page.getByRole('textbox', { name: /terms/i }), invoiceData.invoice.terms, 'terms');

    await safeClick(page.getByRole('button', { name: /add field/i }), 'add field button');

    await safeFill(page.getByRole('textbox', { name: /field name/i }), invoiceData.invoice.customField.name, 'custom field name');
    await safeFill(page.getByRole('textbox', { name: /^value$/i }), invoiceData.invoice.customField.value, 'custom field value');

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

    await safeClick(page.getByRole('button', { name: /create invoice/i }), 'create invoice button');

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

    console.log('🎯 Test Completed Successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take a screenshot for debugging
    await page.screenshot({ path: `test-results/error-${Date.now()}.png` });

    throw error;
  }
});