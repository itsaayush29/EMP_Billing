import { expect, test } from '@playwright/test';
import { invoiceData } from '../../data/invoice-data.js';
import { safeClick, safeFill, selectFirstAvailableOption } from '../../utils/ui-helpers.js';

test('Invoice Flow', async ({ page }) => {
  test.setTimeout(120000);

  try {
    console.log('Starting invoice creation test...');
    console.log('Opening dashboard with shared authenticated session...');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    console.log('Opening invoices module...');
    await safeClick(page.getByRole('link', { name: /invoices/i }), 'invoices link');
    await page.waitForLoadState('networkidle');
    await safeClick(page.getByRole('button', { name: /new invoice/i }), 'new invoice button');

    console.log('Filling invoice details...');
    await selectFirstAvailableOption(page.getByLabel(/client/i), /select a client/i, 'invoice client');
    await safeFill(page.getByRole('textbox', { name: /issue date/i }), invoiceData.invoice.issueDate, 'issue date');
    await safeFill(page.getByRole('textbox', { name: /due date/i }), invoiceData.invoice.dueDate, 'due date');
    await page.getByLabel(/currency/i).selectOption(invoiceData.invoice.currency);
    await safeFill(page.getByRole('textbox', { name: /reference/i }), invoiceData.invoice.reference, 'reference');

    console.log('Filling minimal invoice details...');
    await safeFill(page.getByRole('textbox', { name: /item name/i }), invoiceData.lineItems[0].name, 'item name');
    await safeFill(page.getByRole('textbox', { name: /description/i }), invoiceData.lineItems[0].description, 'description');
    await safeFill(page.getByPlaceholder('1', { exact: true }), invoiceData.lineItems[0].quantity, 'quantity');
    await safeFill(page.getByPlaceholder('0.00'), invoiceData.lineItems[0].rate, 'rate');

    console.log('Submitting invoice...');
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/invoices') && response.request().method() === 'POST',
      { timeout: 30000 }
    ).catch(() => null);

    await safeClick(page.getByRole('button', { name: /create invoice/i }), 'create invoice button');
    const response = await responsePromise;
    expect(response, 'Invoice API response was not captured.').not.toBeNull();
    expect(response?.status()).toBe(201);

    const toast = page.locator('[role="status"]');
    const toastVisible = await toast.isVisible({ timeout: 15000 }).catch(() => false);

    if (toastVisible) {
      const text = (await toast.textContent()) || '';
      console.log('Toast message:', text);
    } else {
      console.log('Waiting for invoice page to settle...');
      await test.step('wait for invoice form to close after successful creation', async () => {
        await page.waitForLoadState('networkidle').catch(() => {});
      });
    }
  } catch (error) {
    console.error('Invoice flow failed:', error.message);
    await page.screenshot({ path: `test-results/invoice-error-${Date.now()}.png` });
    throw error;
  }
});
