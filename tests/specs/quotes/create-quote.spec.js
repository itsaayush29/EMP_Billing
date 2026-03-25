import { expect, test } from '@playwright/test';
import { quoteData } from '../../data/quote-data.js';
import { safeClick, safeFill, selectFirstAvailableOption } from '../../utils/ui-helpers.js';

test('Quote Creation Flow', async ({ page }) => {
  test.setTimeout(120000);

  try {
    console.log('Opening dashboard with shared authenticated session...');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();

    console.log('Opening quotes module...');
    await safeClick(page.getByRole('link', { name: /quotes/i }), 'quotes link');
    await page.waitForLoadState('networkidle');
    await safeClick(page.getByRole('button', { name: /new quote/i }), 'new quote button');
    await expect(page.getByRole('heading', { name: /new quote/i })).toBeVisible();

    console.log('Filling quote form...');
    await selectFirstAvailableOption(page.getByLabel(/client/i), /select a client/i, 'quote client');
    await safeFill(page.getByRole('textbox', { name: /issue date/i }), quoteData.quote.issueDate, 'issue date');
    await safeFill(page.getByRole('textbox', { name: /expiry date/i }), quoteData.quote.expiryDate, 'expiry date');
    await page.getByLabel(/currency/i).selectOption(quoteData.quote.currency);

    await safeFill(page.getByRole('textbox', { name: /item name/i }), quoteData.lineItems[0].name, 'item name');
    await safeFill(page.getByRole('textbox', { name: /description/i }), quoteData.lineItems[0].description, 'description');
    await safeFill(page.getByPlaceholder('1', { exact: true }), quoteData.lineItems[0].quantity, 'quantity');
    await safeFill(page.getByPlaceholder('0.00'), quoteData.lineItems[0].rate, 'rate');

    const notes = page.getByRole('textbox', { name: /^notes$/i });
    if (await notes.isVisible().catch(() => false)) {
      await safeFill(notes, quoteData.quote.notes, 'notes');
    }

    const terms = page.getByRole('textbox', { name: /terms/i });
    if (await terms.isVisible().catch(() => false)) {
      await safeFill(terms, quoteData.quote.terms, 'terms');
    }

    console.log('Submitting quote...');
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/quotes') && response.request().method() === 'POST',
      { timeout: 30000 }
    ).catch(() => null);

    await safeClick(page.getByRole('button', { name: /create quote/i }), 'create quote button');
    const response = await responsePromise;
    expect(response, 'Quote API response was not captured.').not.toBeNull();
    expect(response?.status()).toBe(201);
  } catch (error) {
    console.error('Quote creation flow failed:', error.message);
    await page.screenshot({ path: `test-results/quote-error-${Date.now()}.png` }).catch(() => {});
    throw error;
  }
});
