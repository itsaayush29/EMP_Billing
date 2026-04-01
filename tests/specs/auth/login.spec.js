import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { authData } from '../../data/auth-data.js';
import { createDriver, destroyDriver } from '../../framework/core/browser.js';
import { trackNetworkResponse, waitForTrackedResponse, getTrackedResponseCount } from '../../framework/core/network.js';
import { waitForVisible, isVisible } from '../../framework/support/waits.js';
import { safeClick, safeFill } from '../../framework/support/interactions.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { env } from '../../framework/config/env.js';
import { LoginPage } from '../../pages/auth/login.page.js';

async function openLoginPage(driver) {
  await driver.get(`${env.baseUrl}/login`);
  await waitForVisible(driver, LoginPage.signInHeading, 30000);
}

async function submitLogin(driver, email, password) {
  if (email !== undefined) {
    await safeFill(driver, LoginPage.emailField, email, 'email');
  }

  if (password !== undefined) {
    await safeFill(driver, LoginPage.passwordField, password, 'password');
  }

  await safeClick(driver, LoginPage.signInButton, 'sign in button');
}

async function clearField(driver, locator, fieldName) {
  const element = await waitForVisible(driver, locator, 10000);
  await driver.executeScript(
    `
      arguments[0].focus();
      arguments[0].value = '';
      arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
    `,
    element
  );
  console.log(`Cleared ${fieldName}`);
}

async function clearLoginForm(driver) {
  await clearField(driver, LoginPage.emailField, 'email');
  await clearField(driver, LoginPage.passwordField, 'password');
}

async function expectFieldToBeInvalid(driver, locator) {
  await driver.wait(async () => {
    const element = await waitForVisible(driver, locator, 3000);
    const state = await driver.executeScript(
      `
        return {
          checkValidity: typeof arguments[0].checkValidity === 'function' ? arguments[0].checkValidity() : true,
          validationMessage: arguments[0].validationMessage || '',
          ariaInvalid: arguments[0].getAttribute('aria-invalid') || '',
          required: arguments[0].required === true,
          value: arguments[0].value || ''
        };
      `,
      element
    );

    return (
      state.checkValidity === false ||
      state.validationMessage.length > 0 ||
      state.ariaInvalid === 'true' ||
      (state.required && state.value === '')
    );
  }, 10000);
}

async function expectLoginFormToRemainVisible(driver) {
  const emailField = await waitForVisible(driver, LoginPage.emailField, 10000);
  const passwordField = await waitForVisible(driver, LoginPage.passwordField, 10000);
  assert.equal(await emailField.isDisplayed(), true);
  assert.equal(await passwordField.isDisplayed(), true);
}

describe('Login Page Flow', function () {
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

  it('verifies successful login with valid credentials', async function () {
    try {
      await openLoginPage(driver);
      await trackNetworkResponse(driver, 'loginSuccess', 'login|auth');
      await submitLogin(driver, authData.login.email, authData.login.password);

      const status = await waitForTrackedResponse(driver, 'loginSuccess', 30000);
      assert.ok([200, 201].includes(status), `Expected successful login status 200/201, received ${status}.`);
      const authenticated = await waitForVisible(driver, LoginPage.authenticatedMarker, 60000);
      assert.equal(await authenticated.isDisplayed(), true);
    } catch (error) {
      await captureFailure(driver, 'login-valid-error');
      throw error;
    }
  });

  it('verifies login fails with invalid credentials', async function () {
    try {
      await openLoginPage(driver);
      await trackNetworkResponse(driver, 'loginInvalid', 'login|auth');
      await submitLogin(driver, authData.invalidLogin.email, authData.invalidLogin.password);

      const status = await waitForTrackedResponse(driver, 'loginInvalid', 30000);
      assert.ok(![200, 201].includes(status), `Expected invalid login to fail, received ${status}.`);
      assert.equal(await isVisible(driver, LoginPage.authenticatedMarker, 5000), false);
      await expectLoginFormToRemainVisible(driver);
    } catch (error) {
      await captureFailure(driver, 'login-invalid-error');
      throw error;
    }
  });

  it('verifies invalid email format validation', async function () {
    await openLoginPage(driver);
    await clearLoginForm(driver);
    await trackNetworkResponse(driver, 'loginInvalidEmailFormat', 'login|auth');
    await submitLogin(driver, 'invalid-email-format', authData.login.password);

    await expectFieldToBeInvalid(driver, LoginPage.emailField);
    assert.equal(await getTrackedResponseCount(driver, 'loginInvalidEmailFormat'), 0);
    await expectLoginFormToRemainVisible(driver);
  });

  it('verifies password is masked', async function () {
    await openLoginPage(driver);
    const passwordField = await waitForVisible(driver, LoginPage.passwordField, 10000);
    assert.equal(await passwordField.getAttribute('type'), 'password');
  });

  it('verifies multiple clicks on login button do not trigger multiple requests', async function () {
    await openLoginPage(driver);
    await safeFill(driver, LoginPage.emailField, authData.login.email, 'email');
    await safeFill(driver, LoginPage.passwordField, authData.login.password, 'password');
    await trackNetworkResponse(driver, 'loginMultiClick', 'login|auth');

    const button = await waitForVisible(driver, LoginPage.signInButton, 10000);
    await button.click();
    await button.click();
    await button.click();

    await driver.sleep(3000);
    const requestCount = await getTrackedResponseCount(driver, 'loginMultiClick');
    assert.ok(requestCount <= 1, `Expected at most one login request, received ${requestCount}.`);
  });
});
