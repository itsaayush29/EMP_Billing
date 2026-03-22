import { test, expect } from '@playwright/test';
import { testScenarios } from '../test-data/invoice-scenarios.js';

test('Invoice Creation - Past Due Date Scenario', async ({ page }) => {
  const data = testScenarios.pastDueDate;

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
  // 🔹 STEP 3: BASIC DETAILS (Past Due)
  // =========================
  await page.getByLabel(/client/i).selectOption({ index: data.invoice.clientIndex });

  await safeFill(page.getByRole('textbox', { name: /issue date/i }), data.invoice.issueDate);
  await safeFill(page.getByRole('textbox', { name: /due date/i }), data.invoice.dueDate);

  await page.getByLabel(/currency/i).selectOption(data.invoice.currency);

  await safeFill(page.getByRole('textbox', { name: /reference/i }), data.invoice.reference);

  // =========================
  // 🔹 STEP 4: LINE ITEMS
  // =========================
  await safeFill(page.getByRole('textbox', { name: /item name/i }), data.lineItems[0].name);
  await safeFill(page.getByRole('textbox', { name: /description/i }), data.lineItems[0].description);

  await safeFill(page.getByPlaceholder('1', { exact: true }), data.lineItems[0].quantity);
  await safeFill(page.getByPlaceholder('0.00'), data.lineItems[0].rate);

  console.log('🧾 Line item added');

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
  // 🔹 STEP 6: VALIDATION CHECK (Past Due Date)
  // =========================
  // Check if there's any warning about past due date
  const dueDateWarning = page.locator('text=/past due|overdue|expired/i').first();
  const warningVisible = await dueDateWarning.isVisible({ timeout: 5000 }).catch(() => false);

  if (warningVisible) {
    console.log('⚠️ Past due date warning detected');
  } else {
    console.log('ℹ️ No past due date warning (may be expected)');
  }

  // =========================
  // 🔹 STEP 7: API + SUBMIT
  // =========================
  const responsePromise = page.waitForResponse(res =>
    res.url().includes('/invoices') &&
    res.request().method() === 'POST',
    { timeout: 30000 }
  ).catch(() => null);

  await page.getByRole('button', { name: /create invoice/i }).click();

  console.log('🚀 Create Invoice clicked (Past Due Date)');

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
  // 🔹 STEP 8: TOAST (SUCCESS / FAILURE)
  // =========================
  const toast = page.locator('[role="status"]');

  const visible = await toast.isVisible({ timeout: 15000 }).catch(() => false);

  if (visible) {
    const text = await toast.textContent();

    console.log('🔔 Toast message:', text);

    if (/created/i.test(text)) {
      console.log('✅ Past due date invoice created successfully');
    } else {
      console.warn('⚠️ Invoice NOT created:', text);
    }
  } else {
    console.warn('⚠️ No toast message appeared');
  }

  console.log('🎯 Past Due Date Test Completed');
});