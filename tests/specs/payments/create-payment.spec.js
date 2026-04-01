import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { paymentData } from '../../data/payment-data.js';
import { safeClick, safeFill, selectFirstAvailableOption, selectOption } from '../../framework/support/interactions.js';
import { waitForVisible, isVisible } from '../../framework/support/waits.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { destroyDriver } from '../../framework/core/browser.js';
import { openPath } from '../../framework/core/navigation.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { startAuthenticatedDriver } from '../../framework/core/session.js';
import {
  PaymentsPage,
} from '../../pages/modules/payments.page.js';

describe('Payments Module Flow', function () {
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

  it('Payments Module Flow', async function () {
    try {
      console.log('Opening dashboard with shared authenticated session...');
      await openPath(driver, '/dashboard');
      await waitForVisible(driver, PaymentsPage.dashboardLink, 30000);

      console.log('Opening payments module...');
      await safeClick(driver, PaymentsPage.paymentsLink, 'payments link');
      await waitForVisible(driver, PaymentsPage.recordPaymentButton, 30000);

      console.log('Opening record payment form...');
      await safeClick(driver, PaymentsPage.recordPaymentButton, 'record payment button');

      console.log('Filling payment form...');
      await selectFirstAvailableOption(driver, PaymentsPage.clientSelect, /select a client/i, 'payment client');
      if (await isVisible(driver, PaymentsPage.invoiceSelect, 3000)) {
        await selectFirstAvailableOption(driver, PaymentsPage.invoiceSelect, /no specific invoice/i, 'payment invoice');
      }
      await safeFill(driver, PaymentsPage.amountField, paymentData.payment.amount, 'amount');
      await safeFill(driver, PaymentsPage.dateField, paymentData.payment.date, 'date');
      await selectOption(driver, PaymentsPage.paymentMethodSelect, paymentData.payment.method);
      await safeFill(driver, PaymentsPage.referenceField, paymentData.payment.reference, 'reference');
      await safeFill(driver, PaymentsPage.notesField, paymentData.payment.notes, 'notes');

      console.log('Submitting payment...');
      await trackNetworkResponse(driver, 'paymentCreate', '/payments');
      const submitButtons = await driver.findElements(PaymentsPage.recordPaymentButton);
      const submitPaymentButton = submitButtons.at(-1);
      if (!submitPaymentButton) {
        throw new Error('Submit payment button was not found.');
      }
      await submitPaymentButton.click();

      const status = await waitForTrackedResponse(driver, 'paymentCreate', 30000);
      console.log(`Payment API status: ${status}`);
      assert.equal(status, 201, `Expected payment API status to be 201, received ${status}.`);
    } catch (error) {
      console.error('Payments module flow failed:', error.message);
      await captureFailure(driver, 'payment-error');
      throw error;
    }
  });
});
