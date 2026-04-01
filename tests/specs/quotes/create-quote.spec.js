import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { quoteData } from '../../data/quote-data.js';
import { safeClick, safeFill, selectFirstAvailableOption, selectOption } from '../../framework/support/interactions.js';
import { waitForVisible, isVisible } from '../../framework/support/waits.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { destroyDriver } from '../../framework/core/browser.js';
import { openPath } from '../../framework/core/navigation.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { startAuthenticatedDriver } from '../../framework/core/session.js';
import {
  QuotesPage,
} from '../../pages/modules/quotes.page.js';

describe('Quote Creation Flow', function () {
  this.timeout(120000);

  let driver;
  let profileDir;

  beforeEach(async () => {
    const created = await startAuthenticatedDriver();
    driver = created.driver;
    profileDir = created.profileDir;
  });

  afterEach(async () => {
    await destroyDriver(driver, profileDir);
    driver = undefined;
    profileDir = undefined;
  });

  it('Quote Creation Flow', async function () {
    try {
      console.log('Opening dashboard with shared authenticated session...');
      await openPath(driver, '/dashboard');
      await waitForVisible(driver, QuotesPage.dashboardLink, 30000);

      console.log('Opening quotes module...');
      await safeClick(driver, QuotesPage.quotesLink, 'quotes link');
      await safeClick(driver, QuotesPage.newQuoteButton, 'new quote button');
      await waitForVisible(driver, QuotesPage.newQuoteHeading, 30000);

      console.log('Filling quote form...');
      await selectFirstAvailableOption(driver, QuotesPage.clientSelect, /select a client/i, 'quote client');
      await safeFill(driver, QuotesPage.issueDateField, quoteData.quote.issueDate, 'issue date');
      await safeFill(driver, QuotesPage.expiryDateField, quoteData.quote.expiryDate, 'expiry date');
      await selectOption(driver, QuotesPage.currencySelect, quoteData.quote.currency);

      await safeFill(driver, QuotesPage.itemNameField, quoteData.lineItems[0].name, 'item name');
      await safeFill(driver, QuotesPage.descriptionField, quoteData.lineItems[0].description, 'description');
      await safeFill(driver, QuotesPage.quantityField, quoteData.lineItems[0].quantity, 'quantity');
      await safeFill(driver, QuotesPage.rateField, quoteData.lineItems[0].rate, 'rate');

      if (await isVisible(driver, QuotesPage.notesField, 3000)) {
        await safeFill(driver, QuotesPage.notesField, quoteData.quote.notes, 'notes');
      }

      if (await isVisible(driver, QuotesPage.termsField, 3000)) {
        await safeFill(driver, QuotesPage.termsField, quoteData.quote.terms, 'terms');
      }

      console.log('Submitting quote...');
      await trackNetworkResponse(driver, 'quoteCreate', '/quotes');
      await safeClick(driver, QuotesPage.createQuoteButton, 'create quote button');
      const status = await waitForTrackedResponse(driver, 'quoteCreate', 30000);
      assert.equal(status, 201, `Expected quote API status to be 201, received ${status}.`);
    } catch (error) {
      console.error('Quote creation flow failed:', error.message);
      await captureFailure(driver, 'quote-error');
      throw error;
    }
  });
});
