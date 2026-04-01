import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { vendorData } from '../../data/vendor-data.js';
import { expectSuccessToast } from '../../framework/support/assertions.js';
import { safeClick, safeFill } from '../../framework/support/interactions.js';
import { isVisible, waitForNotVisible, waitForVisible } from '../../framework/support/waits.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { destroyDriver } from '../../framework/core/browser.js';
import { openPath } from '../../framework/core/navigation.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { startAuthenticatedDriver } from '../../framework/core/session.js';
import { VendorPage } from '../../pages/modules/vendor.page.js';

describe('Vendor Creation Flow', function () {
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

  it('Vendor Creation Flow', async function () {
    try {
      console.log('Starting vendor creation test...');
      console.log('Opening dashboard with shared authenticated session...');
      await openPath(driver, '/dashboard');

      await safeClick(driver, VendorPage.vendorsLink, 'vendors link');
      const newVendorButtons = await driver.findElements(VendorPage.newVendorButtons);
      if (!newVendorButtons.length) {
        throw new Error('New vendor button was not found.');
      }
      await newVendorButtons[0].click();
      await waitForVisible(driver, VendorPage.newVendorHeading, 30000);

      await safeFill(driver, VendorPage.vendorNameField, vendorData.vendor.name, 'vendor name');
      await safeFill(driver, VendorPage.companyField, vendorData.vendor.company, 'company');
      await safeFill(driver, VendorPage.emailField, vendorData.vendor.email, 'vendor email');
      await safeFill(driver, VendorPage.phoneField, vendorData.vendor.phone, 'phone');
      await safeFill(driver, VendorPage.taxIdField, vendorData.vendor.taxId, 'tax id');
      await safeFill(driver, VendorPage.addressLine1Field, vendorData.vendor.addressLine1, 'address line 1');
      await safeFill(driver, VendorPage.addressLine2Field, vendorData.vendor.addressLine2, 'address line 2');
      await safeFill(driver, VendorPage.cityField, vendorData.vendor.city, 'city');
      await safeFill(driver, VendorPage.stateField, vendorData.vendor.state, 'state');
      await safeFill(driver, VendorPage.postalCodeField, vendorData.vendor.postalCode, 'postal code');
      await safeFill(driver, VendorPage.countryField, vendorData.vendor.country, 'country');
      await safeFill(driver, VendorPage.notesField, vendorData.vendor.notes, 'notes');

      await trackNetworkResponse(driver, 'vendorCreate', '/vendors');
      await safeClick(driver, VendorPage.createVendorButton, 'create vendor button');
      const status = await waitForTrackedResponse(driver, 'vendorCreate', 30000);
      assert.equal(status, 201, `Expected vendor API status to be 201, received ${status}.`);

      const toastVisible = await isVisible(driver, VendorPage.statusToast, 15000);
      if (toastVisible) {
        await expectSuccessToast(driver);
      } else {
        await waitForNotVisible(driver, VendorPage.newVendorHeading, 15000);
      }
    } catch (error) {
      console.error('Vendor creation flow failed:', error.message);
      await captureFailure(driver, 'vendor-error');
      throw error;
    }
  });
});
