import { test } from '@playwright/test';
import { testScenarios } from '../test-data/invoice-scenarios.js';
import {
  fillLineItems,
  logApiResponse,
  logToastStatus,
  loginToApplication,
  safeClick,
  safeFill,
  waitForPostResponse
} from '../test-helpers.js';

test('Invoice Creation - Multiple Line Items', async ({ page }) => {
  const data = testScenarios.multipleItems;

  await loginToApplication(page, data.login);

  await safeClick(page.getByRole('link', { name: /invoices/i }), 'invoices link');
  await page.waitForLoadState('networkidle');
  await safeClick(page.getByRole('button', { name: /new invoice/i }), 'new invoice button');
  console.log('📄 Invoice page opened');

  await page.getByLabel(/client/i).selectOption({ index: data.invoice.clientIndex });
  await safeFill(page.getByRole('textbox', { name: /issue date/i }), data.invoice.issueDate, 'issue date');
  await safeFill(page.getByRole('textbox', { name: /due date/i }), data.invoice.dueDate, 'due date');
  await page.getByLabel(/currency/i).selectOption(data.invoice.currency);
  await safeFill(page.getByRole('textbox', { name: /reference/i }), data.invoice.reference, 'reference');

  await fillLineItems(page, data.lineItems);
  console.log(`🧾 ${data.lineItems.length} line items added`);

  await safeFill(page.getByRole('textbox', { name: /notes/i }), data.invoice.notes, 'notes');
  await safeFill(page.getByRole('textbox', { name: /terms/i }), data.invoice.terms, 'terms');
  await safeClick(page.getByRole('button', { name: /add field/i }), 'add field button');
  await safeFill(page.getByRole('textbox', { name: /field name/i }), data.invoice.customField.name, 'custom field name');
  await safeFill(page.getByRole('textbox', { name: /^value$/i }), data.invoice.customField.value, 'custom field value');
  console.log('🧩 Extra fields filled');

  const responsePromise = waitForPostResponse(page, '/invoices');

  await safeClick(page.getByRole('button', { name: /create invoice/i }), 'create invoice button');
  console.log('🚀 Create Invoice clicked (Multiple Items)');

  await logApiResponse(await responsePromise, '⚠️ API not captured (slow backend)');
  await logToastStatus(page, '✅ Multiple items invoice created successfully');

  console.log('🎯 Multiple Items Test Completed');
});
