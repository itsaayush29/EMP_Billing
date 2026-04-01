import assert from 'node:assert/strict';
import { until } from 'selenium-webdriver';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { registrationScenarios } from '../../data/registration-scenarios.js';
import { safeClick, safeFill } from '../../framework/support/interactions.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { createDriver, destroyDriver } from '../../framework/core/browser.js';
import { openPath } from '../../framework/core/navigation.js';
import { trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { waitForVisible } from '../../framework/support/waits.js';
import { LoginPage } from '../../pages/auth/login.page.js';
import { RegistrationPage } from '../../pages/auth/registration.page.js';

async function openRegistrationPage(driver) {
  console.log('Opening login page...');
  await openPath(driver, '/login');
  await waitForVisible(driver, LoginPage.signInHeading, 30000);

  console.log('Opening registration form...');
  await safeClick(driver, LoginPage.createFreeLink, 'create one free link');
  await waitForVisible(driver, RegistrationPage.createAccountHeading, 30000);
}

async function fillRegistrationForm(driver, user) {
  if (user.firstName) {
    await safeFill(driver, RegistrationPage.firstNameField, user.firstName, 'first name');
  }

  if (user.lastName) {
    await safeFill(driver, RegistrationPage.lastNameField, user.lastName, 'last name');
  }

  if (user.workEmail) {
    await safeFill(driver, RegistrationPage.workEmailField, user.workEmail, 'work email');
  }

  if (user.organizationName) {
    await safeFill(driver, RegistrationPage.organizationNameField, user.organizationName, 'organization name');
  }

  if (user.password) {
    await safeFill(driver, RegistrationPage.passwordField, user.password, 'password');
  }

  return {
    firstName: RegistrationPage.firstNameField,
    lastName: RegistrationPage.lastNameField,
    workEmail: RegistrationPage.workEmailField,
    organizationName: RegistrationPage.organizationNameField,
    password: RegistrationPage.passwordField,
  };
}

async function expectFieldToBeInvalid(driver, locator) {
  const element = await driver.wait(until.elementLocated(locator), 30000);
  await driver.wait(async () => !(await driver.executeScript('return arguments[0].checkValidity();', element)), 30000);
}

describe('Registration Page Flow', function () {
  this.timeout(120000);

  let driver;
  let profileDir;

  beforeEach(async () => {
    const created = await createDriver();
    driver = created.driver;
    profileDir = created.profileDir;
  });

  afterEach(async () => {
    await destroyDriver(driver, profileDir);
    driver = undefined;
    profileDir = undefined;
  });

  it(registrationScenarios.validRegistration.name, async function () {
    try {
      await openRegistrationPage(driver);
      await fillRegistrationForm(driver, registrationScenarios.validRegistration.user);
      await trackNetworkResponse(driver, 'registerAccount', '/auth/register');

      await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');
      console.log('Waiting for registration result...');

      const responseStatus = await waitForTrackedResponse(driver, 'registerAccount', 30000);
      assert.equal(responseStatus, 201, `Expected registration API status to be 201, received ${responseStatus}.`);
    } catch (error) {
      console.error('Registration flow failed:', error.message);
      await captureFailure(driver, 'registration-error');
      throw error;
    }
  });

  it(registrationScenarios.missingFirstName.name, async function () {
    await openRegistrationPage(driver);
    const fields = await fillRegistrationForm(driver, registrationScenarios.missingFirstName.user);

    await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');

    await expectFieldToBeInvalid(driver, fields.firstName);
    const createAccountHeading = await waitForVisible(driver, RegistrationPage.createAccountHeading, 30000);
    assert.equal(await createAccountHeading.isDisplayed(), true);
  });

  it(registrationScenarios.invalidEmail.name, async function () {
    await openRegistrationPage(driver);
    const fields = await fillRegistrationForm(driver, registrationScenarios.invalidEmail.user);

    await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');

    await expectFieldToBeInvalid(driver, fields.workEmail);
    const createAccountHeading = await waitForVisible(driver, RegistrationPage.createAccountHeading, 30000);
    assert.equal(await createAccountHeading.isDisplayed(), true);
  });
});
