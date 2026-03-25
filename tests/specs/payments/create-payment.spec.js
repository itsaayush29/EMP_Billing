import { expect, test } from '@playwright/test';
import { paymentData } from '../../data/payment-data.js';
import { safeClick, safeFill, selectFirstAvailableOption } from '../../utils/ui-helpers.js';

test('Payments Module Flow', async ({ page }) => {
  test.setTimeout(120000);

  try {
    console.log('Opening dashboard with shared authenticated session...');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

    console.log('Opening payments module...');
    await safeClick(page.getByRole('link', { name: 'Payments' }), 'payments link');
    await expect(page.getByRole('button', { name: 'Record Payment' })).toBeVisible();

    console.log('Opening record payment form...');
    await safeClick(page.getByRole('button', { name: 'Record Payment' }), 'record payment button');

    console.log('Filling payment form...');
    await selectFirstAvailableOption(page.getByLabel('Client*'), /select a client/i, 'payment client');
    const invoiceSelect = page.getByLabel('Invoice (optional)');
    if (await invoiceSelect.isEnabled().catch(() => false)) {
      await selectFirstAvailableOption(invoiceSelect, /no specific invoice/i, 'payment invoice');
    }
    await safeFill(page.getByRole('spinbutton', { name: 'Amount*' }), paymentData.payment.amount, 'amount');
    await safeFill(page.getByRole('textbox', { name: 'Date*' }), paymentData.payment.date, 'date');
    await page.getByLabel('Payment Method*').selectOption(paymentData.payment.method);
    await safeFill(page.getByRole('textbox', { name: 'Reference' }), paymentData.payment.reference, 'reference');
    await safeFill(page.getByRole('textbox', { name: 'Notes' }), paymentData.payment.notes, 'notes');

    console.log('Submitting payment...');
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/payments') && response.request().method() === 'POST',
      { timeout: 30000 }
    ).catch(() => null);

    await safeClick(page.getByRole('button', { name: 'Record Payment' }).last(), 'submit payment button');

    const response = await responsePromise;
    if (!response) {
      throw new Error('Payment API response was not captured.');
    }

    console.log(`Payment API status: ${response.status()}`);
    expect(response.status()).toBe(201);
  } catch (error) {
    console.error('Payments module flow failed:', error.message);
    await page.screenshot({ path: `test-results/payment-error-${Date.now()}.png` }).catch(() => {});
    throw error;
  }
});
