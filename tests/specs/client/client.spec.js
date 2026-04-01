import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { clientData } from '../../data/client-data.js';
import { safeClick, safeFill, selectOption } from '../../framework/support/interactions.js';
import { sendEnter, waitForVisible } from '../../framework/support/waits.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { destroyDriver } from '../../framework/core/browser.js';
import { openPath } from '../../framework/core/navigation.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { startAuthenticatedDriver } from '../../framework/core/session.js';
import { ClientPage } from '../../pages/modules/client.page.js';

describe('Client Module Flow', function () {
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

  it('Client Module Flow', async function () {
    try {
      console.log('Opening dashboard with shared authenticated session...');
      await openPath(driver, '/dashboard');
      await waitForVisible(driver, ClientPage.dashboardLink, 30000);

      console.log('Opening clients module...');
      await safeClick(driver, ClientPage.clientsLink, 'clients link');
      await waitForVisible(driver, ClientPage.newClientButton, 30000);

      console.log('Opening new client form...');
      await safeClick(driver, ClientPage.newClientButton, 'new client button');
      await waitForVisible(driver, ClientPage.newClientHeading, 30000);

      console.log('Filling client form...');
      await safeFill(driver, ClientPage.clientNameField, clientData.client.name, 'client name');
      await safeFill(driver, ClientPage.displayNameField, clientData.client.displayName, 'display name');
      await safeFill(driver, ClientPage.emailField, clientData.client.email, 'client email');
      await safeFill(driver, ClientPage.phoneField, clientData.client.phone, 'phone');
      await selectOption(driver, ClientPage.paymentTermsSelect, '0');
      await safeFill(driver, ClientPage.gstinField, clientData.client.gstin, 'gstin');
      await safeFill(driver, ClientPage.addressLineField, clientData.client.addressLine, 'address line');
      await safeFill(driver, ClientPage.cityField, clientData.client.city, 'city');
      await safeFill(driver, ClientPage.stateField, clientData.client.state, 'state');
      await safeFill(driver, ClientPage.postalCodeField, clientData.client.postalCode, 'postal code');
      await safeFill(driver, ClientPage.countryField, clientData.client.country, 'country');

      await safeFill(driver, ClientPage.tagField, clientData.client.tag, 'tag');
      await sendEnter(driver, ClientPage.tagField);

      await safeFill(driver, ClientPage.notesField, clientData.client.notes, 'notes');
      await safeClick(driver, ClientPage.addFieldButton, 'add field button');

      await waitForVisible(driver, ClientPage.valueField, 30000);
      await safeFill(driver, ClientPage.valueField, clientData.client.customFieldValue, 'custom field value');

      console.log('Submitting client form...');
      await trackNetworkResponse(driver, 'clientCreate', '/clients');
      await safeClick(driver, ClientPage.createClientButton, 'create client button');

      const status = await waitForTrackedResponse(driver, 'clientCreate', 30000);
      console.log(`Client API status: ${status}`);
      assert.ok([200, 201].includes(status));
      assert.equal(status, 201);
    } catch (error) {
      console.error('Client module flow failed:', error.message);
      await captureFailure(driver, 'client-error');
      throw error;
    }
  });
});
