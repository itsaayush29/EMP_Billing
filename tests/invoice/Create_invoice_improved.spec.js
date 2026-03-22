import { test } from '@playwright/test';
import { invoiceData } from '../test-data/invoice-data.js';
import {
  fillLineItems,
  logApiResponse,
  logToastStatus,
  loginToApplication,
  safeClick,
  safeFill,
  waitForPostResponse
} from '../test-helpers.js';

test('Invoice Flow (Start to End Clean + API + Toast)', async ({ page }) => {
  test.setTimeout(120000);

  try {
    console.log('🚀 Starting invoice creation test...');

    await loginToApplication(page, invoiceData.login);

    await safeClick(page.getByRole('link', { name: /invoices/i }), 'invoices link');
    await page.waitForLoadState('networkidle');
    await safeClick(page.getByRole('button', { name: /new invoice/i }), 'new invoice button');
    console.log('📄 Invoice page opened');

    await page.getByLabel(/client/i).selectOption({ index: invoiceData.invoice.clientIndex });
    await safeFill(page.getByRole('textbox', { name: /issue date/i }), invoiceData.invoice.issueDate, 'issue date');
    await safeFill(page.getByRole('textbox', { name: /due date/i }), invoiceData.invoice.dueDate, 'due date');
    await page.getByLabel(/currency/i).selectOption(invoiceData.invoice.currency);
    await safeFill(page.getByRole('textbox', { name: /reference/i }), invoiceData.invoice.reference, 'reference');

    await fillLineItems(page, invoiceData.lineItems);
    console.log('🧾 Line items added');

    await safeFill(page.getByRole('textbox', { name: /notes/i }), invoiceData.invoice.notes, 'notes');
    await safeFill(page.getByRole('textbox', { name: /terms/i }), invoiceData.invoice.terms, 'terms');
    await safeClick(page.getByRole('button', { name: /add field/i }), 'add field button');
    await safeFill(page.getByRole('textbox', { name: /field name/i }), invoiceData.invoice.customField.name, 'custom field name');
    await safeFill(page.getByRole('textbox', { name: /^value$/i }), invoiceData.invoice.customField.value, 'custom field value');
    console.log('🧩 Extra fields filled');

    const responsePromise = waitForPostResponse(page, '/invoices');

    await safeClick(page.getByRole('button', { name: /create invoice/i }), 'create invoice button');
    console.log('🚀 Create Invoice clicked');

    await logApiResponse(await responsePromise, '⚠️ API not captured (slow backend)');
    await logToastStatus(page, '✅ Invoice created successfully');

    console.log('🎯 Test Completed Successfully');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: `test-results/error-${Date.now()}.png` });
    throw error;
  }
});
