import { test, expect } from '@playwright/test';
import { invoiceData } from '../test-data/invoice-data.js';

test('Invoice Flow (Optimized)', async ({ page }) => {
  test.setTimeout(90000);

  console.log('Starting invoice creation test');

  await page.goto('/dashboard');
  await page.getByRole('link', { name: /invoices/i }).click();
  await page.getByRole('button', { name: /new invoice/i }).click();

  await page.getByLabel(/client/i).selectOption({ index: invoiceData.invoice.clientIndex });
  await page.getByRole('textbox', { name: /issue date/i }).fill(invoiceData.invoice.issueDate);
  await page.getByRole('textbox', { name: /due date/i }).fill(invoiceData.invoice.dueDate);
  await page.getByLabel(/currency/i).selectOption(invoiceData.invoice.currency);
  await page.getByRole('textbox', { name: /reference/i }).fill(invoiceData.invoice.reference);

  await page.locator('input[name="items.0.name"]').fill(invoiceData.lineItems[0].name);
  await page.locator('input[name="items.0.description"]').fill(invoiceData.lineItems[0].description);
  await page.locator('input[name="items.0.quantity"]').fill(invoiceData.lineItems[0].quantity);
  await page.locator('input[name="items.0.rate"]').fill(invoiceData.lineItems[0].rate);

  await page.getByRole('button', { name: /add line item/i }).click();
  await page.locator('input[name="items.1.name"]').fill(invoiceData.lineItems[1].name);
  await page.locator('input[name="items.1.description"]').fill(invoiceData.lineItems[1].description);
  await page.locator('input[name="items.1.quantity"]').fill(invoiceData.lineItems[1].quantity);
  await page.locator('input[name="items.1.rate"]').fill(invoiceData.lineItems[1].rate);

  await page.getByRole('textbox', { name: /notes/i }).fill(invoiceData.invoice.notes);
  await page.getByRole('textbox', { name: /terms/i }).fill(invoiceData.invoice.terms);
  await page.getByRole('button', { name: /add field/i }).click();
  await page.getByRole('textbox', { name: /field name/i }).fill(invoiceData.invoice.customField.name);
  await page.getByRole('textbox', { name: /^value$/i }).fill(invoiceData.invoice.customField.value);

  const responsePromise = page.waitForResponse((response) => (
    response.url().includes('/invoices') && response.request().method() === 'POST'
  ));

  await page.getByRole('button', { name: /create invoice/i }).click();

  const response = await responsePromise;
  expect([200, 201]).toContain(response.status());

  const toast = page.locator('[role="status"]');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(/created/i);

  console.log('Invoice created successfully');
});
