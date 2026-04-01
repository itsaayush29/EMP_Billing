import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { invoiceData } from '../../data/invoice-data.js';
import { safeClick, safeFill, selectFirstAvailableOption, selectOption } from '../../framework/support/interactions.js';
import { waitForVisible, isVisible } from '../../framework/support/waits.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { destroyDriver } from '../../framework/core/browser.js';
import { openPath } from '../../framework/core/navigation.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { startAuthenticatedDriver } from '../../framework/core/session.js';
import {
  InvoicePage,
} from '../../pages/modules/invoice.page.js';

describe('Invoice Flow', function () {
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

  it('Invoice Flow', async function () {
    try {
      console.log('Starting invoice creation test...');
      console.log('Opening dashboard with shared authenticated session...');
      await openPath(driver, '/dashboard');

      console.log('Opening invoices module...');
      await safeClick(driver, InvoicePage.invoicesLink, 'invoices link');
      await safeClick(driver, InvoicePage.newInvoiceButton, 'new invoice button');

      console.log('Filling invoice details...');
      await selectFirstAvailableOption(driver, InvoicePage.clientSelect, /select a client/i, 'invoice client');
      await safeFill(driver, InvoicePage.issueDateField, invoiceData.invoice.issueDate, 'issue date');
      await safeFill(driver, InvoicePage.dueDateField, invoiceData.invoice.dueDate, 'due date');
      await selectOption(driver, InvoicePage.currencySelect, invoiceData.invoice.currency);
      await safeFill(driver, InvoicePage.referenceField, invoiceData.invoice.reference, 'reference');

      console.log('Filling minimal invoice details...');
      await safeFill(driver, InvoicePage.itemNameField, invoiceData.lineItems[0].name, 'item name');
      await safeFill(driver, InvoicePage.descriptionField, invoiceData.lineItems[0].description, 'description');
      await safeFill(driver, InvoicePage.quantityField, invoiceData.lineItems[0].quantity, 'quantity');
      await safeFill(driver, InvoicePage.rateField, invoiceData.lineItems[0].rate, 'rate');

      console.log('Submitting invoice...');
      await trackNetworkResponse(driver, 'invoiceCreate', '/invoices');
      await safeClick(driver, InvoicePage.createInvoiceButton, 'create invoice button');

      const status = await waitForTrackedResponse(driver, 'invoiceCreate', 30000);
      assert.equal(status, 201, `Expected invoice API status to be 201, received ${status}.`);

      const toastVisible = await isVisible(driver, InvoicePage.statusToast, 15000);
      if (toastVisible) {
        const toast = await waitForVisible(driver, InvoicePage.statusToast, 15000);
        console.log('Toast message:', (await toast.getText()) || '');
      } else {
        console.log('Waiting for invoice page to settle...');
        await driver.sleep(2000);
      }
    } catch (error) {
      console.error('Invoice flow failed:', error.message);
      await captureFailure(driver, 'invoice-error');
      throw error;
    }
  });
});
