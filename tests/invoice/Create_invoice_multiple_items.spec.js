import { test, expect } from '@playwright/test';
import { testScenarios } from '../test-data/invoice-scenarios.js';

test('Invoice Creation - Multiple Line Items', async ({ page }) => {
  test.setTimeout(90000);

  const data = testScenarios.multipleItems;

  console.log('Starting multiple item invoice test');

  await page.goto('/dashboard');
  await page.getByRole('link', { name: /invoices/i }).click();
  await page.getByRole('button', { name: /new invoice/i }).click();

  await page.getByLabel(/client/i).selectOption({ index: data.invoice.clientIndex });
  await page.getByRole('textbox', { name: /issue date/i }).fill(data.invoice.issueDate);
  await page.getByRole('textbox', { name: /due date/i }).fill(data.invoice.dueDate);
  await page.getByLabel(/currency/i).selectOption(data.invoice.currency);
  await page.getByRole('textbox', { name: /reference/i }).fill(data.invoice.reference);

  for (const [index, item] of data.lineItems.entries()) {
    if (index > 0) {
      await page.getByRole('button', { name: /add line item/i }).click();
    }

    await page.locator(`input[name="items.${index}.name"]`).fill(item.name);
    await page.locator(`input[name="items.${index}.description"]`).fill(item.description);
    await page.locator(`input[name="items.${index}.quantity"]`).fill(item.quantity);
    await page.locator(`input[name="items.${index}.rate"]`).fill(item.rate);
  }

  await page.getByRole('textbox', { name: /notes/i }).fill(data.invoice.notes);
  await page.getByRole('textbox', { name: /terms/i }).fill(data.invoice.terms);
  await page.getByRole('button', { name: /add field/i }).click();
  await page.getByRole('textbox', { name: /field name/i }).fill(data.invoice.customField.name);
  await page.getByRole('textbox', { name: /^value$/i }).fill(data.invoice.customField.value);

  const responsePromise = page.waitForResponse((response) => (
    response.url().includes('/invoices') && response.request().method() === 'POST'
  ));

  await page.getByRole('button', { name: /create invoice/i }).click();

  const response = await responsePromise;
  expect([200, 201]).toContain(response.status());

  const toast = page.locator('[role="status"]');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText(/created/i);

  console.log('Multiple item invoice created successfully');
});
